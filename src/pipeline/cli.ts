import "dotenv/config";
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
import { discoverPatternImages, isPlaceholderImage, validateImageWithVision } from "./scrapers/images";
import {
  GENERAL_REPORT_QUERIES,
  runFishingReportsPipeline,
} from "./scrapers/fishing-reports";
import {
  HATCH_CHART_QUERIES,
  discoverHatchCharts,
  scrapeDirectHatchPages,
  extractHatchEntries,
} from "./scrapers/hatch-charts";
import type { ExtractedHatchEntry } from "./scrapers/hatch-charts";

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
  const allPatterns = args.length > 0
    ? args
    : SEED_PATTERNS.map((p) => p.name);

  // Skip patterns that already have staged sources (incremental discovery)
  const existingSources = await prisma.stagedSource.findMany({
    select: { patternQuery: true },
    distinct: ["patternQuery"],
  });
  const alreadyDiscovered = new Set(existingSources.map((s) => s.patternQuery));

  const patterns = args.length > 0
    ? allPatterns // Always process explicitly requested patterns
    : allPatterns.filter((name) => !alreadyDiscovered.has(name));

  const skipped = allPatterns.length - patterns.length;
  if (skipped > 0) {
    log.info(`Skipping ${skipped} already-discovered patterns`);
  }

  log.info(`Discovering sources for ${patterns.length} new patterns`);

  if (patterns.length === 0) {
    log.success("All patterns already discovered — nothing to do");
    return;
  }

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
  console.log("│         FlyArchive Pipeline Status        │");
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

// ─── COMMAND: images ─────────────────────────────────────────────────────────

async function cmdImages(args: string[]) {
  log.info("Discovering real images for fly patterns");

  // Get all patterns, optionally filtered by slug args
  const patterns = args.length > 0
    ? await prisma.flyPattern.findMany({
        where: { slug: { in: args } },
        include: { images: true },
      })
    : await prisma.flyPattern.findMany({
        include: { images: true },
      });

  // Find patterns that have fewer than 3 real (non-placeholder) images
  const needsImages = patterns.filter((p) => {
    const realImages = p.images.filter((img) => !isPlaceholderImage(img.url));
    return realImages.length < 3;
  });

  log.info(
    `${needsImages.length} of ${patterns.length} patterns need real images`
  );

  if (needsImages.length === 0) {
    log.success("All patterns already have real images — nothing to do");
    return;
  }

  let discovered = 0;
  let failed = 0;

  for (let i = 0; i < needsImages.length; i++) {
    const pattern = needsImages[i]!;
    console.log(progressBar(i + 1, needsImages.length, pattern.name));

    // Find existing staged sources for this pattern (video IDs + scraped HTML)
    const stagedSources = await prisma.stagedSource.findMany({
      where: { patternQuery: pattern.name },
      select: { metadata: true, sourceType: true, rawContent: true },
    });

    const videoIds = stagedSources
      .filter((s) => s.sourceType === "youtube")
      .map((s) => {
        const meta = s.metadata as Record<string, unknown> | null;
        return meta?.videoId as string | undefined;
      })
      .filter((id): id is string => !!id);

    // Collect HTML content from blog sources for image extraction
    const stagedHtml = stagedSources
      .filter((s) => s.sourceType === "blog" && s.rawContent)
      .map((s) => s.rawContent!)
      .slice(0, 5);

    try {
      const images = await discoverPatternImages(pattern.name, videoIds, stagedHtml);

      if (images.length === 0) {
        log.warn(`No images found for ${pattern.name}`);
        failed++;
        continue;
      }

      // Validate top candidates with Claude vision — only keep actual fly pattern photos
      const validated: typeof images = [];
      for (const img of images.slice(0, 20)) {
        if (validated.length >= 5) break;
        log.info(`  Validating: ${img.url.slice(0, 80)}...`);
        const isValid = await validateImageWithVision(img.url, pattern.name);
        if (isValid) {
          validated.push(img);
          log.info(`    ✓ Confirmed fly pattern photo`);
        } else {
          log.info(`    ✗ Not a fly pattern — skipped`);
        }
      }

      if (validated.length === 0) {
        log.warn(`No validated fly pattern images for ${pattern.name}`);
        failed++;
        continue;
      }

      // Delete existing placeholder images for this pattern
      await prisma.patternImage.deleteMany({
        where: {
          flyPatternId: pattern.id,
          url: { contains: "placehold.co" },
        },
      });

      // Create new image records
      for (let j = 0; j < validated.length; j++) {
        const img = validated[j]!;
        await prisma.patternImage.create({
          data: {
            flyPatternId: pattern.id,
            url: img.url,
            caption: img.caption || `${pattern.name} fly pattern`,
            isPrimary: j === 0,
          },
        });
      }

      discovered++;
    } catch (err) {
      log.error(`Image discovery failed for ${pattern.name}`, {
        error: String(err),
      });
      failed++;
    }
  }

  log.success(
    `Image discovery complete: ${discovered} patterns updated, ${failed} failed`
  );
}

