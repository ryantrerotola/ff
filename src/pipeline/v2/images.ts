/**
 * V2 Image Pipeline
 *
 * Discovers and validates pattern images.
 * Reuses v1 image infrastructure but enhanced with:
 *   - Inline images from scraped sources
 *   - Enhanced vision validation prompt
 *   - Better relevance scoring
 */

import {
  discoverPatternImages,
  validateImageWithVision,
} from "../scrapers/images";
import { V2_CONFIG } from "./config";
import { mapConcurrent } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { ScrapedSource, ValidatedImage } from "./types";

const log = createLogger("v2:images");

/**
 * Discover and validate images for a pattern.
 */
export async function findPatternImages(
  patternName: string,
  sources: ScrapedSource[]
): Promise<ValidatedImage[]> {
  // Collect YouTube video IDs from sources
  const videoIds = sources
    .filter((s) => s.videoId)
    .map((s) => s.videoId!);

  // Collect inline images from scraped web sources
  const inlineImages = sources.flatMap((s) => s.inlineImages);

  // Collect any raw HTML content for image extraction
  const stagedHtmlContent: string[] = [];
  for (const source of sources) {
    if (source.sourceType === "web" && source.content.includes("<img")) {
      stagedHtmlContent.push(source.content);
    }
  }

  log.info("Discovering images", {
    pattern: patternName,
    videoIds: String(videoIds.length),
    inlineImages: String(inlineImages.length),
  });

  // Use v1 image discovery infrastructure
  const discovered = await discoverPatternImages(
    patternName,
    videoIds,
    stagedHtmlContent
  );

  // Add inline images from v2 scraping (not in v1)
  for (const img of inlineImages) {
    if (!discovered.some((d) => d.url === img.url)) {
      discovered.push({
        url: img.url,
        caption: img.caption || img.alt || `${patternName} fly`,
        source: "blog_scrape",
        relevanceScore: 0.6,
      });
    }
  }

  // Sort by relevance and take top candidates
  discovered.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const candidates = discovered.slice(0, V2_CONFIG.images.maxImagesPerPattern);

  log.info("Validating images with vision", {
    pattern: patternName,
    candidates: String(candidates.length),
  });

  // Split candidates: vision-validate the top N, score-gate the rest
  const toValidate = candidates.slice(0, V2_CONFIG.images.maxVisionValidations);
  const remainder = candidates.slice(V2_CONFIG.images.maxVisionValidations);

  // Validate top candidates with Claude vision in parallel
  const visionResults = await mapConcurrent(
    toValidate,
    3, // Concurrency limit for vision API
    async (candidate) => {
      try {
        const isValid = await validateImageWithVision(candidate.url, patternName);
        if (isValid) {
          return {
            url: candidate.url,
            caption: candidate.caption,
            source: candidate.source,
            relevanceScore: candidate.relevanceScore,
            visionValidated: true,
          } as ValidatedImage;
        }
      } catch (err) {
        log.debug("Vision validation failed", { url: candidate.url, error: String(err) });
      }
      return null;
    }
  );

  const validated: ValidatedImage[] = visionResults.filter((r): r is ValidatedImage => r !== null);

  // Include high-scoring remainder without vision validation
  for (const candidate of remainder) {
    if (candidate.relevanceScore >= 0.7) {
      validated.push({
        url: candidate.url,
        caption: candidate.caption,
        source: candidate.source,
        relevanceScore: candidate.relevanceScore,
        visionValidated: false,
      });
    }
  }

  const validationCount = toValidate.length;

  log.success("Image pipeline complete", {
    pattern: patternName,
    discovered: String(discovered.length),
    validated: String(validated.length),
    visionChecked: String(validationCount),
  });

  return validated;
}
