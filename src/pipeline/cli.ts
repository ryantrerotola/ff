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

        // If we have a transcript, store it immediately
        if (result.transcript) {
          const content = buildYouTubeContent(result);
          await updateStagedSourceContent(source.id, content);
        }

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
          // Try to fetch transcript for YouTube videos without content
          const metadata = source.metadata as { videoId?: string } | null;
          const videoId = metadata?.videoId;

          if (videoId) {
            const { fetchTranscript } = await import("./scrapers/youtube");
            const transcript = await fetchTranscript(videoId);

            if (transcript) {
              const content = `Title: ${source.title ?? ""}\nCreator: ${source.creatorName ?? ""}\n\nTranscript:\n${transcript}`;
              await updateStagedSourceContent(source.id, content);
              scraped++;
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

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log(`
FlyPatternDB Data Pipeline

Usage: tsx src/pipeline/cli.ts <command> [args]

Commands:
  discover [patterns...]  Search YouTube & blogs for fly pattern sources
                          If no patterns specified, uses the full seed list
  scrape                  Scrape content from discovered sources
  extract                 Run LLM extraction on scraped content
  normalize               Normalize and build consensus across sources
  auto-approve            Auto-approve high-confidence extractions
  ingest                  Write approved patterns to production DB
  import-url <url> [name] Import a single URL (YouTube or blog)
  status                  Show pipeline statistics
  run [patterns...]       Run full pipeline end-to-end
`);
    process.exit(0);
  }

  // Validate config for commands that need APIs
  if (["discover", "extract", "run"].includes(command)) {
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
