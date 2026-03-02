import { prisma } from "@/lib/prisma";
import { PIPELINE_CONFIG } from "../config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";

const log = createLogger("technique-scraper");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";

/**
 * Search queries for discovering technique tutorial videos.
 */
const SEARCH_TEMPLATES = [
  "site:youtube.com fly tying {technique} tutorial",
  "site:youtube.com how to {technique} fly tying",
];

/**
 * Extract YouTube video ID from a URL.
 */
function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] ?? null;
    }
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Score a YouTube result for relevance to a fly tying technique.
 */
function scoreResult(title: string, techniqueName: string): number {
  const titleLower = title.toLowerCase();
  const techLower = techniqueName.toLowerCase();
  let score = 0;

  if (titleLower.includes(techLower)) score += 10;
  if (titleLower.includes("fly tying")) score += 5;
  if (titleLower.includes("tutorial")) score += 3;
  if (titleLower.includes("how to")) score += 3;
  if (titleLower.includes("beginner")) score += 2;
  if (titleLower.includes("technique")) score += 2;
  if (titleLower.includes("tip")) score += 1;

  // Penalize unrelated content
  if (titleLower.includes("fishing report")) score -= 5;
  if (titleLower.includes("unboxing")) score -= 3;

  return score;
}

/**
 * Try to extract channel name from Brave search result title.
 */
function extractChannelFromTitle(title: string): string {
  const cleaned = title.replace(/\s*[-–]\s*YouTube$/i, "");
  const parts = cleaned.split(/\s*[-–]\s*/);
  return parts.length > 1 ? parts[parts.length - 1]!.trim() : "";
}

/**
 * Discover and save YouTube technique tutorial videos.
 * Uses Brave Web Search with site:youtube.com instead of YouTube Data API.
 * Requires BRAVE_SEARCH_API_KEY to be set.
 */
export async function discoverTechniqueVideos(
  techniqueSlug?: string,
): Promise<number> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log.error("BRAVE_SEARCH_API_KEY is required for technique video discovery");
    return 0;
  }

  const techniques = techniqueSlug
    ? await prisma.tyingTechnique.findMany({
        where: { slug: techniqueSlug },
        include: { videos: true },
      })
    : await prisma.tyingTechnique.findMany({ include: { videos: true } });

  if (techniques.length === 0) {
    log.warn("No techniques found to discover videos for");
    return 0;
  }

  log.info(`Discovering videos for ${techniques.length} techniques`);
  let totalNew = 0;

  for (const technique of techniques) {
    const existingUrls = new Set(technique.videos.map((v) => v.url));
    const candidates: {
      videoId: string;
      title: string;
      channelTitle: string;
      thumbnailUrl: string | null;
      score: number;
    }[] = [];

    // Search Brave for each query template
    for (const template of SEARCH_TEMPLATES) {
      const query = template.replace("{technique}", technique.name);

      await rateLimit();

      try {
        const params = new URLSearchParams({
          q: query,
          count: "10",
          country: "us",
        });

        const res = await retry(
          () =>
            fetch(`${BRAVE_WEB_API}?${params}`, {
              headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Cache-Control": "no-cache",
                "X-Subscription-Token": apiKey,
              },
              signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
            }),
          { maxRetries: 2, backoffMs: 2000, label: `brave-tech:${query}` }
        );

        if (!res.ok) {
          log.error("Brave search failed", {
            technique: technique.name,
            status: String(res.status),
          });
          continue;
        }

        const data = (await res.json()) as {
          web?: {
            results?: {
              url: string;
              title: string;
              description?: string;
            }[];
          };
        };

        for (const item of data.web?.results ?? []) {
          const videoId = extractVideoId(item.url);
          if (!videoId) continue;

          const url = `https://www.youtube.com/watch?v=${videoId}`;
          if (existingUrls.has(url)) continue;

          // Use YouTube thumbnail URL format (no API needed)
          const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          candidates.push({
            videoId,
            title: item.title.replace(/\s*[-–]\s*YouTube$/i, ""),
            channelTitle: extractChannelFromTitle(item.title),
            thumbnailUrl,
            score: scoreResult(item.title, technique.name),
          });
        }
      } catch (err) {
        log.error("Brave search error", {
          query,
          error: String(err),
        });
      }
    }

    // Deduplicate by videoId and sort by score
    const seen = new Set<string>();
    const unique = candidates.filter((c) => {
      if (seen.has(c.videoId)) return false;
      seen.add(c.videoId);
      return c.score > 0;
    });
    unique.sort((a, b) => b.score - a.score);

    // Take top 3 results
    const topResults = unique.slice(0, 3);

    for (const result of topResults) {
      const url = `https://www.youtube.com/watch?v=${result.videoId}`;
      try {
        await prisma.techniqueVideo.create({
          data: {
            techniqueId: technique.id,
            title: result.title,
            url,
            creatorName: result.channelTitle || "Unknown",
            thumbnailUrl: result.thumbnailUrl,
            duration: null,
            qualityScore: result.score >= 10 ? 5 : result.score >= 5 ? 4 : 3,
          },
        });
        totalNew++;
        log.info("Added video", {
          technique: technique.name,
          title: result.title.slice(0, 50),
        });
      } catch {
        // URL already exists (unique constraint)
      }
    }
  }

  log.success(`Technique video discovery complete: ${totalNew} new videos added`);
  return totalNew;
}
