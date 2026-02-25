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

// ─── COMMAND: add-water-bodies ───────────────────────────────────────────

async function cmdAddWaterBodies(args: string[]) {
  if (args.length === 0) {
    console.error(`Usage: pipeline add-water-bodies <json-file>
       pipeline add-water-bodies --inline '<json-array>'

JSON format (array of objects):
  [{
    "name": "South Platte River",
    "region": "Rocky Mountains",
    "state": "CO",
    "waterType": "river",
    "latitude": 39.2,
    "longitude": -105.2,
    "description": "Optional description"
  }]

waterType options: river, creek, lake, reservoir, pond, spring_creek, tailwater, saltwater_flat, estuary, ocean`);
    process.exit(1);
  }

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
    name: string;
    region: string;
    state?: string;
    waterType?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
  }>;

  try {
    entries = JSON.parse(rawJson);
    if (!Array.isArray(entries)) {
      log.error("JSON must be an array of water body entries");
      process.exit(1);
    }
  } catch (e) {
    log.error(`Invalid JSON: ${String(e)}`);
    process.exit(1);
  }

  // Validate
  const errors: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (!e.name) errors.push(`Entry ${i}: missing name`);
    if (!e.region) errors.push(`Entry ${i}: missing region`);
  }

  if (errors.length > 0) {
    for (const err of errors) log.error(err);
    process.exit(1);
  }

  log.info(`Adding ${entries.length} water bodies`);

  let added = 0;
  let skipped = 0;

  for (const entry of entries) {
    const waterSlug = slugify(`${entry.name} ${entry.state ?? entry.region}`);

    const existing = await prisma.waterBody.findUnique({
      where: { slug: waterSlug },
    });

    if (existing) {
      log.info(`Skipped (already exists): ${entry.name}`);
      skipped++;
      continue;
    }

    await prisma.waterBody.create({
      data: {
        name: entry.name,
        slug: waterSlug,
        region: entry.region,
        state: entry.state ?? null,
        waterType: entry.waterType ?? "river",
        latitude: entry.latitude ?? null,
        longitude: entry.longitude ?? null,
        description: entry.description ?? null,
      },
    });
    added++;
  }

  log.success(`Done — ${added} water bodies added, ${skipped} skipped`);

  // Tip: auto-populate hatch entries
  if (added > 0) {
    log.info("Tip: Run 'npm run pipeline enrich-hatches' to auto-populate hatch data for new water bodies");
  }
}

// ─── COMMAND: enrich-hatches ────────────────────────────────────────────