// ─── COMMAND: clean-images ──────────────────────────────────────────────────

async function cmdCleanImages(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const revalidate = args.includes("--revalidate");

  if (revalidate) {
    // Re-validate existing images with Claude vision, delete any that aren't fly patterns
    log.info("Re-validating all non-placeholder images with Claude vision...");

    const allImages = await prisma.patternImage.findMany({
      where: {
        url: { not: { contains: "placehold.co" } },
        uploadedById: null, // Only check pipeline-discovered images, not user uploads
      },
      include: { flyPattern: { select: { name: true } } },
    });

    log.info(`Found ${allImages.length} pipeline images to validate`);

    let removed = 0;
    let kept = 0;

    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i]!;
      console.log(progressBar(i + 1, allImages.length, img.flyPattern.name));

      const isValid = await validateImageWithVision(img.url, img.flyPattern.name);

      if (isValid) {
        kept++;
      } else {
        log.info(`  ✗ Removing: ${img.url.slice(0, 80)} (${img.flyPattern.name})`);
        if (!dryRun) {
          await prisma.patternImage.delete({ where: { id: img.id } });
        }
        removed++;
      }
    }

    log.success(
      `Validation complete: ${kept} kept, ${removed} removed${dryRun ? " (dry run)" : ""}`
    );
    return;
  }

  // Default: delete ALL pipeline-discovered images (not user-uploaded)
  const pipelineImages = await prisma.patternImage.count({
    where: { uploadedById: null },
  });

  log.info(`Found ${pipelineImages} pipeline-discovered images to delete`);

  if (pipelineImages === 0) {
    log.success("No pipeline images to clean — nothing to do");
    return;
  }

  if (dryRun) {
    log.info("Dry run — no images will be deleted");
    return;
  }

  const result = await prisma.patternImage.deleteMany({
    where: { uploadedById: null },
  });

  log.success(`Deleted ${result.count} pipeline-discovered images`);
}

// ─── COMMAND: run (full pipeline) ───────────────────────────────────────────

