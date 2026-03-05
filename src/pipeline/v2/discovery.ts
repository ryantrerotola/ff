/**
 * V2 Discovery Stage
 *
 * Finds sources for a fly pattern using Brave web search.
 * No hardcoded blog sites — searches the entire web.
 * Multiple query templates for both YouTube and general web.
 */

import { V2_CONFIG } from "./config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { DiscoveredSource } from "./types";

const log = createLogger("v2:discovery");
const rateLimit = createRateLimiter(V2_CONFIG.scraping.requestDelayMs);

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";

// ─── YouTube Discovery ─────────────────────────────────────────────────────

/**
 * Discover YouTube videos for a pattern using Brave web search.
 */
export async function discoverYouTubeSources(
  patternName: string
): Promise<DiscoveredSource[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log.warn("BRAVE_SEARCH_API_KEY not configured — skipping YouTube discovery");
    return [];
  }

  const results: DiscoveredSource[] = [];
  const seenUrls = new Set<string>();

  for (const template of V2_CONFIG.discovery.youtubeQueries) {
    const query = template.replace("{pattern}", patternName);
    const sources = await searchBrave(query, apiKey);

    for (const source of sources) {
      // Only keep YouTube URLs
      if (!source.url.includes("youtube.com/watch") && !source.url.includes("youtu.be/")) {
        continue;
      }
      if (seenUrls.has(source.url)) continue;
      seenUrls.add(source.url);

      results.push({
        ...source,
        sourceType: "youtube",
        discoveryScore: scoreYouTubeDiscovery(source),
      });
    }
  }

  // Sort by discovery score and cap
  results.sort((a, b) => b.discoveryScore - a.discoveryScore);
  const capped = results.slice(0, V2_CONFIG.discovery.maxYouTubePerPattern);

  log.info("YouTube discovery complete", {
    pattern: patternName,
    found: String(results.length),
    kept: String(capped.length),
  });

  return capped;
}

// ─── Web Discovery ─────────────────────────────────────────────────────────

/**
 * Discover web sources (blogs, forums, etc.) for a pattern using Brave.
 * No hardcoded sites — searches the entire web.
 */
export async function discoverWebSources(
  patternName: string
): Promise<DiscoveredSource[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log.warn("BRAVE_SEARCH_API_KEY not configured — skipping web discovery");
    return [];
  }

  const results: DiscoveredSource[] = [];
  const seenUrls = new Set<string>();

  for (const template of V2_CONFIG.discovery.webQueries) {
    const query = template.replace("{pattern}", patternName);
    const sources = await searchBrave(query, apiKey);

    for (const source of sources) {
      // Skip YouTube URLs (handled separately)
      if (source.url.includes("youtube.com") || source.url.includes("youtu.be")) {
        continue;
      }
      // Skip non-content pages
      if (isJunkUrl(source.url)) continue;
      if (seenUrls.has(source.url)) continue;
      seenUrls.add(source.url);

      results.push({
        ...source,
        sourceType: "web",
        discoveryScore: scoreWebDiscovery(source, patternName),
      });
    }
  }

  // Sort by discovery score and cap
  results.sort((a, b) => b.discoveryScore - a.discoveryScore);
  const capped = results.slice(0, V2_CONFIG.discovery.maxWebPerPattern);

  log.info("Web discovery complete", {
    pattern: patternName,
    found: String(results.length),
    kept: String(capped.length),
  });

  return capped;
}

// ─── Combined Discovery ────────────────────────────────────────────────────

/**
 * Discover all sources (YouTube + web) for a pattern.
 */
export async function discoverAllSources(
  patternName: string
): Promise<DiscoveredSource[]> {
  const [youtube, web] = await Promise.all([
    discoverYouTubeSources(patternName),
    discoverWebSources(patternName),
  ]);

  const all = [...youtube, ...web];

  log.success("Discovery complete", {
    pattern: patternName,
    youtube: String(youtube.length),
    web: String(web.length),
    total: String(all.length),
  });

  return all;
}

// ─── Brave Search ──────────────────────────────────────────────────────────

