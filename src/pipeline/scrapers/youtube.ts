import { PIPELINE_CONFIG } from "../config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { RawYouTubeResult } from "../types";

const log = createLogger("youtube");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

// ─── Brave Web Search for YouTube Discovery ─────────────────────────────────

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";

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
 * Try to extract channel name from Brave search result title.
 * Brave titles often look like "Video Title - Channel Name"
 * (YouTube suffix is usually stripped by Brave).
 */
function extractChannelFromTitle(title: string): string {
  const cleaned = title.replace(/\s*[-–]\s*YouTube$/i, "");
  const parts = cleaned.split(/\s*[-–]\s*/);
  return parts.length > 1 ? parts[parts.length - 1]!.trim() : "";
}

/**
 * Search for YouTube fly tying videos using Brave Web Search.
 * Uses site:youtube.com queries instead of YouTube Data API v3.
 * No YouTube API key needed — uses BRAVE_SEARCH_API_KEY.
 */
export async function searchYouTube(
  patternName: string
): Promise<RawYouTubeResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log.warn("BRAVE_SEARCH_API_KEY not configured — skipping YouTube discovery");
    return [];
  }

  const results: RawYouTubeResult[] = [];
  const seenVideoIds = new Set<string>();

  for (const queryTemplate of PIPELINE_CONFIG.youtube.searchQueries) {
    const query = queryTemplate.replace("{pattern}", patternName);
    log.info("Searching Brave for YouTube videos", { query });

    await rateLimit();

    const params = new URLSearchParams({
      q: query,
      count: String(PIPELINE_CONFIG.youtube.maxResultsPerQuery),
      country: "us",
    });

    try {
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
        { maxRetries: 2, backoffMs: 2000, label: `brave-yt:${query}` }
      );

      if (!res.ok) {
        log.warn(`Brave Search error: ${res.status}`, { query });
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

      if (!data.web?.results?.length) {
        log.warn("No Brave results for query", { query });
        continue;
      }

      for (const item of data.web.results) {
        const videoId = extractVideoId(item.url);
        if (!videoId || seenVideoIds.has(videoId)) continue;
        seenVideoIds.add(videoId);

        // Fetch transcript (free — scrapes YouTube page directly, no API quota)
        let transcript: string | null = null;
        try {
          transcript = await fetchTranscript(videoId);
        } catch (err) {
          log.debug("No transcript available", {
            videoId,
            error: String(err),
          });
        }

        // Include video if it has transcript, decent description, or matching title
        const titleLower = item.title.toLowerCase();
        const patternLower = patternName.toLowerCase();
        const titleMatchesPattern = patternLower
          .split(/\s+/)
          .some((w) => w.length > 3 && titleLower.includes(w));
        const description = item.description ?? "";

        if (transcript || description.length > 50 || titleMatchesPattern) {
          results.push({
            videoId,
            title: item.title,
            channelTitle: extractChannelFromTitle(item.title),
            description,
            publishedAt: "",
            viewCount: 0,
            likeCount: 0,
            transcript,
          });
        }
      }

      log.success("Brave YouTube search complete", {
        query,
        resultsFound: String(results.length),
      });
    } catch (err) {
      log.error("Brave YouTube search failed", {
        query,
        error: String(err),
      });
    }
  }

  return results;
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

  // Video engagement (from YouTube API stats — zeroed for Brave-discovered videos)
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
