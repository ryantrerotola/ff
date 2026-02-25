import { createLogger } from "../utils/logger";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { PIPELINE_CONFIG } from "../config";

const log = createLogger("images");
const rateLimit = createRateLimiter(250);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiscoveredImage {
  url: string;
  caption: string;
  source: "google" | "youtube_thumb" | "bing";
  relevanceScore: number;
}

// ─── Google Custom Search ────────────────────────────────────────────────────

const GOOGLE_CSE_API = "https://www.googleapis.com/customsearch/v1";

async function searchGoogleImages(
  query: string
): Promise<DiscoveredImage[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const engineId = process.env.GOOGLE_CSE_ENGINE_ID;

  if (!apiKey || !engineId) {
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    searchType: "image",
    num: "5",
    imgSize: "large",
    safe: "active",
  });

  try {
    const res = await retry(
      () =>
        fetch(`${GOOGLE_CSE_API}?${params}`, {
          headers: { "User-Agent": PIPELINE_CONFIG.scraping.userAgent },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `google-images:${query}` }
    );

    if (!res.ok) {
      log.error(`Google CSE error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      items?: {
        link: string;
        title: string;
        image?: { contextLink: string };
      }[];
    };

    return (data.items ?? []).map((item, i) => ({
      url: item.link,
      caption: item.title,
      source: "google" as const,
      relevanceScore: 1 - i * 0.15, // Top result gets highest score
    }));
  } catch (err) {
    log.error("Google image search failed", { query, error: String(err) });
    return [];
  }
}

// ─── Bing Image Search (fallback) ────────────────────────────────────────────

const BING_API = "https://api.bing.microsoft.com/v7.0/images/search";

async function searchBingImages(
  query: string
): Promise<DiscoveredImage[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    q: query,
    count: "5",
    imageType: "Photo",
    safeSearch: "Moderate",
  });

  try {
    const res = await retry(
      () =>
        fetch(`${BING_API}?${params}`, {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
            "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `bing-images:${query}` }
    );

    if (!res.ok) {
      log.error(`Bing image search error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      value?: { contentUrl: string; name: string }[];
    };

    return (data.value ?? []).map((item, i) => ({
      url: item.contentUrl,
      caption: item.name,
      source: "bing" as const,
      relevanceScore: 0.8 - i * 0.1,
    }));
  } catch (err) {
    log.error("Bing image search failed", { query, error: String(err) });
    return [];
  }
}

// ─── YouTube Thumbnail Extraction ────────────────────────────────────────────

/**
 * Generate YouTube thumbnail URLs from a video ID.
 * These are publicly accessible without any API key.
 */
export function youtubeThumbUrls(videoId: string): DiscoveredImage[] {
  return [
    {
      url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      caption: "YouTube tutorial thumbnail (high res)",
      source: "youtube_thumb" as const,
      relevanceScore: 0.7,
    },
    {
      url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      caption: "YouTube tutorial thumbnail",
      source: "youtube_thumb" as const,
      relevanceScore: 0.5,
    },
  ];
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Search for images of a fly pattern using all available sources.
 * Falls through: Google CSE → Bing → YouTube thumbnails (from existing sources).
 */
export async function discoverPatternImages(
  patternName: string,
  existingVideoIds: string[] = []
): Promise<DiscoveredImage[]> {
  const query = `${patternName} fly pattern tying close up photo`;

  // Try Google first
  let images = await searchGoogleImages(query);

  // Fall back to Bing
  if (images.length === 0) {
    images = await searchBingImages(query);
  }

  // Always add YouTube thumbnails from existing scraped sources
  for (const videoId of existingVideoIds.slice(0, 3)) {
    images.push(...youtubeThumbUrls(videoId));
  }

  // Sort by relevance
  images.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return images;
}

/**
 * Quick check if a URL looks like a placeholder image.
 */
export function isPlaceholderImage(url: string): boolean {
  return url.includes("placehold.co") || url.includes("placeholder");
}
