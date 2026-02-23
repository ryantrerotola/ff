import { PIPELINE_CONFIG } from "../config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { RawYouTubeResult } from "../types";

const log = createLogger("youtube");
const rateLimit = createRateLimiter(200);

// ─── YouTube Data API v3 ────────────────────────────────────────────────────

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    publishedAt: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: { totalResults: number };
}

interface YouTubeVideoStats {
  id: string;
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

interface YouTubeVideoResponse {
  items: YouTubeVideoStats[];
}

/**
 * Search YouTube for fly tying videos matching a pattern name.
 */
export async function searchYouTube(
  patternName: string
): Promise<RawYouTubeResult[]> {
  const apiKey = PIPELINE_CONFIG.youtube.apiKey;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  const results: RawYouTubeResult[] = [];

  for (const queryTemplate of PIPELINE_CONFIG.youtube.searchQueries) {
    const query = queryTemplate.replace("{pattern}", patternName);
    log.info("Searching YouTube", { query });

    await rateLimit();

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set(
      "maxResults",
      String(PIPELINE_CONFIG.youtube.maxResultsPerQuery)
    );
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("videoDuration", "medium");
    searchUrl.searchParams.set("key", apiKey);

    const searchData = await retry(
      async () => {
        const res = await fetch(searchUrl.toString());
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`YouTube search API error ${res.status}: ${body}`);
        }
        return res.json() as Promise<YouTubeSearchResponse>;
      },
      { maxRetries: 2, label: `youtube-search:${query}` }
    );

    if (!searchData.items?.length) {
      log.warn("No results for query", { query });
      continue;
    }

    // Fetch video statistics in batch
    const videoIds = searchData.items.map((item) => item.id.videoId);
    const statsMap = await fetchVideoStats(videoIds, apiKey);

    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const stats = statsMap.get(videoId);

      // Fetch transcript
      let transcript: string | null = null;
      try {
        transcript = await fetchTranscript(videoId);
      } catch (err) {
        log.debug("No transcript available", {
          videoId,
          error: String(err),
        });
      }

      // Only include if we got a transcript or a detailed description
      if (transcript || item.snippet.description.length > 100) {
        results.push({
          videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(stats?.statistics.viewCount ?? "0", 10),
          likeCount: parseInt(stats?.statistics.likeCount ?? "0", 10),
          transcript,
        });
      }
    }

    log.success("Search complete", {
      query,
      resultsFound: String(results.length),
    });
  }

  // Deduplicate by videoId
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.videoId)) return false;
    seen.add(r.videoId);
    return true;
  });
}

/**
 * Fetch video statistics for a batch of video IDs.
 */
async function fetchVideoStats(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, YouTubeVideoStats>> {
  await rateLimit();

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const data = await retry(
    async () => {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`YouTube videos API error ${res.status}`);
      return res.json() as Promise<YouTubeVideoResponse>;
    },
    { maxRetries: 2, label: "youtube-stats" }
  );

  const map = new Map<string, YouTubeVideoStats>();
  for (const item of data.items) {
    map.set(item.id, item);
  }
  return map;
}

// ─── Transcript Fetching ────────────────────────────────────────────────────

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

/**
 * Fetch video transcript using YouTube's internal timedtext API.
 * This does not require an API key or OAuth.
 */
export async function fetchTranscript(
  videoId: string
): Promise<string | null> {
  await rateLimit();

  // Step 1: Fetch the video page to get the captions track URL
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const pageRes = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!pageRes.ok) return null;

  const html = await pageRes.text();

  // Extract captions player response
  const captionsMatch = html.match(
    /"captions":\s*(\{[\s\S]*?"playerCaptionsTracklistRenderer"[\s\S]*?\})\s*,\s*"videoDetails"/
  );

  if (!captionsMatch?.[1]) return null;

  let captionsData: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: { baseUrl: string; languageCode: string }[];
    };
  };

  try {
    captionsData = JSON.parse(captionsMatch[1]) as typeof captionsData;
  } catch {
    return null;
  }

  const tracks =
    captionsData.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;

  // Prefer English, fall back to first available
  const track =
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode.startsWith("en")) ??
    tracks[0];

  if (!track) return null;

  // Step 2: Fetch the caption track as JSON
  const captionUrl = `${track.baseUrl}&fmt=json3`;
  const captionRes = await fetch(captionUrl);
  if (!captionRes.ok) return null;

  let captionData: {
    events?: { segs?: { utf8: string }[]; tStartMs?: number; dDurationMs?: number }[];
  };

  try {
    captionData = (await captionRes.json()) as typeof captionData;
  } catch {
    return null;
  }

  if (!captionData.events) return null;

  // Step 3: Assemble transcript text
  const segments: TranscriptSegment[] = [];

  for (const event of captionData.events) {
    if (!event.segs) continue;
    const text = event.segs
      .map((seg) => seg.utf8)
      .join("")
      .trim();
    if (text) {
      segments.push({
        text,
        offset: event.tStartMs ?? 0,
        duration: event.dDurationMs ?? 0,
      });
    }
  }

  if (segments.length === 0) return null;

  return segments.map((s) => s.text).join(" ");
}

/**
 * Build the full YouTube video URL.
 */
export function youtubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Score a YouTube result for relevance to fly tying content.
 * Higher score = more relevant.
 */
export function scoreYouTubeResult(result: RawYouTubeResult): number {
  let score = 0;

  // Transcript available is a big signal
  if (result.transcript) score += 30;

  // Video engagement
  if (result.viewCount > 100000) score += 10;
  else if (result.viewCount > 10000) score += 7;
  else if (result.viewCount > 1000) score += 4;

  if (result.likeCount > 1000) score += 5;

  // Title signals
  const titleLower = result.title.toLowerCase();
  if (titleLower.includes("how to tie")) score += 10;
  if (titleLower.includes("fly tying")) score += 8;
  if (titleLower.includes("tutorial")) score += 5;
  if (titleLower.includes("recipe")) score += 5;
  if (titleLower.includes("step by step")) score += 5;
  if (titleLower.includes("materials")) score += 3;

  // Known quality creators — trusted channels that produce accurate, detailed
  // fly tying content. This list boosts relevance scoring but does not limit discovery.
  const knownCreators = [
    // Tier 1: Prolific, highly trusted instructional channels
    "tim flagler",
    "tightline",
    "davie mcphail",
    "intherifle",
    "fly fish food",
    "lance egan",
    "mcfly angler",
    "hans weilenmann",
    "barry ord clarke",
    "cheech",
    "curtis fry",
    "charlie craven",
    // Tier 2: Well-known fly tying / fly fishing educators
    "troutbitten",
    "mad river outfitters",
    "orvis",
    "flylords",
    "dressed irons",
    "piscator flies",
    "gunnar brammer",
    "andrew grillos",
    "ants fly fishing",
    "cotter's fly shop",
    "rio products",
    "loon outdoors",
    "trident fly fishing",
    "the new fly fisher",
    "postfly",
    "fatties on the fly",
    "fly tying 123",
    "steve parrott",
    "hans stephenson",
    "matt grobert",
    "al & gretchen beatty",
  ];
  const channelLower = result.channelTitle.toLowerCase();
  if (knownCreators.some((c) => channelLower.includes(c))) score += 15;

  // Description has material keywords
  const descLower = result.description.toLowerCase();
  const materialKeywords = [
    "hook",
    "thread",
    "tail",
    "body",
    "hackle",
    "wing",
    "dubbing",
    "bead",
    "rib",
  ];
  const matchCount = materialKeywords.filter((kw) =>
    descLower.includes(kw)
  ).length;
  score += matchCount * 2;

  return score;
}