async function cmdRun(args: string[]) {
  log.info("Running full pipeline");

  // Phase 1: Discover, scrape, extract, normalize, approve, ingest
  await cmdDiscover(args);
  await cmdScrape();
  await cmdExtract();
  await cmdNormalize();
  await cmdAutoApprove();
  await cmdIngest();

  // Phase 2: Enrich patterns with missing tying steps, videos, descriptions
  await cmdEnrich(args);

  // Phase 3: Images — discover & validate real photos for each pattern
  await cmdImages(args);

  // Phase 4: Buy links — affiliate links for all materials
  await cmdBuyLinks([]);

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

// ─── COMMAND: buy-links ─────────────────────────────────────────────────

/**
 * Well-known fly tying retailers with search URL patterns.
 * These generate direct search result links (not affiliate links).
 */
const FLY_TYING_RETAILERS: { name: string; searchUrl: (q: string) => string }[] = [
  {
    name: "J. Stockard",
    searchUrl: (q) =>
      `https://www.jsflyfishing.com/search?type=product&q=${encodeURIComponent(q)}`,
  },
  {
    name: "Trident Fly Fishing",
    searchUrl: (q) =>
      `https://www.tridentflyfishing.com/search?q=${encodeURIComponent(q)}`,
  },
];

async function cmdBuyLinks(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const clearFirst = args.includes("--clear");

  log.info("Generating buy links for materials");

  if (clearFirst) {
    if (!dryRun) {
      const deleted = await prisma.affiliateLink.deleteMany({});
      log.info(`Cleared ${deleted.count} existing buy links`);
    } else {
      log.info("Would clear existing buy links (dry run)");
    }
  }

  // Get all materials
  const materials = await prisma.material.findMany({
    include: { affiliateLinks: { select: { id: true, retailer: true } } },
    orderBy: { name: "asc" },
  });

  log.info(`Found ${materials.length} materials`);

  let created = 0;
  let skipped = 0;

  for (const material of materials) {
    // Build a good search query from the material name
    // Strip parenthetical details like "(Medium)" for cleaner search
    const searchName = material.name
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .trim();

    for (const retailer of FLY_TYING_RETAILERS) {
      // Skip if this material already has a link to this retailer
      if (material.affiliateLinks.some((l) => l.retailer === retailer.name)) {
        skipped++;
        continue;
      }

      const url = retailer.searchUrl(searchName);

      if (dryRun) {
        console.log(`  ${material.name} → ${retailer.name}: ${url}`);
      } else {
        await prisma.affiliateLink.create({
          data: {
            materialId: material.id,
            retailer: retailer.name,
            url,
            commissionType: "flat",
          },
        });
      }

      created++;
    }
  }

  log.success(
    `Buy links: ${created} created, ${skipped} skipped (already existed)${dryRun ? " (dry run)" : ""}`
  );
}

// ─── COMMAND: fishing-reports ────────────────────────────────────────────

async function cmdFishingReports(args: string[]) {
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const queryLimit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : undefined;

  log.info("Running fishing reports pipeline...");

  const result = await runFishingReportsPipeline({ queryLimit });

  log.success(
    `Fishing reports: ${result.created} created, ${result.updated} updated, ${result.failed} failed, ${result.waterBodiesCreated} water bodies auto-created (${result.totalReportsScraped} total scraped)`
  );
}

// ─── COMMAND: enrich-hatches ────────────────────────────────────────────

async function cmdEnrichHatches(args: string[]) {
  const queryLimit = (() => {
    const limitArg = args.find((a) => a.startsWith("--limit="));
    return limitArg
      ? parseInt(limitArg.split("=")[1]!, 10)
      : HATCH_CHART_QUERIES.length;
  })();
  const waterFilter = args.find((a) => !a.startsWith("--")) ?? undefined;

  const queries = waterFilter
    ? [`${waterFilter} hatch chart fly fishing`]
    : HATCH_CHART_QUERIES.slice(0, queryLimit);

  log.info(`Discovering hatch charts using ${queries.length} search queries`);

  const seenUrls = new Set<string>();
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalRejected = 0;

  // Step 1: Query-based search (Brave + Serper + preconfigured sites)
  log.info("Step 1: Searching the web for hatch charts...");

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi]!;
    log.info(`  [${qi + 1}/${queries.length}] "${query}"`);

    try {
      const pages = await discoverHatchCharts(query);
      const newPages = pages.filter((p) => !seenUrls.has(p.url));
      for (const p of pages) seenUrls.add(p.url);

      if (newPages.length === 0) {
        log.info(`    No hatch chart pages found`);
        continue;
      }

      log.info(`    Found ${newPages.length} new pages (${pages.length - newPages.length} dupes skipped)`);

      // Extract hatch data from each page with Claude
      for (const page of newPages) {
        try {
          const entries = await extractHatchEntries([page]);
          if (entries.length === 0) {
            totalRejected++;
            continue;
          }

          log.info(`    Extracted ${entries.length} hatch entries from: ${page.title}`);

          for (const entry of entries) {
            await saveHatchEntry(entry);
          }
        } catch (err) {
          log.error(`    Extraction failed for: ${page.title}`, { error: String(err) });
        }
      }
    } catch (err) {
      log.warn(`  Query failed: "${query}"`, { error: String(err) });
    }
  }

  // Step 2: Direct hatch chart pages (known fly shop URLs)
  log.info("Step 2: Scraping direct hatch chart pages (fly shops, guides)...");
  try {
    const directPages = await scrapeDirectHatchPages();
    const newDirect = directPages.filter((p) => !seenUrls.has(p.url));
    for (const p of directPages) seenUrls.add(p.url);

    log.info(`  Found ${newDirect.length} direct hatch chart pages (${directPages.length - newDirect.length} dupes skipped)`);

    for (const page of newDirect) {
      try {
        const entries = await extractHatchEntries([page]);
        if (entries.length === 0) {
          totalRejected++;
          continue;
        }

        log.info(`  Extracted ${entries.length} hatch entries from: ${page.title}`);

        for (const entry of entries) {
          await saveHatchEntry(entry);
        }
      } catch (err) {
        log.error(`  Extraction failed: ${page.title}`, { error: String(err) });
      }
    }
  } catch (err) {
    log.warn("Direct page scraping failed", { error: String(err) });
  }

  log.success(
    `Hatch chart pipeline complete: ${totalAdded} entries added, ${totalSkipped} skipped (duplicates), ${totalRejected} pages rejected (not hatch charts)`
  );

  // Helper to save a single hatch entry with dedup + pattern linking
  async function saveHatchEntry(entry: ExtractedHatchEntry) {
    // Check for existing entry (dedup by waterBody + month + insectName)
    const existing = await prisma.hatchEntry.findFirst({
      where: {
        waterBody: entry.waterBody,
        month: entry.month,
        insectName: entry.insectName,
      },
    });

    if (existing) {
      totalSkipped++;
      return;
    }

    // Try to link to a fly pattern by name
    const linkedPattern = await prisma.flyPattern.findFirst({
      where: { name: { contains: entry.patternName, mode: "insensitive" } },
      select: { id: true },
    });

    await prisma.hatchEntry.create({
      data: {
        waterBody: entry.waterBody,
        region: entry.region,
        state: entry.state,
        month: entry.month,
        species: entry.species,
        insectName: entry.insectName,
        insectType: entry.insectType,
        patternName: entry.patternName,
        flyPatternId: linkedPattern?.id ?? null,
        timeOfDay: entry.timeOfDay,
        targetFish: entry.targetFish,
        notes: entry.notes,
      },
    });

    totalAdded++;
  }
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

