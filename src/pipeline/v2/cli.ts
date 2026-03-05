/**
 * V2 Pipeline CLI
 *
 * Usage:
 *   tsx src/pipeline/v2/cli.ts <command> [patterns...]
 *
 * Commands:
 *   discover  - Find YouTube + web sources for patterns
 *   scrape    - Scrape content from discovered sources
 *   extract   - Extract pattern data with Haiku
 *   enrich    - Enrich extractions with Sonnet
 *   consensus - Build consensus from enriched extractions
 *   links     - Find product purchase links
 *   images    - Discover and validate pattern images
 *   gate      - Run quality gate
 *   ingest    - Write to production database
 *   run       - Run full pipeline end-to-end
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { validateV2Config } from "./config";
import { createLogger, progressBar } from "../utils/logger";
import { SEED_PATTERNS } from "../seed-patterns";

import { discoverAllSources } from "./discovery";
import { scrapeAllSources } from "./scraping";
import { extractAll, calculateV2Confidence } from "./extraction";
import { enrichAll } from "./enrichment";
import { buildV2Consensus } from "./consensus";
import { findProductLinks } from "./product-links";
import { findPatternImages } from "./images";
import { evaluateQuality } from "./quality-gate";
import { ingestV2Pattern } from "./ingest";

import {
  createStagedSource,
  updateStagedSourceContent,
  updateStagedSourceStatus,
  getStagedSourcesByStatus,
  createStagedExtraction,
  updateExtractionStatus,
} from "@/services/staged.service";

import { slugify } from "../utils/slug";

import type {
  DiscoveredSource,
  ScrapedSource,
} from "./types";

const log = createLogger("v2:pipeline");

// ─── COMMAND: run (full pipeline) ──────────────────────────────────────────

async function cmdRun(patterns: string[]) {
  const errors = validateV2Config();
  if (errors.length > 0) {
    log.error("Configuration errors:", { errors: errors.join(", ") });
    process.exit(1);
  }

  const patternNames = patterns.length > 0
    ? patterns
    : SEED_PATTERNS.map((p) => p.name);

  log.info(`Running V2 pipeline for ${patternNames.length} patterns`);

  const stats = { discovered: 0, scraped: 0, extracted: 0, enriched: 0, passed: 0, failed: 0, review: 0, ingested: 0 };

  for (let i = 0; i < patternNames.length; i++) {
    const patternName = patternNames[i]!;
    console.log(progressBar(i + 1, patternNames.length, patternName));

    try {
      const result = await runPatternPipeline(patternName);

      stats.discovered += result.discovered;
      stats.scraped += result.scraped;
      stats.extracted += result.extracted;
      stats.enriched += result.enriched;

      if (result.gateDecision === "pass") {
        stats.passed++;
        if (result.ingested) stats.ingested++;
      } else if (result.gateDecision === "fail") {
        stats.failed++;
      } else if (result.gateDecision === "review") {
        stats.review++;
      }
    } catch (err) {
      log.error(`Pipeline failed for ${patternName}`, { error: String(err) });
      stats.failed++;
    }
  }

  log.success("V2 Pipeline complete", {
    patterns: String(patternNames.length),
    discovered: String(stats.discovered),
    scraped: String(stats.scraped),
    extracted: String(stats.extracted),
    enriched: String(stats.enriched),
    passed: String(stats.passed),
    review: String(stats.review),
    failed: String(stats.failed),
    ingested: String(stats.ingested),
  });
}

// ─── Full pattern pipeline ─────────────────────────────────────────────────

interface PatternPipelineResult {
  discovered: number;
  scraped: number;
  extracted: number;
  enriched: number;
  gateDecision: "pass" | "fail" | "review" | "skipped";
  ingested: boolean;
}

async function runPatternPipeline(patternName: string): Promise<PatternPipelineResult> {
  const result: PatternPipelineResult = {
    discovered: 0, scraped: 0, extracted: 0, enriched: 0,
    gateDecision: "skipped", ingested: false,
  };

  // Stage 1: Discovery
  log.info(`[1/8] Discovering sources for "${patternName}"`);
  const discovered = await discoverAllSources(patternName);
  result.discovered = discovered.length;

  if (discovered.length === 0) {
    log.warn("No sources found", { pattern: patternName });
    result.gateDecision = "fail";
    return result;
  }

  // Stage sources in DB
  for (const source of discovered) {
    try {
      await createStagedSource({
        sourceType: source.sourceType === "youtube" ? "youtube" : "blog",
        url: source.url,
        title: source.title,
        creatorName: undefined,
        platform: source.sourceType === "youtube" ? "YouTube" : new URL(source.url).hostname,
        patternQuery: patternName,
        metadata: { discoveryScore: source.discoveryScore, query: source.query },
      });
    } catch {
      // Duplicate URL — skip
    }
  }

  // Stage 2: Scraping
  log.info(`[2/8] Scraping ${discovered.length} sources`);
  const scraped = await scrapeAllSources(discovered);
  result.scraped = scraped.length;

  if (scraped.length === 0) {
    log.warn("No content scraped", { pattern: patternName });
    result.gateDecision = "fail";
    return result;
  }

  // Update staged sources with content
  for (const source of scraped) {
    try {
      const stagedSource = await prisma.stagedSource.findUnique({
        where: { url: source.url },
      });
      if (stagedSource) {
        await updateStagedSourceContent(stagedSource.id, source.content);
        await updateStagedSourceStatus(stagedSource.id, "scraped");
      }
    } catch {
      // Non-critical
    }
  }

  // Stage 3: Extraction (Haiku)
  log.info(`[3/8] Extracting patterns with Haiku`);
  const extractions = await extractAll(scraped, patternName);
  result.extracted = extractions.length;

  if (extractions.length === 0) {
    log.warn("No extractions succeeded", { pattern: patternName });
    result.gateDecision = "fail";
    return result;
  }

  // Stage extractions in DB
  for (const { extraction, source } of extractions) {
    try {
      const stagedSource = await prisma.stagedSource.findUnique({
        where: { url: source.url },
        select: { id: true },
      });
      if (stagedSource) {
        const confidence = calculateV2Confidence(extraction, source);
        await createStagedExtraction({
          sourceId: stagedSource.id,
          patternName: extraction.patternName,
          normalizedSlug: slugify(extraction.patternName),
          extractedData: extraction as unknown as Record<string, unknown>,
          confidence,
        });
      }
    } catch {
      // Non-critical
    }
  }

  // Stage 4: Enrichment (Sonnet)
  log.info(`[4/8] Enriching with Sonnet`);
  const enrichments = await enrichAll(extractions);
  result.enriched = enrichments.length;

  // Stage 5: Consensus
  log.info(`[5/8] Building consensus`);
  const consensus = await buildV2Consensus(
    enrichments,
    extractions.map((e) => e.source)
  );

  // Stage 6: Product Links
  log.info(`[6/8] Finding product links`);
  const productLinks = await findProductLinks(consensus.materials);

  // Stage 7: Images
  log.info(`[7/8] Finding and validating images`);
  const images = await findPatternImages(patternName, scraped);

  // Stage 8: Quality Gate
  log.info(`[8/8] Quality gate`);
  const gateResult = evaluateQuality(consensus, images, productLinks);
  result.gateDecision = gateResult.decision;

  if (gateResult.decision === "fail") {
    log.warn(`Quality gate FAILED for "${patternName}"`, {
      reasons: gateResult.reasons.join("; "),
    });

    // Mark extractions as rejected
    const stagedExtractions = await prisma.stagedExtraction.findMany({
      where: { normalizedSlug: consensus.slug, status: "extracted" },
      select: { id: true },
    });
    for (const ext of stagedExtractions) {
      await updateExtractionStatus(ext.id, "rejected", gateResult.reasons.join("; "));
    }

    return result;
  }

  // Ingest
  if (gateResult.decision === "pass" || gateResult.decision === "review") {
    log.info(`Ingesting "${patternName}" (gate: ${gateResult.decision})`);
    try {
      await ingestV2Pattern(consensus, scraped, images, productLinks);
      result.ingested = true;

      // Mark extractions as ingested
      const stagedExtractions = await prisma.stagedExtraction.findMany({
        where: { normalizedSlug: consensus.slug, status: "extracted" },
        select: { id: true },
      });
      for (const ext of stagedExtractions) {
        await updateExtractionStatus(ext.id, "ingested");
      }
    } catch (err) {
      log.error("Ingestion failed", { pattern: patternName, error: String(err) });
    }
  }

  return result;
}

// ─── Individual Stage Commands ─────────────────────────────────────────────

async function cmdDiscover(patterns: string[]) {
  const errors = validateV2Config();
  if (errors.length > 0) {
    log.error("Config errors", { errors: errors.join(", ") });
    process.exit(1);
  }

  const patternNames = patterns.length > 0 ? patterns : SEED_PATTERNS.map((p) => p.name);
  log.info(`Discovering sources for ${patternNames.length} patterns`);

  let totalSources = 0;
  for (let i = 0; i < patternNames.length; i++) {
    const name = patternNames[i]!;
    console.log(progressBar(i + 1, patternNames.length, name));

    const sources = await discoverAllSources(name);
    totalSources += sources.length;

    for (const source of sources) {
      try {
        await createStagedSource({
          sourceType: source.sourceType === "youtube" ? "youtube" : "blog",
          url: source.url,
          title: source.title,
          creatorName: undefined,
          platform: source.sourceType === "youtube" ? "YouTube" : new URL(source.url).hostname,
          patternQuery: name,
          metadata: { discoveryScore: source.discoveryScore },
        });
      } catch {
        // Duplicate
      }
    }
  }

  log.success("Discovery complete", { total: String(totalSources) });
}

async function cmdScrape(patterns: string[]) {
  const errors = validateV2Config();
  if (errors.length > 0) { log.error("Config errors", { errors: errors.join(", ") }); process.exit(1); }

  // Get discovered (not yet scraped) sources
  const stagedSources = await getStagedSourcesByStatus("discovered");

  const filtered = patterns.length > 0
    ? stagedSources.filter((s: { patternQuery: string }) => patterns.some((p) => s.patternQuery.toLowerCase().includes(p.toLowerCase())))
    : stagedSources;

  log.info(`Scraping ${filtered.length} sources`);

  for (const staged of filtered) {
    const discovered: DiscoveredSource = {
      url: staged.url,
      title: staged.title ?? "",
      sourceType: staged.sourceType === "youtube" ? "youtube" : "web",
      snippet: "",
      discoveryScore: 0,
      query: staged.patternQuery,
    };

    const scraped = await scrapeAllSources([discovered]);
    for (const s of scraped) {
      await updateStagedSourceContent(staged.id, s.content);
      await updateStagedSourceStatus(staged.id, "scraped");
    }
  }

  log.success("Scraping complete");
}

async function cmdExtract(patterns: string[]) {
  const errors = validateV2Config();
  if (errors.length > 0) { log.error("Config errors", { errors: errors.join(", ") }); process.exit(1); }

  const scrapedSources = await getStagedSourcesByStatus("scraped");

  const filtered = patterns.length > 0
    ? scrapedSources.filter((s: { patternQuery: string }) => patterns.some((p) => s.patternQuery.toLowerCase().includes(p.toLowerCase())))
    : scrapedSources;

  log.info(`Extracting from ${filtered.length} scraped sources`);

  for (const staged of filtered) {
    if (!staged.rawContent) continue;

    const source: ScrapedSource = {
      url: staged.url,
      title: staged.title ?? "",
      sourceType: staged.sourceType === "youtube" ? "youtube" : "web",
      content: staged.rawContent,
      materialsHtml: null,
      creator: staged.creatorName,
      platform: staged.platform ?? "Unknown",
      videoId: null,
      hasTranscript: false,
      inlineImages: [],
      lowConfidence: false,
    };

    const results = await extractAll([source], staged.patternQuery);

    for (const { extraction, source: src } of results) {
      const confidence = calculateV2Confidence(extraction, src);
      await createStagedExtraction({
        sourceId: staged.id,
        patternName: extraction.patternName,
        normalizedSlug: slugify(extraction.patternName),
        extractedData: extraction as unknown as Record<string, unknown>,
        confidence,
      });
      await updateStagedSourceStatus(staged.id, "extracted");
    }
  }

  log.success("Extraction complete");
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log(`
V2 Pipeline Commands:
  discover [patterns...]  - Find sources
  scrape [patterns...]    - Scrape content
  extract [patterns...]   - Extract with Haiku
  run [patterns...]       - Full pipeline

Examples:
  tsx src/pipeline/v2/cli.ts run "Adams" "Woolly Bugger"
  tsx src/pipeline/v2/cli.ts discover
  tsx src/pipeline/v2/cli.ts run
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case "discover":
        await cmdDiscover(args);
        break;
      case "scrape":
        await cmdScrape(args);
        break;
      case "extract":
        await cmdExtract(args);
        break;
      case "run":
        await cmdRun(args);
        break;
      default:
        log.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
