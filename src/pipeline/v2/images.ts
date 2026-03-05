/**
 * V2 Image Pipeline (Lightweight)
 *
 * Uses images already collected during scraping + free Wikimedia search.
 * Skips expensive v1 infrastructure (Brave images, Serper, blog scraping,
 * fly shop scraping) to avoid ~40 extra network requests per pattern.
 *
 * Sources (cheapest first):
 *   1. Inline images from scraped web pages (free — already fetched)
 *   2. YouTube thumbnails (free — deterministic URL)
 *   3. Wikimedia Commons (free — no API key)
 *   4. Vision validation on top candidates only
 */

import {
  youtubeThumbUrls,
  validateImageWithVision,
  isPlaceholderImage,
  extractImagesFromStagedContent,
} from "../scrapers/images";
import { V2_CONFIG } from "./config";
import { mapConcurrent } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { DiscoveredImage } from "../scrapers/images";
import type { ScrapedSource, ValidatedImage } from "./types";

const log = createLogger("v2:images");

/**
 * Discover and validate images for a pattern.
 * Lightweight version — no extra API calls for image search.
 */
export async function findPatternImages(
  patternName: string,
  sources: ScrapedSource[]
): Promise<ValidatedImage[]> {
  const discovered: DiscoveredImage[] = [];
  const seen = new Set<string>();

  function addImage(img: DiscoveredImage) {
    if (seen.has(img.url) || isPlaceholderImage(img.url)) return;
    seen.add(img.url);
    discovered.push(img);
  }

  // 1. Inline images from already-scraped web pages (free)
  for (const source of sources) {
    for (const img of source.inlineImages) {
      addImage({
        url: img.url,
        caption: img.caption || img.alt || `${patternName} fly`,
        source: "blog_scrape",
        relevanceScore: 0.65,
      });
    }
  }

  // 2. YouTube thumbnails (free, deterministic)
  const videoIds = sources
    .filter((s) => s.videoId)
    .map((s) => s.videoId!);
  for (const videoId of videoIds.slice(0, 4)) {
    for (const thumb of youtubeThumbUrls(videoId)) {
      addImage(thumb);
    }
  }

  // 3. Extract from any HTML content we already have (free)
  for (const source of sources) {
    if (source.sourceType === "web" && source.content.includes("<img")) {
      const extracted = extractImagesFromStagedContent(source.content, patternName);
      for (const img of extracted) {
        addImage(img);
      }
    }
  }

  log.info("Image sources collected", {
    pattern: patternName,
    inline: String(sources.reduce((n, s) => n + s.inlineImages.length, 0)),
    youtube: String(videoIds.length),
    total: String(discovered.length),
  });

  if (discovered.length === 0) {
    log.warn("No images found", { pattern: patternName });
    return [];
  }

  // Sort by relevance and take top candidates
  discovered.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const candidates = discovered.slice(0, V2_CONFIG.images.maxImagesPerPattern);

  // Vision-validate top candidates in parallel
  const toValidate = candidates.slice(0, V2_CONFIG.images.maxVisionValidations);
  const remainder = candidates.slice(V2_CONFIG.images.maxVisionValidations);

  const visionResults = await mapConcurrent(
    toValidate,
    3,
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
    if (candidate.relevanceScore >= 0.6) {
      validated.push({
        url: candidate.url,
        caption: candidate.caption,
        source: candidate.source,
        relevanceScore: candidate.relevanceScore,
        visionValidated: false,
      });
    }
  }

  log.success("Image pipeline complete", {
    pattern: patternName,
    discovered: String(discovered.length),
    validated: String(validated.length),
    visionChecked: String(toValidate.length),
  });

  return validated;
}
