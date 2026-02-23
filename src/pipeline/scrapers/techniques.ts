import { prisma } from "@/lib/prisma";
import { PIPELINE_CONFIG } from "../config";
import { createLogger } from "../utils/logger";

const log = createLogger("technique-scraper");

/**
 * Search queries for discovering technique tutorial videos.
 */
const SEARCH_TEMPLATES = [
  "fly tying {technique} tutorial",
  "how to {technique} fly tying",
  "{technique} fly tying technique beginner",
];

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubeVideoItem {
  id: string;
  contentDetails: { duration: string };
}

interface YouTubeVideoResponse {
  items?: YouTubeVideoItem[];
}

/**
 * Convert ISO 8601 duration (PT12M34S) to human-readable (12:34).
 */
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = match[1] ? `${match[1]}:` : "";
  const m = match[2] ?? "0";
  const s = (match[3] ?? "0").padStart(2, "0");
  return `${h}${m}:${s}`;
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
 * Discover and save YouTube technique tutorial videos.
 * Requires YOUTUBE_API_KEY to be set.
 */
export async function discoverTechniqueVideos(
  techniqueSlug?: string,
): Promise<number> {
  const apiKey = PIPELINE_CONFIG.youtube.apiKey;
  if (!apiKey) {
    log.error("YOUTUBE_API_KEY is required for technique video discovery");
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

    // Search YouTube for each query template
    for (const template of SEARCH_TEMPLATES) {
      const query = template.replace("{technique}", technique.name);

      try {
        const params = new URLSearchParams({
          part: "snippet",
          q: query,
          type: "video",
          maxResults: "5",
          key: apiKey,
        });

        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?${params}`,
          { signal: AbortSignal.timeout(10000) },
        );

        if (!res.ok) {
          log.error("YouTube search failed", {
            technique: technique.name,
            status: String(res.status),
          });
          continue;
        }

        const data: YouTubeSearchResponse = await res.json();

        for (const item of data.items ?? []) {
          const videoId = item.id.videoId;
          const url = `https://www.youtube.com/watch?v=${videoId}`;

          if (existingUrls.has(url)) continue;

          candidates.push({
            videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl:
              item.snippet.thumbnails.high?.url ??
              item.snippet.thumbnails.medium?.url ??
              null,
            score: scoreResult(item.snippet.title, technique.name),
          });
        }
      } catch (err) {
        log.error("YouTube search error", {
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

    // Fetch durations for top results
    if (topResults.length > 0) {
      try {
        const videoIds = topResults.map((r) => r.videoId).join(",");
        const params = new URLSearchParams({
          part: "contentDetails",
          id: videoIds,
          key: apiKey,
        });

        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?${params}`,
          { signal: AbortSignal.timeout(10000) },
        );

        if (res.ok) {
          const data: YouTubeVideoResponse = await res.json();
          const durations = new Map(
            (data.items ?? []).map((item) => [
              item.id,
              parseDuration(item.contentDetails.duration),
            ]),
          );

          for (const result of topResults) {
            const url = `https://www.youtube.com/watch?v=${result.videoId}`;
            try {
              await prisma.techniqueVideo.create({
                data: {
                  techniqueId: technique.id,
                  title: result.title,
                  url,
                  creatorName: result.channelTitle,
                  thumbnailUrl: result.thumbnailUrl,
                  duration: durations.get(result.videoId) ?? null,
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
      } catch (err) {
        log.error("Failed to fetch video details", { error: String(err) });
      }
    }
  }

  log.success(`Technique video discovery complete: ${totalNew} new videos added`);
  return totalNew;
}
