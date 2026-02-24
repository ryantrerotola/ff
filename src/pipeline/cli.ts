import { prisma } from "@/lib/prisma";
import { validateConfig, PIPELINE_CONFIG } from "./config";
import { createLogger, progressBar } from "./utils/logger";
import { mapConcurrent } from "./utils/rate-limit";
import { slugify } from "./utils/slug";
import { SEED_PATTERNS } from "./seed-patterns";

import { searchYouTube, youtubeVideoUrl, scoreYouTubeResult } from "./scrapers/youtube";
import { discoverBlogContent, scrapeArbitraryUrl, scoreBlogResult } from "./scrapers/blogs";

import { extractPattern, calculateConfidence } from "./extraction/extractor";
import { normalizePatternMaterials, groupExtractedPatterns } from "./normalization/normalizer";
import { buildConsensus } from "./normalization/consensus";
import { ingestConsensusPattern, markAsIngested } from "./ingestion/ingest";

import { scrapeNews } from "./scrapers/news";
import { discoverTechniqueVideos } from "./scrapers/techniques";

import {
  createStagedSource,
  updateStagedSourceContent,
  getStagedSourcesByStatus,
  createStagedExtraction,
  getStagedExtractions,
  updateExtractionStatus,
  getPipelineStats,
} from "@/services/staged.service";

import type { ExtractedPattern, RawYouTubeResult } from "./types";

const log = createLogger("pipeline");

// ─── COMMAND: discover ──────────────────────────────────────────────────────