interface BraveResult {
  url: string;
  title: string;
  snippet: string;
  query: string;
}

async function searchBrave(
  query: string,
  apiKey: string
): Promise<BraveResult[]> {
  await rateLimit();

  log.info("Brave search", { query });

  const params = new URLSearchParams({
    q: query,
    count: String(V2_CONFIG.discovery.maxResultsPerQuery),
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
          signal: AbortSignal.timeout(V2_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `brave:${query}` }
    );

    if (!res.ok) {
      log.warn(`Brave search error: ${res.status}`, { query });
      return [];
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

    if (!data.web?.results?.length) return [];

    return data.web.results.map((r) => ({
      url: r.url,
      title: r.title,
      snippet: r.description ?? "",
      query,
    }));
  } catch (err) {
    log.error("Brave search failed", { query, error: String(err) });
    return [];
  }
}

// ─── Scoring ───────────────────────────────────────────────────────────────

function scoreYouTubeDiscovery(source: BraveResult): number {
  let score = 50; // base score
  const titleLower = source.title.toLowerCase();

  // Title signals
  if (titleLower.includes("how to tie")) score += 20;
  if (titleLower.includes("fly tying")) score += 15;
  if (titleLower.includes("tutorial")) score += 10;
  if (titleLower.includes("recipe")) score += 10;
  if (titleLower.includes("step by step")) score += 10;
  if (titleLower.includes("materials")) score += 5;

  // Known quality creators
  const knownCreators = [
    "tim flagler", "tightline", "davie mcphail", "intherifle",
    "fly fish food", "lance egan", "mcfly angler", "hans weilenmann",
    "barry ord clarke", "cheech", "curtis fry", "charlie craven",
    "troutbitten", "orvis", "gunnar brammer", "andrew grillos",
    "the new fly fisher", "fly tying 123",
  ];

  if (knownCreators.some((c) => titleLower.includes(c))) score += 25;

  // Description has material keywords
  const descLower = source.snippet.toLowerCase();
  const matKeywords = ["hook", "thread", "tail", "body", "hackle", "wing", "dubbing", "bead"];
  const matches = matKeywords.filter((kw) => descLower.includes(kw)).length;
  score += matches * 3;

  return score;
}

function scoreWebDiscovery(source: BraveResult, patternName: string): number {
  let score = 50;
  const titleLower = source.title.toLowerCase();
  const snippetLower = source.snippet.toLowerCase();
  const patternLower = patternName.toLowerCase();

  // Title contains pattern name
  if (titleLower.includes(patternLower)) score += 15;

  // Title signals
  if (titleLower.includes("recipe")) score += 15;
  if (titleLower.includes("how to tie")) score += 15;
  if (titleLower.includes("materials")) score += 10;
  if (titleLower.includes("fly pattern")) score += 10;
  if (titleLower.includes("tutorial")) score += 10;
  if (titleLower.includes("step by step")) score += 10;

  // Snippet has structured content signals
  if (snippetLower.includes("hook:") || snippetLower.includes("thread:")) score += 20;
  if (snippetLower.includes("materials")) score += 10;

  // Material keywords in snippet
  const matKeywords = ["hook", "thread", "tail", "body", "hackle", "wing", "dubbing"];
  const matches = matKeywords.filter((kw) => snippetLower.includes(kw)).length;
  score += matches * 3;

  // Known quality domains
  const knownDomains = [
    "charliesflybox.com", "flyfisherman.com", "globalflyfisher.com",
    "flytyer.com", "hatchmag.com", "news.orvis.com",
    "flyfishfood.com", "troutbitten.com", "theflycrate.com",
  ];
  if (knownDomains.some((d) => source.url.includes(d))) score += 15;

  return score;
}

function isJunkUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const junkPatterns = [
    "/tag/", "/category/", "/page/", "/author/",
    "pinterest.com", "amazon.com", "ebay.com",
    "facebook.com", "twitter.com", "instagram.com",
    "reddit.com/r/", "tiktok.com",
    ".pdf", "/shop/", "/cart/", "/checkout/",
  ];
  return junkPatterns.some((p) => lower.includes(p));
}