// ─── COMMAND: enrich-techniques ──────────────────────────────────────────────

/**
 * Enrich tying techniques that have generic/missing data.
 * Uses Claude to generate detailed step-by-step instructions,
 * real descriptions, and proper key points for each technique.
 * Also discovers YouTube tutorial videos.
 */
async function cmdEnrichTechniques(args: string[]) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;

  const dryRun = args.includes("--dry-run");
  const limitFlag = args.find((a) => a.startsWith("--limit="));
  const limit = limitFlag ? parseInt(limitFlag.split("=")[1]!, 10) : 0;
  const slugFilters = args.filter((a) => !a.startsWith("--"));

  // Find techniques that need enrichment (missing steps = generic pipeline-created)
  // Try including steps — if the migration hasn't been applied yet, fall back
  let allTechniques: {
    id: string;
    name: string;
    slug: string;
    category: string;
    difficulty: string;
    description: string;
    keyPoints: string[];
    steps: { id: string }[];
    videos: { id: string }[];
  }[];

  try {
    allTechniques = await prisma.tyingTechnique.findMany({
      where: slugFilters.length > 0 ? { slug: { in: slugFilters } } : undefined,
      include: {
        steps: { select: { id: true } },
        videos: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch {
    // steps relation may not exist if migration not applied — query without it
    log.warn("TechniqueStep table may not exist yet. Run: npx prisma migrate deploy && npx prisma generate");
    const basic = await prisma.tyingTechnique.findMany({
      where: slugFilters.length > 0 ? { slug: { in: slugFilters } } : undefined,
      include: { videos: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
    allTechniques = basic.map((t) => ({ ...t, steps: [] }));
  }

  // Filter to techniques that are incomplete
  const incomplete = allTechniques.filter((t) => {
    const hasGenericDesc = t.description.startsWith("Learn the ") && t.description.includes("technique for fly tying");
    const noSteps = t.steps.length === 0;
    const fewVideos = t.videos.length < 2;
    return noSteps || hasGenericDesc || fewVideos;
  });

  if (incomplete.length === 0) {
    log.success("All techniques already have complete data!");
    return;
  }

  const toProcess = limit > 0 ? incomplete.slice(0, limit) : incomplete;

  log.info(`Found ${incomplete.length} techniques needing enrichment${limit > 0 ? ` (processing ${toProcess.length})` : ""}`);

  if (dryRun) {
    log.info("DRY RUN — listing techniques that would be enriched:");
    for (const t of toProcess) {
      const issues: string[] = [];
      if (t.steps.length === 0) issues.push("no steps");
      if (t.videos.length === 0) issues.push("no videos");
      if (t.description.startsWith("Learn the ")) issues.push("generic description");
      console.log(`  ${t.name} (${t.category}, ${t.difficulty}) — ${issues.join(", ")}`);
    }
    return;
  }

  const anthropic = new Anthropic({
    apiKey: PIPELINE_CONFIG.anthropic.apiKey,
  });

  const TECHNIQUE_TOOL = {
    name: "save_technique_data" as const,
    description: "Save enriched technique data with detailed steps and description.",
    input_schema: {
      type: "object" as const,
      properties: {
        description: {
          type: "string" as const,
          description: "A detailed 2-4 sentence description of this fly tying technique. Explain what it is, when it's used, and why it matters. Write for fly tiers, not for a general audience.",
        },
        keyPoints: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "5-7 key points or tips about this technique. Each should be a specific, actionable piece of advice — not generic filler.",
        },
        steps: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              position: { type: "number" as const, description: "Step order starting at 1" },
              title: { type: "string" as const, description: "Short step title (3-6 words)" },
              instruction: { type: "string" as const, description: "Detailed instruction for this step (2-4 sentences). Be specific about hand positions, thread tension, material placement, etc." },
              tip: { type: "string" as const, description: "Optional pro tip for this step. Include only if there's a genuinely useful tip." },
            },
            required: ["position", "title", "instruction"],
          },
          description: "Step-by-step instructions for performing this technique. Include 4-8 detailed steps.",
        },
      },
      required: ["description", "keyPoints", "steps"],
    },
  };

  let enriched = 0;
  let failed = 0;

  for (const technique of toProcess) {
    log.info(`Enriching: ${technique.name} (${technique.category})`);

    try {
      const response = await anthropic.messages.create({
        model: PIPELINE_CONFIG.anthropic.model,
        max_tokens: 4096,
        system: `You are an expert fly tying instructor writing content for a fly fishing education website.
You have decades of experience teaching beginners through advanced tiers. Your instructions are
detailed, precise, and practical. You always describe exact hand positions, thread tension, and
material handling. You write like you're sitting next to the student at the vise.

IMPORTANT RULES:
1. Be specific and technical — use real fly tying terminology (bobbin, hackle pliers, dubbing loop, etc.)
2. Each step should describe ONE discrete action, not multiple actions crammed together
3. Tips should be genuinely useful insights from experience, not obvious statements
4. Key points should be specific to THIS technique, not generic advice
5. Description should explain what this technique IS, not just say "learn this technique"
6. Steps should follow the actual physical sequence a tier would perform at the vise`,
        tools: [TECHNIQUE_TOOL],
        tool_choice: { type: "tool", name: "save_technique_data" },
        messages: [
          {
            role: "user",
            content: `Generate detailed step-by-step instructions for the fly tying technique: "${technique.name}"

Category: ${technique.category.replace(/_/g, " ")}
Difficulty: ${technique.difficulty}

Provide:
1. A real, detailed description (not a generic "Learn the X technique" placeholder)
2. 5-7 specific key points / tips
3. 4-8 detailed steps with clear instructions

The content should be appropriate for the ${technique.difficulty} difficulty level.`,
          },
        ],
      });

      // Extract tool use result
      const toolBlock = response.content.find((b) => b.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        log.error(`No tool response for ${technique.name}`);
        failed++;
        continue;
      }

      const data = toolBlock.input as {
        description: string;
        keyPoints: string[];
        steps: { position: number; title: string; instruction: string; tip?: string }[];
      };

      // Validate
      if (!data.description || !data.steps || data.steps.length === 0) {
        log.error(`Empty extraction for ${technique.name}`);
        failed++;
        continue;
      }

      // Update technique in a transaction
      await prisma.$transaction(async (tx) => {
        // Update description and key points
        await tx.tyingTechnique.update({
          where: { id: technique.id },
          data: {
            description: data.description,
            keyPoints: data.keyPoints ?? technique.keyPoints,
          },
        });

        // Replace steps (delete old + create new)
        try {
          await tx.techniqueStep.deleteMany({
            where: { techniqueId: technique.id },
          });

          if (data.steps.length > 0) {
            await tx.techniqueStep.createMany({
              data: data.steps.map((s, i) => ({
                techniqueId: technique.id,
                position: s.position ?? i + 1,
                title: s.title.slice(0, 200),
                instruction: s.instruction,
                tip: s.tip ?? null,
              })),
            });
          }
        } catch {
          log.warn(`Could not write steps for ${technique.name} — run 'npx prisma migrate deploy' to create the technique_steps table`);
        }
      });

      log.success(`Enriched: ${technique.name} — ${data.steps.length} steps, ${data.keyPoints?.length ?? 0} key points`);
      enriched++;
    } catch (err) {
      log.error(`Failed to enrich ${technique.name}`, { error: String(err) });
      failed++;
    }
  }

  // Discover videos for any techniques that still need them
  const noVideoTechniques = toProcess.filter((t) => t.videos.length < 2);
  if (noVideoTechniques.length > 0 && PIPELINE_CONFIG.youtube.apiKey) {
    log.info(`Discovering videos for ${noVideoTechniques.length} techniques...`);
    for (const t of noVideoTechniques) {
      try {
        await discoverTechniqueVideos(t.slug);
      } catch (err) {
        log.error(`Video discovery failed for ${t.name}`, { error: String(err) });
      }
    }
  } else if (!PIPELINE_CONFIG.youtube.apiKey) {
    log.warn("Skipping video discovery — YOUTUBE_API_KEY not set");
  }

  log.success(`Technique enrichment complete: ${enriched} enriched, ${failed} failed, ${incomplete.length - toProcess.length} remaining`);
}

// ─── COMMAND: enrich ─────────────────────────────────────────────────────────

/**
 * Enrich existing patterns that are missing tying steps, video resources,
 * or other data. Discovers new sources, extracts tying steps, and merges
 * them into the existing pattern without duplicating or overwriting.
 */
async function cmdEnrich(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : 20;
  const filterSlugs = args.filter((a) => !a.startsWith("--"));

  log.info("Enriching existing patterns with missing data");

  // Find patterns that need enrichment
  const allPatterns = filterSlugs.length > 0
    ? await prisma.flyPattern.findMany({
        where: { slug: { in: filterSlugs } },
        include: {
          tyingSteps: { select: { id: true } },
          resources: { select: { id: true, type: true } },
          materials: { select: { id: true } },
        },
      })
    : await prisma.flyPattern.findMany({
        include: {
          tyingSteps: { select: { id: true } },
          resources: { select: { id: true, type: true } },
          materials: { select: { id: true } },
        },
      });

  // Identify patterns needing enrichment
  const needsEnrichment = allPatterns.filter((p) => {
    const noSteps = p.tyingSteps.length === 0;
    const noVideo = !p.resources.some((r) => r.type === "video");
    const sparseMaterials = p.materials.length < 3;
    return noSteps || noVideo || sparseMaterials;
  });

  // Sort: patterns missing the most things first
  needsEnrichment.sort((a, b) => {
    const scoreA =
      (a.tyingSteps.length === 0 ? 1 : 0) +
      (a.resources.some((r) => r.type === "video") ? 0 : 1) +
      (a.materials.length < 3 ? 1 : 0);
    const scoreB =
      (b.tyingSteps.length === 0 ? 1 : 0) +
      (b.resources.some((r) => r.type === "video") ? 0 : 1) +
      (b.materials.length < 3 ? 1 : 0);
    return scoreB - scoreA;
  });

  const toProcess = needsEnrichment.slice(0, limit);

  log.info(
    `${needsEnrichment.length} patterns need enrichment, processing ${toProcess.length}`
  );

  if (toProcess.length === 0) {
    log.success("All patterns are fully enriched — nothing to do");
    return;
  }

  // Show what will be enriched
  for (const p of toProcess) {
    const gaps: string[] = [];
    if (p.tyingSteps.length === 0) gaps.push("steps");
    if (!p.resources.some((r) => r.type === "video")) gaps.push("video");
    if (p.materials.length < 3) gaps.push("materials");
    console.log(`  ${p.name} — missing: ${gaps.join(", ")}`);
  }

  if (dryRun) {
    log.info("Dry run — no changes will be made");
    return;
  }

  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const pattern = toProcess[i]!;
    console.log(progressBar(i + 1, toProcess.length, pattern.name));

    try {
      const needsSteps = pattern.tyingSteps.length === 0;
      const needsVideo = !pattern.resources.some((r) => r.type === "video");

      // Step 1: Discover new sources for this pattern
      let newSources = 0;

      // YouTube discovery (for video + transcript-based step extraction)
      if (needsSteps || needsVideo) {
        try {
          const ytResults = await searchYouTube(pattern.name);
          const scored = ytResults
            .map((r) => ({ result: r, score: scoreYouTubeResult(r) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          for (const { result } of scored) {
            const url = youtubeVideoUrl(result.videoId);

            // Check if we already have this source
            const existingSource = await prisma.stagedSource.findFirst({
              where: { url },
            });
            if (existingSource) continue;

            const source = await createStagedSource({
              sourceType: "youtube",
              url,
              title: result.title,
              creatorName: result.channelTitle,
              platform: "YouTube",
              patternQuery: pattern.name,
              metadata: {
                videoId: result.videoId,
                viewCount: result.viewCount,
                likeCount: result.likeCount,
                enrichment: true,
              },
            });

            const content = buildYouTubeContent(result);
            await updateStagedSourceContent(source.id, content);
            newSources++;
          }
        } catch (err) {
          log.warn("YouTube discovery failed during enrichment", {
            pattern: pattern.name,
            error: String(err),
          });
        }
      }

      // Blog discovery (for additional content)
      if (needsSteps && newSources === 0) {
        try {
          const blogResults = await discoverBlogContent(pattern.name);
          const scored = blogResults
            .map((r) => ({ result: r, score: scoreBlogResult(r) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);

          for (const { result } of scored) {
            const existingSource = await prisma.stagedSource.findFirst({
              where: { url: result.url },
            });
            if (existingSource) continue;

            const source = await createStagedSource({
              sourceType: "blog",
              url: result.url,
              title: result.title,
              creatorName: result.author ?? undefined,
              platform: result.siteName,
              patternQuery: pattern.name,
            });

            await updateStagedSourceContent(source.id, result.content);
            newSources++;
          }
        } catch (err) {
          log.warn("Blog discovery failed during enrichment", {
            pattern: pattern.name,
            error: String(err),
          });
        }
      }

      if (newSources === 0) {
        log.warn(`No new sources found for ${pattern.name}`);
        failed++;
        continue;
      }

      // Step 2: Extract from the newly scraped sources
      const newlyScraped = await prisma.stagedSource.findMany({
        where: {
          patternQuery: pattern.name,
          status: "scraped",
        },
        orderBy: { scrapedAt: "desc" },
        take: 5,
      });

      const extractedPatterns: ExtractedPattern[] = [];

      for (const source of newlyScraped) {
        if (!source.rawContent) continue;

        try {
          const data = await extractPattern(
            source.rawContent,
            source.patternQuery,
            source.sourceType as "youtube" | "blog"
          );

          if (data) {
            extractedPatterns.push(data);

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
          }
        } catch (err) {
          log.warn("Extraction failed during enrichment", {
            source: source.url,
            error: String(err),
          });
        }
      }

      if (extractedPatterns.length === 0) {
        log.warn(`No successful extractions for ${pattern.name}`);
        failed++;
        continue;
      }

      // Step 3: Merge enrichment data into existing pattern
      await prisma.$transaction(async (tx) => {
        // Add tying steps if missing
        if (needsSteps) {
          // Pick best tying steps from extractions
          let bestSteps: ExtractedPattern["tyingSteps"] = [];
          let bestStepScore = 0;

          for (const ext of extractedPatterns) {
            const steps = ext.tyingSteps ?? [];
            if (steps.length === 0) continue;
            const totalLen = steps.reduce(
              (sum, s) => sum + (s.instruction?.length ?? 0),
              0
            );
            const score = steps.length * 10 + totalLen;
            if (score > bestStepScore) {
              bestStepScore = score;
              bestSteps = steps;
            }
          }

          if (bestSteps.length > 0) {
            await tx.tyingStep.createMany({
              data: bestSteps.map((step, i) => ({
                flyPatternId: pattern.id,
                position: i + 1,
                title: step.title,
                instruction: step.instruction,
                tip: step.tip,
              })),
            });
            log.info(`Added ${bestSteps.length} tying steps to ${pattern.name}`);
          }
        }

        // Add new video resources if missing
        for (const source of newlyScraped) {
          if (source.sourceType !== "youtube") continue;

          const existingResource = await tx.resource.findFirst({
            where: {
              flyPatternId: pattern.id,
              url: source.url,
            },
          });

          if (!existingResource) {
            await tx.resource.create({
              data: {
                flyPatternId: pattern.id,
                type: "video",
                title: source.title ?? pattern.name,
                creatorName: source.creatorName ?? "Unknown",
                platform: source.platform ?? "YouTube",
                url: source.url,
                qualityScore: 3,
              },
            });
          }
        }
      });

      enriched++;
      log.success(`Enriched ${pattern.name}`, {
        newSources: String(newSources),
        extractions: String(extractedPatterns.length),
      });
    } catch (err) {
      log.error(`Enrichment failed for ${pattern.name}`, {
        error: String(err),
      });
      failed++;
    }
  }

  log.success(
    `Enrichment complete: ${enriched} patterns enriched, ${failed} failed`
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log(`
FlyArchive Data Pipeline

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
  enrich-techniques [slugs...] [--dry-run] [--limit=N]
                               Use Claude to generate real steps, descriptions,
                               and key points for techniques with generic data
  buy-links [--dry-run] [--clear]
                               Generate buy links to fly tying retailers
                               for every material in the database
  fishing-reports [--dry-run] [--limit=N]
                               Discover fishing reports from the web, extract
                               water body data, and auto-create both reports
                               and water body records. No manual input needed.
                               --limit=N controls how many search queries to run
                               (default: all ${GENERAL_REPORT_QUERIES.length} queries)
  add-hatches <file|--inline>  Add hatch chart entries from JSON file or inline
  add-water-bodies <file|--inline>  Add water bodies from JSON
  import-water-bodies-csv <file>    Import water bodies from CSV file
  enrich-hatches [water] [--limit=N]
                               Discover hatch charts from the web, extract
                               per-waterway hatch data with Claude, and save
                               to the database. Searches fly shops, guides,
                               Brave, and Google for hatch chart pages.
                               --limit=N controls how many search queries to
                               run (default: all ${HATCH_CHART_QUERIES.length} queries)
  enrich [slugs...] [--dry-run] [--limit=N]
                               Enrich existing patterns with missing tying
                               steps, video resources, and materials
  images [slugs...]            Discover real images for fly patterns
                               Uses Google CSE, Bing, and YouTube thumbnails
                               Validates each image with Claude vision
  clean-images [--dry-run]     Delete all pipeline-discovered images
  clean-images --revalidate [--dry-run]
                               Re-validate existing images with Claude vision
                               and delete any that aren't fly pattern photos
  status                       Show pipeline statistics
  run [patterns...]            Run full pipeline end-to-end
`);
    process.exit(0);
  }

  // Validate config for commands that need APIs
  if (["discover", "extract", "run", "techniques", "enrich", "enrich-techniques", "images", "clean-images", "fishing-reports"].includes(command)) {
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
      case "enrich-techniques":
        await cmdEnrichTechniques(args);
        break;
      case "buy-links":
        await cmdBuyLinks(args);
        break;
      case "fishing-reports":
        await cmdFishingReports(args);
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
      case "enrich":
        await cmdEnrich(args);
        break;
      case "images":
        await cmdImages(args);
        break;
      case "clean-images":
        await cmdCleanImages(args);
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