async function cmdDiscover(args: string[]) {
  const patterns = args.length > 0
    ? args
    : SEED_PATTERNS.map((p) => p.name);

  log.info(`Discovering sources for ${patterns.length} patterns`);

  let totalSources = 0;

  for (let i = 0; i < patterns.length; i++) {
    const patternName = patterns[i]!;
    console.log(progressBar(i + 1, patterns.length, patternName));

    // YouTube discovery
    try {
      const ytResults = await searchYouTube(patternName);

      // Sort by relevance score and take top results
      const scored = ytResults
        .map((r) => ({ result: r, score: scoreYouTubeResult(r) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const { result } of scored) {
        const url = youtubeVideoUrl(result.videoId);

        const source = await createStagedSource({
          sourceType: "youtube",
          url,
          title: result.title,
          creatorName: result.channelTitle,
          platform: "YouTube",
          patternQuery: patternName,
          metadata: {
            videoId: result.videoId,
            viewCount: result.viewCount,
            likeCount: result.likeCount,
            publishedAt: result.publishedAt,
          },
        });

        // Store title + description (and transcript if available) as content
        const content = buildYouTubeContent(result);
        await updateStagedSourceContent(source.id, content);

        totalSources++;
      }
    } catch (err) {
      log.error("YouTube discovery failed", {
        pattern: patternName,
        error: String(err),
      });
    }

    // Blog discovery
    try {
      const blogResults = await discoverBlogContent(patternName);

      const scored = blogResults
        .map((r) => ({ result: r, score: scoreBlogResult(r) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const { result } of scored) {
        const source = await createStagedSource({
          sourceType: "blog",
          url: result.url,
          title: result.title,
          creatorName: result.author ?? undefined,
          platform: result.siteName,
          patternQuery: patternName,
        });

        await updateStagedSourceContent(source.id, result.content);
        totalSources++;
      }
    } catch (err) {
      log.error("Blog discovery failed", {
        pattern: patternName,
        error: String(err),
      });
    }
  }

  log.success(`Discovery complete: ${totalSources} sources found`);
}

/**
 * Build a combined text content from YouTube result for extraction.
 */
function buildYouTubeContent(result: RawYouTubeResult): string {
  const parts: string[] = [];

  parts.push(`Title: ${result.title}`);
  parts.push(`Channel: ${result.channelTitle}`);

  if (result.description) {
    parts.push(`\nDescription:\n${result.description}`);
  }

  if (result.transcript) {
    parts.push(`\nTranscript:\n${result.transcript}`);
  }

  return parts.join("\n");
}

// ─── COMMAND: scrape ────────────────────────────────────────────────────────

async function cmdScrape() {
  const discovered = await getStagedSourcesByStatus("discovered");

  if (discovered.length === 0) {
    log.info("No discovered sources to scrape");
    return;
  }

  log.info(`Scraping ${discovered.length} discovered sources`);

  let scraped = 0;
  let failed = 0;

  await mapConcurrent(
    discovered,
    PIPELINE_CONFIG.scraping.concurrency,
    async (source, idx) => {
      console.log(
        progressBar(idx + 1, discovered.length, source.title ?? source.url)
      );

      try {
        if (source.sourceType === "youtube") {
          // Try to fetch transcript for YouTube videos that only have title/description
          const metadata = source.metadata as { videoId?: string } | null;
          const videoId = metadata?.videoId;

          if (videoId) {
            const { fetchTranscript } = await import("./scrapers/youtube");
            const transcript = await fetchTranscript(videoId);

            if (transcript) {
              // Re-build content with transcript included
              const content = `Title: ${source.title ?? ""}\nCreator: ${source.creatorName ?? ""}\n\nTranscript:\n${transcript}`;
              await updateStagedSourceContent(source.id, content);
              scraped++;
            } else if (source.rawContent) {
              // Already has title/description content from discovery — mark as scraped
              await updateStagedSourceContent(source.id, source.rawContent);
              scraped++;
              log.info("No transcript, using description content", { videoId });
            } else {
              failed++;
            }
          }
        } else if (source.sourceType === "blog") {
          const result = await scrapeArbitraryUrl(source.url);
          if (result) {
            await updateStagedSourceContent(source.id, result.content);
            scraped++;
          } else {
            failed++;
          }
        }
      } catch (err) {
        log.error("Scrape failed", {
          url: source.url,
          error: String(err),
        });
        failed++;
      }
    }
  );

  log.success(`Scrape complete: ${scraped} scraped, ${failed} failed`);
}

// ─── COMMAND: extract ───────────────────────────────────────────────────────

async function cmdExtract() {
  const scraped = await getStagedSourcesByStatus("scraped");

  if (scraped.length === 0) {
    log.info("No scraped sources to extract");
    return;
  }

  log.info(`Extracting from ${scraped.length} scraped sources`);

  let extracted = 0;
  let failed = 0;

  // Process sequentially to respect Claude API rate limits
  for (let i = 0; i < scraped.length; i++) {
    const source = scraped[i]!;
    console.log(
      progressBar(i + 1, scraped.length, source.title ?? source.url)
    );

    if (!source.rawContent) {
      log.warn("No content for source", { id: source.id });
      failed++;
      continue;
    }

    try {
      const data = await extractPattern(
        source.rawContent,
        source.patternQuery,
        source.sourceType as "youtube" | "blog"
      );

      if (data) {
        const confidence = calculateConfidence(
          data,
          source.sourceType as "youtube" | "blog",
          source.rawContent.length
        );

        await createStagedExtraction({
          sourceId: source.id,
          patternName: data.patternName,
          normalizedSlug: slugify(data.patternName),
          extractedData: data as unknown as Record<string, unknown>,
          confidence,
        });

        extracted++;
      } else {
        failed++;
      }
    } catch (err) {
      log.error("Extraction failed", {
        id: source.id,
        error: String(err),
      });
      failed++;
    }
  }

  log.success(`Extraction complete: ${extracted} extracted, ${failed} failed`);
}

// ─── COMMAND: normalize ─────────────────────────────────────────────────────

async function cmdNormalize() {
  const { data: extractions } = await getStagedExtractions({
    status: "extracted",
    limit: 1000,
  });

  if (extractions.length === 0) {
    log.info("No extractions to normalize");
    return;
  }

  log.info(`Normalizing ${extractions.length} extractions`);

  // Parse extracted data back to typed objects
  const patterns: ExtractedPattern[] = extractions
    .map((e) => e.extractedData as unknown as ExtractedPattern)
    .filter((p): p is ExtractedPattern => p !== null && p.patternName !== "");

  // Group by pattern identity
  const groups = groupExtractedPatterns(patterns);

  log.info(`Found ${groups.length} unique patterns from ${patterns.length} extractions`);

  for (const group of groups) {
    if (group.length === 0) continue;

    // Normalize materials sequentially to avoid race conditions on canonical upserts
    const normalized = [];
    for (const p of group) {
      normalized.push(await normalizePatternMaterials(p));
    }

    // Build consensus
    const consensus = buildConsensus(normalized);

    log.info("Consensus built", {
      pattern: consensus.patternName,
      confidence: String(consensus.overallConfidence),
      sources: String(consensus.sourceCount),
      materials: String(consensus.materials.length),
    });

    // Update extraction statuses
    for (const extraction of extractions) {
      const data = extraction.extractedData as unknown as ExtractedPattern;
      if (
        data &&
        group.some((g) => g.patternName === data.patternName)
      ) {
        await updateExtractionStatus(extraction.id, "normalized");
      }
    }
  }

  log.success("Normalization complete");
}

// ─── COMMAND: ingest ────────────────────────────────────────────────────────

async function cmdIngest() {
  const { data: approved } = await getStagedExtractions({
    status: "approved",
    limit: 1000,
  });

  if (approved.length === 0) {
    log.info("No approved extractions to ingest");
    return;
  }

  // Group by slug for consensus building
  const bySlug = new Map<string, typeof approved>();

  for (const extraction of approved) {
    const slug = extraction.normalizedSlug;
    const existing = bySlug.get(slug) ?? [];
    existing.push(extraction);
    bySlug.set(slug, existing);
  }

  log.info(`Ingesting ${bySlug.size} patterns`);

  for (const [slug, group] of bySlug) {
    const patterns = group
      .map((e) => e.extractedData as unknown as ExtractedPattern)
      .filter((p): p is ExtractedPattern => p !== null);

    if (patterns.length === 0) continue;

    // Build consensus from approved extractions
    const consensus = buildConsensus(patterns);

    // Collect source URLs for resources
    const sourceUrls = group.map((e) => ({
      url: e.source.url,
      type: e.source.sourceType,
      title: e.source.title ?? consensus.patternName,
      creator: e.source.creatorName ?? "Unknown",
      platform: e.source.platform ?? "Unknown",
    }));

    try {
      await ingestConsensusPattern(consensus, sourceUrls);
      await markAsIngested(group.map((e) => e.id));
      log.success("Ingested", { pattern: consensus.patternName, slug });
    } catch (err) {
      log.error("Ingestion failed", {
        slug,
        error: String(err),
      });
    }
  }

  log.success("Ingestion complete");
}

// ─── COMMAND: auto-approve ──────────────────────────────────────────────────

async function cmdAutoApprove() {
  const threshold = PIPELINE_CONFIG.normalization.confidenceThreshold;

  const { data: normalized } = await getStagedExtractions({
    status: "normalized",
    minConfidence: threshold,
    limit: 1000,
  });

  if (normalized.length === 0) {
    log.info("No high-confidence extractions to auto-approve");
    return;
  }

  log.info(
    `Auto-approving ${normalized.length} extractions above ${threshold} confidence`
  );

  for (const extraction of normalized) {
    await updateExtractionStatus(
      extraction.id,
      "approved",
      `Auto-approved: confidence ${extraction.confidence} >= ${threshold}`
    );
  }

  log.success(`Auto-approved ${normalized.length} extractions`);
}

// ─── COMMAND: import-url ────────────────────────────────────────────────────

async function cmdImportUrl(args: string[]) {
  const url = args[0];
  const patternQuery = args[1] ?? "manual import";

  if (!url) {
    console.error("Usage: pipeline import-url <url> [pattern-name]");
    process.exit(1);
  }

  log.info("Importing URL", { url });

  const isYoutube =
    url.includes("youtube.com") || url.includes("youtu.be");

  if (isYoutube) {
    // Extract video ID
    const videoIdMatch = url.match(
      /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = videoIdMatch?.[1];

    if (!videoId) {
      log.error("Could not extract YouTube video ID from URL");
      process.exit(1);
    }

    const { fetchTranscript } = await import("./scrapers/youtube");
    const transcript = await fetchTranscript(videoId);

    const source = await createStagedSource({
      sourceType: "youtube",
      url,
      patternQuery,
      platform: "YouTube",
      metadata: { videoId },
    });

    if (transcript) {
      await updateStagedSourceContent(
        source.id,
        `Title: ${patternQuery}\n\nTranscript:\n${transcript}`
      );
      log.success("YouTube video imported with transcript");
    } else {
      log.warn("No transcript available for this video");
    }
  } else {
    const result = await scrapeArbitraryUrl(url);

    if (!result) {
      log.error("Failed to scrape URL");
      process.exit(1);
    }

    const source = await createStagedSource({
      sourceType: "blog",
      url,
      title: result.title,
      creatorName: result.author ?? undefined,
      platform: result.siteName,
      patternQuery,
    });

    await updateStagedSourceContent(source.id, result.content);
    log.success("Blog article imported", { title: result.title });
  }
}

// ─── COMMAND: status ────────────────────────────────────────────────────────

async function cmdStatus() {
  const stats = await getPipelineStats();

  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│         FlyPatternDB Pipeline Status     │");
  console.log("├─────────────────────────────────────────┤");
  console.log(`│ Sources discovered:  ${String(stats.sources.discovered).padStart(8)} │`);
  console.log(`│ Sources scraped:     ${String(stats.sources.scraped).padStart(8)} │`);
  console.log(`│ Sources extracted:   ${String(stats.sources.extracted).padStart(8)} │`);
  console.log("├─────────────────────────────────────────┤");
  console.log(`│ Total extractions:   ${String(stats.extractions.total).padStart(8)} │`);
  console.log(`│ High confidence:     ${String(stats.extractions.highConfidence).padStart(8)} │`);
  console.log(`│ Low confidence:      ${String(stats.extractions.lowConfidence).padStart(8)} │`);
  console.log("├─────────────────────────────────────────┤");
  console.log(`│ Patterns normalized: ${String(stats.patterns.normalized).padStart(8)} │`);
  console.log(`│ Patterns approved:   ${String(stats.patterns.approved).padStart(8)} │`);
  console.log(`│ Patterns rejected:   ${String(stats.patterns.rejected).padStart(8)} │`);
  console.log(`│ Patterns ingested:   ${String(stats.patterns.ingested).padStart(8)} │`);
  console.log("└─────────────────────────────────────────┘\n");
}

// ─── COMMAND: run (full pipeline) ───────────────────────────────────────────

async function cmdRun(args: string[]) {
  log.info("Running full pipeline");

  await cmdDiscover(args);
  await cmdScrape();
  await cmdExtract();
  await cmdNormalize();
  await cmdAutoApprove();
  await cmdIngest();
  await cmdStatus();

  log.success("Full pipeline run complete");
}

// ─── COMMAND: news ──────────────────────────────────────────────────────────

async function cmdNews() {
  log.info("Scraping fly fishing news");
  const count = await scrapeNews();
  log.success(`Done — ${count} articles saved/updated`);
}

// ─── COMMAND: techniques ──────────────────────────────────────────────────

async function cmdTechniques(args: string[]) {
  const slug = args[0] ?? undefined;
  log.info(slug ? `Discovering videos for technique: ${slug}` : "Discovering videos for all techniques");
  const count = await discoverTechniqueVideos(slug);
  log.success(`Done — ${count} new technique videos added`);
}

// ─── COMMAND: add-techniques ─────────────────────────────────────────────

async function cmdAddTechniques(args: string[]) {
  if (args.length === 0) {
    console.error("Usage: pipeline add-techniques <name1> <name2> ...");
    console.error('Example: pipeline add-techniques "Dubbing Loop" "Parachute Post" "CDC Puff"');
    process.exit(1);
  }

  const CATEGORY_HINTS: Record<string, string> = {
    thread: "thread_work", whip: "thread_work", bobbin: "thread_work",
    dubbing: "body_techniques", body: "body_techniques", ribbing: "body_techniques",
    chenille: "body_techniques", peacock: "body_techniques", tinsel: "body_techniques",
    floss: "body_techniques", wire: "body_techniques", wrap: "body_techniques",
    hackle: "hackle_techniques", palmer: "hackle_techniques", collar: "hackle_techniques",
    parachute: "hackle_techniques",
    wing: "wing_techniques", elk: "wing_techniques", deer: "wing_techniques",
    cdc: "wing_techniques", hair: "wing_techniques", feather: "wing_techniques",
    head: "head_finishing", cement: "head_finishing", resin: "head_finishing",
    uv: "head_finishing", finish: "head_finishing",
    vise: "fundamentals", hook: "fundamentals", setup: "fundamentals",
    stacker: "materials_prep", prep: "materials_prep", clean: "materials_prep",
    euro: "specialty", spin: "specialty", articulated: "specialty",
  };

  function guessCategory(name: string): string {
    const lower = name.toLowerCase();
    for (const [hint, cat] of Object.entries(CATEGORY_HINTS)) {
      if (lower.includes(hint)) return cat;
    }
    return "specialty";
  }

  function guessDifficulty(name: string): string {
    const lower = name.toLowerCase();
    if (["advanced", "euro", "articulated", "spinning deer", "complex", "extended"].some((k) => lower.includes(k))) return "advanced";
    if (["basic", "simple", "setup", "starting", "intro", "beginner"].some((k) => lower.includes(k))) return "beginner";
    return "intermediate";
  }

  log.info(`Adding ${args.length} technique(s)`);

  let added = 0;
  let skipped = 0;

  for (const name of args) {
    const techSlug = slugify(name);
    const category = guessCategory(name);
    const difficulty = guessDifficulty(name);

    const existing = await prisma.tyingTechnique.findUnique({
      where: { slug: techSlug },
    });

    if (existing) {
      log.info(`Skipped (already exists): ${name}`);
      skipped++;
      continue;
    }

    await prisma.tyingTechnique.create({
      data: {
        name,
        slug: techSlug,
        category: category as never,
        difficulty: difficulty as never,
        description: `Learn the ${name} technique for fly tying. This technique is essential for creating effective fly patterns.`,
        keyPoints: [
          `Practice ${name} with different materials to build proficiency`,
          "Start slow and focus on consistency before speed",
          "Watch the recommended video tutorials below for visual guidance",
        ],
      },
    });

    log.success(`Added: ${name} (${category}, ${difficulty})`);
    added++;
  }

  log.success(`Done — ${added} added, ${skipped} skipped`);

  if (added > 0) {
    log.info("Tip: Run 'npm run pipeline:techniques' to discover videos for the new techniques");
  }
}

// ─── COMMAND: add-hatches ────────────────────────────────────────────────

async function cmdAddHatches(args: string[]) {
  if (args.length === 0) {
    console.error(`Usage: pipeline add-hatches <json-file>
       pipeline add-hatches --inline '<json-array>'

JSON format (array of objects):
  [{
    "waterBody": "South Platte River",
    "region": "Rocky Mountains",
    "state": "CO",
    "month": 3,
    "species": "Baetis",
    "insectName": "Blue-Winged Olive",
    "insectType": "mayfly",
    "patternName": "Pheasant Tail Nymph",
    "timeOfDay": "afternoon",
    "notes": "Optional notes"
  }]

insectType must be: mayfly, caddis, stonefly, midge, terrestrial, other`);
    process.exit(1);
  }

  const VALID_INSECT_TYPES = ["mayfly", "caddis", "stonefly", "midge", "terrestrial", "other"];

  let rawJson: string;
  if (args[0] === "--inline") {
    rawJson = args.slice(1).join(" ");
  } else {
    const fs = await import("fs");
    const filePath = args[0]!;
    if (!fs.existsSync(filePath)) {
      log.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    rawJson = fs.readFileSync(filePath, "utf-8");
  }

  let entries: Array<{
    waterBody: string;
    region: string;
    state?: string;
    month: number;
    species: string;
    insectName: string;
    insectType: string;
    patternName: string;
    timeOfDay?: string;
    targetFish?: string;
    notes?: string;
  }>;

  try {
    entries = JSON.parse(rawJson);
    if (!Array.isArray(entries)) {
      log.error("JSON must be an array of hatch entries");
      process.exit(1);
    }
  } catch (e) {
    log.error(`Invalid JSON: ${String(e)}`);
    process.exit(1);
  }

  // Validate entries
  const errors: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (!e.waterBody) errors.push(`Entry ${i}: missing waterBody`);
    if (!e.region) errors.push(`Entry ${i}: missing region`);
    if (!e.month || e.month < 1 || e.month > 12) errors.push(`Entry ${i}: month must be 1-12`);
    if (!e.species) errors.push(`Entry ${i}: missing species`);
    if (!e.insectName) errors.push(`Entry ${i}: missing insectName`);
    if (!e.insectType || !VALID_INSECT_TYPES.includes(e.insectType)) {
      errors.push(`Entry ${i}: insectType must be one of: ${VALID_INSECT_TYPES.join(", ")}`);
    }
    if (!e.patternName) errors.push(`Entry ${i}: missing patternName`);
  }

  if (errors.length > 0) {
    for (const err of errors) log.error(err);
    process.exit(1);
  }

  log.info(`Adding ${entries.length} hatch entries`);

  // Check for duplicates (same waterBody + month + insectName)
  let added = 0;
  let skipped = 0;

  for (const entry of entries) {
    const existing = await prisma.hatchEntry.findFirst({
      where: {
        waterBody: entry.waterBody,
        month: entry.month,
        insectName: entry.insectName,
      },
    });

    if (existing) {
      log.info(`Skipped (duplicate): ${entry.waterBody} - ${entry.insectName} (month ${entry.month})`);
      skipped++;
      continue;
    }

    await prisma.hatchEntry.create({
      data: {
        waterBody: entry.waterBody,
        region: entry.region,
        state: entry.state ?? null,
        month: entry.month,
        species: entry.species,
        insectName: entry.insectName,
        insectType: entry.insectType,
        patternName: entry.patternName,
        timeOfDay: entry.timeOfDay ?? null,
        targetFish: entry.targetFish ?? null,
        notes: entry.notes ?? null,
      },
    });
    added++;
  }

  log.success(`Done — ${added} hatch entries added, ${skipped} skipped (duplicates)`);

  // Summary
  const waterBodies = [...new Set(entries.map((e) => e.waterBody))];
  const regions = [...new Set(entries.map((e) => e.region))];
  log.info(`Water bodies: ${waterBodies.join(", ")}`);
  log.info(`Regions: ${regions.join(", ")}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log(`
FlyPatternDB Data Pipeline

Usage: tsx src/pipeline/cli.ts <command> [args]

Commands:
  discover [patterns...]       Search YouTube & blogs for fly pattern sources
                               If no patterns specified, uses the full seed list
  scrape                       Scrape content from discovered sources
  extract                      Run LLM extraction on scraped content
  normalize                    Normalize and build consensus across sources
  auto-approve                 Auto-approve high-confidence extractions
  ingest                       Write approved patterns to production DB
  import-url <url> [name]      Import a single URL (YouTube or blog)
  news                         Scrape fly fishing news from RSS feeds & sites
  techniques [slug]            Discover YouTube videos for tying techniques
  add-techniques <names...>    Add new tying techniques to the database
  add-hatches <file|--inline>  Add hatch chart entries from JSON file or inline
  status                       Show pipeline statistics
  run [patterns...]            Run full pipeline end-to-end
`);
    process.exit(0);
  }

  // Validate config for commands that need APIs
  if (["discover", "extract", "run", "techniques"].includes(command)) {
    const errors = validateConfig();
    if (errors.length > 0) {
      console.error("\nConfiguration errors:");
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      console.error(
        "\nSet the required environment variables in your .env file.\n"
      );
      process.exit(1);
    }
  }

  try {
    switch (command) {
      case "discover":
        await cmdDiscover(args);
        break;
      case "scrape":
        await cmdScrape();
        break;
      case "extract":
        await cmdExtract();
        break;
      case "normalize":
        await cmdNormalize();
        break;
      case "auto-approve":
        await cmdAutoApprove();
        break;
      case "ingest":
        await cmdIngest();
        break;
      case "import-url":
        await cmdImportUrl(args);
        break;
      case "news":
        await cmdNews();
        break;
      case "techniques":
        await cmdTechniques(args);
        break;
      case "add-techniques":
        await cmdAddTechniques(args);
        break;
      case "add-hatches":
        await cmdAddHatches(args);
        break;
      case "status":
        await cmdStatus();
        break;
      case "run":
        await cmdRun(args);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    log.error("Pipeline failed", { error: String(err) });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