async function cmdEnrichHatches(args: string[]) {
  const regionFilter = args[0] ?? undefined;

  // Fetch all water bodies (optionally filtered by region)
  const where: Record<string, unknown> = {};
  if (regionFilter) {
    where.region = { contains: regionFilter, mode: "insensitive" };
  }

  const waterBodies = await prisma.waterBody.findMany({
    where,
    orderBy: [{ region: "asc" }, { name: "asc" }],
  });

  if (waterBodies.length === 0) {
    log.info("No water bodies found. Add water bodies first with 'add-water-bodies'");
    return;
  }

  log.info(`Enriching hatch data for ${waterBodies.length} water bodies`);

  // Standard hatch data by region — this is the knowledge base for auto-generating hatches
  const REGIONAL_HATCHES: Record<string, Array<{
    month: number;
    species: string;
    insectName: string;
    insectType: string;
    patternName: string;
    timeOfDay: string;
    notes: string;
    targetFish?: string;
  }>> = {
    "Rocky Mountains": [
      { month: 1, species: "Chironomidae", insectName: "Midge", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Winter midge fishing is often the only game in town. Fish small (size 20-24) near the bottom.", targetFish: "Rainbow Trout" },
      { month: 2, species: "Chironomidae", insectName: "Midge", insectType: "midge", patternName: "Top Secret Midge", timeOfDay: "midday", notes: "Continue with midge patterns. Look for rising fish on warmer afternoons.", targetFish: "Brown Trout" },
      { month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Spring BWO hatches begin on overcast days. Nymph before the hatch, switch to dries when fish start rising.", targetFish: "Rainbow Trout" },
      { month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Peak spring BWO activity. Cloudy, drizzly days produce the best hatches.", targetFish: "Brown Trout" },
      { month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "The famous Mother's Day Caddis hatch brings explosive dry fly action. Fish the riffles and runs.", targetFish: "Rainbow Trout" },
      { month: 6, species: "Drunella grandis", insectName: "Green Drake", insectType: "mayfly", patternName: "Green Drake", timeOfDay: "evening", notes: "The Green Drake hatch is one of the most anticipated events of the year. Big flies, big fish.", targetFish: "Brown Trout" },
      { month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Stimulator", timeOfDay: "afternoon", notes: "Salmonfly hatches move upstream as water temperatures warm. Follow the hatch front for best action.", targetFish: "Rainbow Trout" },
      { month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Pale Morning Dun", timeOfDay: "morning", notes: "PMD hatches provide consistent morning dry fly fishing throughout July.", targetFish: "Rainbow Trout" },
      { month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Trico Spinner", timeOfDay: "morning", notes: "Early morning Trico spinner falls can produce incredible technical fishing. Tiny flies, size 20-24.", targetFish: "Brown Trout" },
      { month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Trico Spinner", timeOfDay: "morning", notes: "Peak Trico season continues. Fish the spinner fall with a downstream presentation.", targetFish: "Brown Trout" },
      { month: 8, species: "Orthoptera", insectName: "Grasshopper", insectType: "terrestrial", patternName: "Dave's Hopper", timeOfDay: "afternoon", notes: "Terrestrial season is in full swing. Slap hoppers against grassy banks for explosive strikes.", targetFish: "Rainbow Trout" },
      { month: 9, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO hatches begin again. Often the best dry fly fishing of the year on overcast days.", targetFish: "Brown Trout" },
      { month: 10, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Stimulator", timeOfDay: "evening", notes: "Large October Caddis bring big fish to the surface. Fish size 6-10 orange stimulators.", targetFish: "Brown Trout" },
      { month: 11, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Late season BWOs. Fishing pressure drops but hatches continue on warmer afternoons.", targetFish: "Brown Trout" },
      { month: 12, species: "Chironomidae", insectName: "Midge", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Midge season returns. Focus on tailwaters which stay fishable through winter.", targetFish: "Rainbow Trout" },
    ],
    "Northeast": [
      { month: 3, species: "Chironomidae", insectName: "Midge", insectType: "midge", patternName: "Griffith's Gnat", timeOfDay: "midday", notes: "Early season midges signal the start of trout fishing. Focus on slower water.", targetFish: "Brown Trout" },
      { month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Hendrickson", timeOfDay: "afternoon", notes: "The Hendrickson hatch is the first major mayfly event. Look for size 12-14 duns in the afternoon.", targetFish: "Brown Trout" },
      { month: 5, species: "Stenonema vicarium", insectName: "March Brown", insectType: "mayfly", patternName: "March Brown", timeOfDay: "afternoon", notes: "Despite the name, March Browns hatch in May in the northeast. Big flies, size 10-12.", targetFish: "Brown Trout" },
      { month: 5, species: "Brachycentrus", insectName: "Grannom Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Thick caddis hatches provide fast fishing. Try a soft hackle swung on the downstream drift.", targetFish: "Rainbow Trout" },
      { month: 6, species: "Ephemera guttulata", insectName: "Green Drake", insectType: "mayfly", patternName: "Green Drake", timeOfDay: "evening", notes: "The legendary eastern Green Drake hatch. Fish twilight for the biggest browns.", targetFish: "Brown Trout" },
      { month: 6, species: "Stenacron", insectName: "Light Cahill", insectType: "mayfly", patternName: "Light Cahill", timeOfDay: "evening", notes: "Evening Light Cahill hatches provide reliable dry fly fishing through June.", targetFish: "Brown Trout" },
      { month: 7, species: "Isonychia", insectName: "Isonychia (Slate Drake)", insectType: "mayfly", patternName: "Comparadun", timeOfDay: "evening", notes: "Slate Drakes are big, fast-swimming mayflies that produce exciting surface takes.", targetFish: "Brown Trout" },
      { month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Trico Spinner", timeOfDay: "morning", notes: "Trico spinner falls create blanket rises. Technical fishing with tiny flies.", targetFish: "Brown Trout" },
      { month: 9, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO hatches are prolific in the northeast. Fish on overcast days.", targetFish: "Brown Trout" },
      { month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Late fall BWO hatches. Some of the best dry fly fishing of the year.", targetFish: "Brown Trout" },
    ],
    "Pacific Northwest": [
      { month: 3, species: "Skwala", insectName: "Skwala Stonefly", insectType: "stonefly", patternName: "Stimulator", timeOfDay: "midday", notes: "The Skwala hatch kicks off the season. Fish olive stonefly patterns size 8-10.", targetFish: "Rainbow Trout" },
      { month: 5, species: "Drunella grandis", insectName: "Green Drake", insectType: "mayfly", patternName: "Green Drake", timeOfDay: "afternoon", notes: "Western Green Drake hatches can be phenomenal. Size 10-12 in green and olive.", targetFish: "Rainbow Trout" },
      { month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Stimulator", timeOfDay: "afternoon", notes: "Salmonfly hatches on the Deschutes and other rivers. Size 4-8 patterns fished tight to banks.", targetFish: "Rainbow Trout" },
      { month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Pale Morning Dun", timeOfDay: "morning", notes: "Prolific PMD hatches across PNW rivers. Standard sizes 14-18.", targetFish: "Rainbow Trout" },
      { month: 10, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Stimulator", timeOfDay: "evening", notes: "October Caddis hatches are a highlight of fall fishing. Big orange flies, aggressive fish.", targetFish: "Steelhead" },
    ],
    "Mid-South": [
      { month: 1, species: "Chironomidae", insectName: "Midge", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Year-round midge fishing on tailwaters like the White River and South Holston.", targetFish: "Rainbow Trout" },
      { month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Spring BWO hatches on southern tailwaters. Afternoon hatches are consistent.", targetFish: "Brown Trout" },
      { month: 5, species: "Hydropsyche", insectName: "Spotted Sedge", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Caddis hatches provide excellent dry fly fishing on warmer evenings.", targetFish: "Rainbow Trout" },
      { month: 6, species: "Ephemerella", insectName: "Sulphur", insectType: "mayfly", patternName: "Sulphur Dun", timeOfDay: "evening", notes: "Sulphur hatches bring fish to the surface reliably. Fish size 16-18 in yellow.", targetFish: "Brown Trout" },
    ],
    "Saltwater": [
      { month: 1, species: "Menippe mercenaria", insectName: "Crab", insectType: "other", patternName: "Permit Crab", timeOfDay: "all day", notes: "Winter permit fishing in the Keys. Sight-fish over turtle grass flats.", targetFish: "Permit" },
      { month: 3, species: "Penaeus", insectName: "Shrimp", insectType: "other", patternName: "Crazy Charlie", timeOfDay: "morning", notes: "Spring bonefish season heats up. Fish shrimp patterns on rising tides over white sand flats.", targetFish: "Bonefish" },
      { month: 5, species: "Engraulidae", insectName: "Baitfish", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Tarpon season begins. Fish large baitfish patterns along migration routes.", targetFish: "Tarpon" },
      { month: 7, species: "Engraulidae", insectName: "Baitfish", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "Summer inshore fishing for redfish, snook, and stripers. Match the local baitfish.", targetFish: "Redfish" },
      { month: 10, species: "Callinectes sapidus", insectName: "Blue Crab", insectType: "other", patternName: "Merkin Crab", timeOfDay: "morning", notes: "Fall permit and bonefish opportunities. Crab patterns are essential.", targetFish: "Permit" },
    ],
  };

  let totalAdded = 0;
  let totalSkipped = 0;

  for (let i = 0; i < waterBodies.length; i++) {
    const wb = waterBodies[i]!;
    console.log(progressBar(i + 1, waterBodies.length, wb.name));

    // Find matching regional hatch data
    const regionalData = REGIONAL_HATCHES[wb.region];
    if (!regionalData) {
      log.info(`No hatch templates for region: ${wb.region} (${wb.name})`);
      continue;
    }

    for (const hatch of regionalData) {
      // Check for existing entry
      const existing = await prisma.hatchEntry.findFirst({
        where: {
          waterBody: wb.name,
          month: hatch.month,
          insectName: hatch.insectName,
        },
      });

      if (existing) {
        totalSkipped++;
        continue;
      }

      // Try to link to a fly pattern by name
      const linkedPattern = await prisma.flyPattern.findFirst({
        where: { name: { contains: hatch.patternName, mode: "insensitive" } },
        select: { id: true },
      });

      await prisma.hatchEntry.create({
        data: {
          waterBody: wb.name,
          region: wb.region,
          state: wb.state,
          month: hatch.month,
          species: hatch.species,
          insectName: hatch.insectName,
          insectType: hatch.insectType,
          patternName: hatch.patternName,
          flyPatternId: linkedPattern?.id ?? null,
          timeOfDay: hatch.timeOfDay,
          targetFish: hatch.targetFish ?? null,
          notes: `${hatch.notes} (${wb.name}${wb.state ? `, ${wb.state}` : ""})`,
        },
      });

      totalAdded++;
    }
  }

  log.success(`Hatch enrichment complete: ${totalAdded} entries added, ${totalSkipped} skipped (already existed)`);

  // Summary
  const regions = [...new Set(waterBodies.map((wb) => wb.region))];
  log.info(`Regions processed: ${regions.join(", ")}`);
  log.info(`Water bodies processed: ${waterBodies.length}`);
}

// ─── COMMAND: import-water-bodies-csv ────────────────────────────────────

async function cmdImportWaterBodiesCsv(args: string[]) {
  if (args.length === 0) {
    console.error(`Usage: pipeline import-water-bodies-csv <csv-file>

CSV format (header row required):
  name,region,state,waterType,latitude,longitude,description

Example:
  South Platte River,Rocky Mountains,CO,tailwater,39.22,-105.21,"Premier tailwater fishery"
  Yellowstone River,Rocky Mountains,MT,river,45.63,-110.56,"America's longest undammed river"`);
    process.exit(1);
  }

  const fs = await import("fs");
  const filePath = args[0]!;

  if (!fs.existsSync(filePath)) {
    log.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    log.error("CSV must have a header row and at least one data row");
    process.exit(1);
  }

  // Parse header
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const regionIdx = headers.indexOf("region");
  const stateIdx = headers.indexOf("state");
  const typeIdx = headers.indexOf("watertype");
  const latIdx = headers.indexOf("latitude");
  const lonIdx = headers.indexOf("longitude");
  const descIdx = headers.indexOf("description");

  if (nameIdx === -1 || regionIdx === -1) {
    log.error("CSV must have 'name' and 'region' columns");
    process.exit(1);
  }

  log.info(`Importing ${lines.length - 1} water bodies from CSV`);

  let added = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted fields)
    const fields = parseCsvLine(lines[i]!);
    const name = fields[nameIdx]?.trim();
    const region = fields[regionIdx]?.trim();

    if (!name || !region) {
      log.warn(`Skipping line ${i + 1}: missing name or region`);
      continue;
    }

    const state = stateIdx >= 0 ? fields[stateIdx]?.trim() || null : null;
    const waterType = typeIdx >= 0 ? fields[typeIdx]?.trim() || "river" : "river";
    const latitude = latIdx >= 0 ? parseFloat(fields[latIdx] ?? "") || null : null;
    const longitude = lonIdx >= 0 ? parseFloat(fields[lonIdx] ?? "") || null : null;
    const description = descIdx >= 0 ? fields[descIdx]?.trim() || null : null;

    const waterSlug = slugify(`${name} ${state ?? region}`);

    const existing = await prisma.waterBody.findUnique({
      where: { slug: waterSlug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.waterBody.create({
      data: {
        name,
        slug: waterSlug,
        region,
        state,
        waterType,
        latitude,
        longitude,
        description,
      },
    });
    added++;
  }

  log.success(`Done — ${added} water bodies imported, ${skipped} skipped`);

  if (added > 0) {
    log.info("Tip: Run 'npm run pipeline enrich-hatches' to auto-populate hatch data");
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
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
  add-water-bodies <file|--inline>  Add water bodies from JSON
  import-water-bodies-csv <file>    Import water bodies from CSV file
  enrich-hatches [region]      Auto-populate hatch data for water bodies
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
      case "add-water-bodies":
        await cmdAddWaterBodies(args);
        break;
      case "import-water-bodies-csv":
        await cmdImportWaterBodiesCsv(args);
        break;
      case "enrich-hatches":
        await cmdEnrichHatches(args);
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
