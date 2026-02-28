import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "../utils/logger";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { PIPELINE_CONFIG } from "../config";

const log = createLogger("hatch-charts");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapedHatchPage {
  url: string;
  title: string;
  content: string;
  siteName: string;
}

export interface ExtractedHatchEntry {
  waterBody: string;
  region: string;
  state: string | null;
  month: number;
  species: string;
  insectName: string;
  insectType: string;
  patternName: string;
  timeOfDay: string | null;
  targetFish: string | null;
  notes: string | null;
}

// ─── Hatch chart site configs ────────────────────────────────────────────────
//
// Fly shops, guide services, and fishing magazines that publish hatch charts.
// These are the gold standard — curated by locals who fish the water daily.

interface HatchChartSite {
  name: string;
  searchUrl: (query: string) => string;
  contentSelector: string;
}

const HATCH_CHART_SITES: HatchChartSite[] = [
  // ─── Major fly fishing media ─────────────────────────────────────────
  {
    name: "Orvis Hatch Charts",
    searchUrl: (q) =>
      `https://news.orvis.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Fly Fisherman Magazine",
    searchUrl: (q) =>
      `https://www.flyfisherman.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Hatch Magazine",
    searchUrl: (q) =>
      `https://www.hatchmag.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "MidCurrent",
    searchUrl: (q) =>
      `https://midcurrent.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content, .single-content",
  },
  {
    name: "Fly Lords",
    searchUrl: (q) =>
      `https://flylords.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  // ─── Fly shops (great local hatch data) ────────────────────────────
  {
    name: "Trout's Fly Fishing (CO)",
    searchUrl: (q) =>
      `https://www.troutsflyfishing.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content, .blog-content",
  },
  {
    name: "Blue Quill Angler (CO)",
    searchUrl: (q) =>
      `https://bluequillangler.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Vail Valley Anglers (CO)",
    searchUrl: (q) =>
      `https://www.vailvalleyanglers.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Angler's Covey (CO)",
    searchUrl: (q) =>
      `https://anglerscovey.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Headhunters Fly Shop (MT)",
    searchUrl: (q) =>
      `https://headhuntersflyfishingco.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Madison River Fishing Co (MT)",
    searchUrl: (q) =>
      `https://www.mrfc.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "The Missoulian Angler (MT)",
    searchUrl: (q) =>
      `https://www.missoulianangler.com/?s=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "World Cast Anglers (ID/WY)",
    searchUrl: (q) =>
      `https://worldcastanglers.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Red's Fly Shop (WA)",
    searchUrl: (q) =>
      `https://redsflyfishing.com/search?q=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
  },
  {
    name: "Deschutes Angler (OR)",
    searchUrl: (q) =>
      `https://www.deschutesangler.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "TCO Fly Shop (PA)",
    searchUrl: (q) =>
      `https://tcoflyfishing.com/search?q=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
  },
  {
    name: "South Holston River Fly Shop (TN)",
    searchUrl: (q) =>
      `https://www.sohoflyshop.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Davidson River Outfitters (NC)",
    searchUrl: (q) =>
      `https://www.davidsonflyfishing.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Pat Dorsey Fly Fishing (CO)",
    searchUrl: (q) =>
      `https://www.patdorseyflyfishing.com/?s=${encodeURIComponent(q + " hatch")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "The Fly Shop (CA)",
    searchUrl: (q) =>
      `https://www.theflyshop.com/search?q=${encodeURIComponent(q + " hatch chart")}`,
    contentSelector: "article, .entry-content, .post-content, .page-content",
  },
];

/**
 * Known hatch chart pages — direct URLs that contain hatch data.
 * These are the most reliable source: dedicated hatch chart pages maintained
 * by fly shops and guide services for their local waters.
 */
interface DirectHatchPage {
  name: string;
  url: string;
  contentSelector: string;
}

const DIRECT_HATCH_PAGES: DirectHatchPage[] = [
  // ─── Colorado ─────────────────────────────────────────────────────
  {
    name: "Trout's — South Platte Hatch Chart",
    url: "https://www.troutsflyfishing.com/south-platte-hatch-chart",
    contentSelector: "article, .entry-content, .post-content, .blog-content, main",
  },
  {
    name: "Trout's — Colorado River Hatch Chart",
    url: "https://www.troutsflyfishing.com/colorado-river-hatch-chart",
    contentSelector: "article, .entry-content, .post-content, .blog-content, main",
  },
  {
    name: "Blue Quill — Arkansas River Hatch Chart",
    url: "https://bluequillangler.com/arkansas-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Angler's Covey — South Platte Hatch Chart",
    url: "https://anglerscovey.com/south-platte-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Vail Valley — Eagle River Hatch Chart",
    url: "https://www.vailvalleyanglers.com/eagle-river-hatch-chart",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Pat Dorsey — South Platte Hatches",
    url: "https://www.patdorseyflyfishing.com/south-platte-hatches/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  // ─── Montana ──────────────────────────────────────────────────────
  {
    name: "Headhunters — Missouri River Hatch Chart",
    url: "https://headhuntersflyfishingco.com/missouri-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "MRFC — Madison River Hatch Chart",
    url: "https://www.mrfc.com/madison-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Montana Troutfitters — Gallatin Hatch Chart",
    url: "https://troutfitters.com/gallatin-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Missoulian Angler — Clark Fork Hatch Chart",
    url: "https://www.missoulianangler.com/clark-fork-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  // ─── Idaho / Wyoming ──────────────────────────────────────────────
  {
    name: "World Cast — South Fork Snake Hatch Chart",
    url: "https://worldcastanglers.com/south-fork-snake-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "World Cast — Henry's Fork Hatch Chart",
    url: "https://worldcastanglers.com/henrys-fork-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  // ─── Pacific Northwest ────────────────────────────────────────────
  {
    name: "Red's — Yakima River Hatch Chart",
    url: "https://redsflyfishing.com/pages/yakima-river-hatch-chart",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
  },
  {
    name: "Deschutes Angler — Deschutes Hatch Chart",
    url: "https://www.deschutesangler.com/deschutes-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  // ─── Northeast ────────────────────────────────────────────────────
  {
    name: "TCO — Pennsylvania Hatch Chart",
    url: "https://tcoflyfishing.com/pages/pennsylvania-hatch-chart",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
  },
  // ─── Southeast ────────────────────────────────────────────────────
  {
    name: "South Holston Fly Shop — Hatch Chart",
    url: "https://www.sohoflyshop.com/south-holston-river-hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
  {
    name: "Davidson River — Hatch Chart",
    url: "https://www.davidsonflyfishing.com/hatch-chart/",
    contentSelector: "article, .entry-content, .post-content, main",
  },
];

// ─── Search queries for broad hatch chart discovery ──────────────────────────

export const HATCH_CHART_QUERIES = [
  // Generic hatch chart queries
  "fly fishing hatch chart",
  "mayfly hatch chart trout",
  "caddis stonefly hatch calendar",
  // Regional
  "Rocky Mountain hatch chart fly fishing",
  "Northeast hatch chart trout",
  "Pacific Northwest hatch chart",
  "Southeast tailwater hatch chart",
  "Midwest trout stream hatch chart",
  "Great Lakes hatch chart steelhead",
  // State-specific (major fly fishing states)
  "Colorado hatch chart fly fishing",
  "Montana hatch chart fly fishing",
  "Idaho hatch chart fly fishing",
  "Wyoming hatch chart fly fishing",
  "Oregon hatch chart fly fishing",
  "Washington hatch chart fly fishing",
  "Pennsylvania hatch chart fly fishing",
  "New York hatch chart trout",
  "North Carolina hatch chart trout",
  "Virginia hatch chart fly fishing",
  "Michigan hatch chart fly fishing",
  "Wisconsin hatch chart trout",
  "Arkansas hatch chart tailwater",
  "Tennessee hatch chart tailwater",
  "New Mexico hatch chart trout",
  "Utah hatch chart fly fishing",
  "California hatch chart trout",
  "Vermont hatch chart trout",
  // Famous rivers
  "South Platte River hatch chart",
  "Arkansas River Colorado hatch chart",
  "Missouri River Montana hatch chart",
  "Madison River hatch chart",
  "Yellowstone River hatch chart",
  "Henry's Fork hatch chart",
  "Bighorn River hatch chart",
  "Green River Utah hatch chart",
  "Deschutes River hatch chart",
  "Delaware River hatch chart",
  "Au Sable River Michigan hatch chart",
  "White River Arkansas hatch chart",
  "San Juan River hatch chart",
  "Gunnison River hatch chart",
  // Saltwater
  "saltwater fly fishing hatch chart bonefish tarpon",
  "Florida Keys flats fishing calendar",
];

// ─── Scraping ────────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  await rateLimit();

  try {
    const res = await retry(
      () =>
        fetch(url, {
          headers: {
            "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, label: `fetch:${url}` }
    );

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function scrapePageContent(
  html: string,
  url: string,
  siteName: string,
  contentSelector = "article, .entry-content, .post-content, .page-content, main, .content, #content"
): ScrapedHatchPage | null {
  const $ = cheerio.load(html);
  $(
    "script, style, nav, footer, header, .sidebar, .widget, .ad, .ads, .advertisement, .comments, .related-posts, .social-share, .cookie-notice, .popup, .modal"
  ).remove();

  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  // Extract both text content AND any table HTML (hatch charts are often in tables)
  let content = "";
  for (const sel of contentSelector.split(",").map((s) => s.trim())) {
    const el = $(sel).first();
    // Get inner HTML for tables (preserves structure for Claude)
    const tables = el.find("table").toArray().map((t) => $(t).html() || "");
    const text = el.text().replace(/\s+/g, " ").trim();
    const combined = tables.length > 0
      ? `${text}\n\n--- TABLE DATA ---\n${tables.join("\n\n")}`
      : text;
    if (combined.length > content.length) {
      content = combined;
    }
  }

  if (!title || content.length < 100) return null;

  return {
    url,
    title,
    content: content.slice(0, 15000),
    siteName,
  };
}

// ─── Site search scraping ────────────────────────────────────────────────────

async function searchHatchSite(
  site: HatchChartSite,
  query: string
): Promise<ScrapedHatchPage[]> {
  const html = await fetchPage(site.searchUrl(query));
  if (!html) return [];

  const $ = cheerio.load(html);
  const articleLinks: string[] = [];

  $("article a[href], .post a[href], .entry-title a[href], h2 a[href]").each(
    (_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http") && !articleLinks.includes(href)) {
        articleLinks.push(href);
      }
    }
  );

  const pages: ScrapedHatchPage[] = [];

  for (const articleUrl of articleLinks.slice(0, 3)) {
    try {
      const articleHtml = await fetchPage(articleUrl);
      if (!articleHtml) continue;

      const page = scrapePageContent(
        articleHtml,
        articleUrl,
        site.name,
        site.contentSelector
      );
      if (page) pages.push(page);
    } catch {
      // skip
    }
  }

  return pages;
}

// ─── Direct page scraping ────────────────────────────────────────────────────

async function scrapeDirectHatchPages(): Promise<ScrapedHatchPage[]> {
  const pages: ScrapedHatchPage[] = [];

  for (const page of DIRECT_HATCH_PAGES) {
    try {
      const html = await fetchPage(page.url);
      if (!html) {
        log.debug(`Could not fetch: ${page.name}`);
        continue;
      }

      const scraped = scrapePageContent(
        html,
        page.url,
        page.name,
        page.contentSelector
      );
      if (scraped) {
        pages.push(scraped);
        log.debug(`Scraped: ${page.name} (${scraped.content.length} chars)`);
      }
    } catch (err) {
      log.debug(`Failed to scrape ${page.name}: ${String(err)}`);
    }
  }

  return pages;
}

// ─── Brave / Serper web search ───────────────────────────────────────────────

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";
const SERPER_WEB_API = "https://google.serper.dev/search";

const SKIP_DOMAINS = [
  "youtube.com", "facebook.com", "instagram.com", "twitter.com", "x.com",
  "reddit.com", "pinterest.com", "tiktok.com", "amazon.com", "ebay.com",
  "wikipedia.org",
];

function shouldSkipUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return SKIP_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return true;
  }
}

async function searchBraveWeb(query: string): Promise<ScrapedHatchPage[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  await rateLimit();

  const params = new URLSearchParams({
    q: query,
    count: "10",
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
      { maxRetries: 2, backoffMs: 2000, label: `brave-hatch:${query}` }
    );

    if (!res.ok) {
      log.warn(`Brave Search error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      web?: { results?: { url: string; title: string }[] };
    };

    if (!data.web?.results?.length) return [];

    const pages: ScrapedHatchPage[] = [];

    for (const item of data.web.results.slice(0, 5)) {
      if (shouldSkipUrl(item.url)) continue;

      try {
        const html = await fetchPage(item.url);
        if (!html) continue;

        const page = scrapePageContent(html, item.url, "Brave Search");
        if (page) pages.push(page);
      } catch {
        // skip
      }
    }

    return pages;
  } catch (err) {
    log.warn("Brave web search failed", { error: String(err) });
    return [];
  }
}

async function searchSerperWeb(query: string): Promise<ScrapedHatchPage[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  await rateLimit();

  try {
    const res = await retry(
      () =>
        fetch(SERPER_WEB_API, {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            num: 10,
            gl: "us",
          }),
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `serper-hatch:${query}` }
    );

    if (!res.ok) {
      log.warn(`Serper API error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      organic?: { link: string; title: string }[];
    };

    if (!data.organic?.length) return [];

    const pages: ScrapedHatchPage[] = [];

    for (const item of data.organic.slice(0, 5)) {
      if (shouldSkipUrl(item.link)) continue;

      try {
        const html = await fetchPage(item.link);
        if (!html) continue;

        const page = scrapePageContent(html, item.link, "Serper Search");
        if (page) pages.push(page);
      } catch {
        // skip
      }
    }

    return pages;
  } catch (err) {
    log.warn("Serper web search failed", { error: String(err) });
    return [];
  }
}

// ─── Combined discovery ──────────────────────────────────────────────────────

/**
 * Discover hatch chart pages for a given query using all sources:
 * 1. Preconfigured hatch chart sites (search-based)
 * 2. Brave web search
 * 3. Serper web search (Google)
 */
export async function discoverHatchCharts(
  query: string
): Promise<ScrapedHatchPage[]> {
  const allPages: ScrapedHatchPage[] = [];
  const seenUrls = new Set<string>();

  const addPages = (pages: ScrapedHatchPage[]) => {
    for (const p of pages) {
      if (!seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        allPages.push(p);
      }
    }
  };

  // 1. Search 5 random preconfigured sites (avoid hammering all 20)
  const shuffledSites = [...HATCH_CHART_SITES].sort(() => Math.random() - 0.5);
  for (const site of shuffledSites.slice(0, 5)) {
    try {
      const pages = await searchHatchSite(site, query);
      addPages(pages);
      if (pages.length > 0) {
        log.info(`Found ${pages.length} hatch pages from ${site.name}`, { query });
      }
    } catch (err) {
      log.warn(`Failed to search ${site.name}`, { error: String(err) });
    }
  }

  // 2. Brave web search
  try {
    const bravePages = await searchBraveWeb(query);
    addPages(bravePages);
    if (bravePages.length > 0) {
      log.info(`Found ${bravePages.length} hatch pages from Brave`, { query });
    }
  } catch (err) {
    log.warn("Brave search failed", { error: String(err) });
  }

  // 3. Serper web search
  try {
    const serperPages = await searchSerperWeb(query);
    addPages(serperPages);
    if (serperPages.length > 0) {
      log.info(`Found ${serperPages.length} hatch pages from Serper`, { query });
    }
  } catch (err) {
    log.warn("Serper search failed", { error: String(err) });
  }

  return allPages;
}

/**
 * Scrape all direct hatch chart pages. Called once per pipeline run.
 */
export { scrapeDirectHatchPages };

// ─── Claude extraction ───────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: PIPELINE_CONFIG.anthropic.apiKey,
    });
  }
  return anthropicClient;
}

const VALID_INSECT_TYPES = ["mayfly", "caddis", "stonefly", "midge", "terrestrial", "other"];

const EXTRACT_HATCH_TOOL = {
  name: "save_hatch_entries" as const,
  description:
    "Save extracted hatch chart entries for a body of water. Each entry represents one insect/month combination with the recommended fly pattern.",
  input_schema: {
    type: "object" as const,
    required: ["isHatchChart", "entries"],
    properties: {
      isHatchChart: {
        type: "boolean" as const,
        description:
          "Set to true ONLY if the content is an actual hatch chart or hatch calendar — listing which insects hatch on which months/seasons for a specific body of water, with recommended fly patterns. Set to false for: gear reviews, fishing reports (current conditions only), technique articles, general articles that mention hatches casually, trip reports, news articles.",
      },
      entries: {
        type: "array" as const,
        description: "Array of hatch entries. One per insect per month. If a chart shows an insect hatching across multiple months, create a separate entry for EACH month.",
        items: {
          type: "object" as const,
          required: [
            "waterBody",
            "region",
            "month",
            "species",
            "insectName",
            "insectType",
            "patternName",
          ],
          properties: {
            waterBody: {
              type: "string" as const,
              description:
                "Official name of the body of water (e.g., 'South Platte River', 'Henry\\'s Fork', 'Missouri River'). Use the most widely recognized name.",
            },
            region: {
              type: "string" as const,
              description:
                "Geographic region. Must be one of: 'Rocky Mountains', 'Northeast', 'Southeast', 'Midwest', 'Pacific Northwest', 'Southwest', 'Mid-Atlantic', 'Great Lakes', 'Alaska', 'Saltwater'",
            },
            state: {
              type: "string" as const,
              description: "Two-letter US state abbreviation (e.g., 'CO', 'MT'). Required if you can determine it.",
            },
            month: {
              type: "number" as const,
              description: "Month number 1-12 when this insect hatches.",
            },
            species: {
              type: "string" as const,
              description:
                "Scientific or taxonomic name of the insect (e.g., 'Baetis', 'Ephemerella', 'Chironomidae', 'Pteronarcys californica'). Use the most specific name available.",
            },
            insectName: {
              type: "string" as const,
              description:
                "Common name of the insect (e.g., 'Blue-Winged Olive', 'Pale Morning Dun', 'Salmonfly', 'Midge')",
            },
            insectType: {
              type: "string" as const,
              description:
                "Category of insect. Must be one of: 'mayfly', 'caddis', 'stonefly', 'midge', 'terrestrial', 'other'",
            },
            patternName: {
              type: "string" as const,
              description:
                "Recommended fly pattern (e.g., 'Pheasant Tail Nymph', 'Elk Hair Caddis', 'Stimulator', 'Zebra Midge'). Use the most commonly recommended pattern for this hatch.",
            },
            timeOfDay: {
              type: "string" as const,
              description:
                "Best time to fish. One of: 'morning', 'midday', 'afternoon', 'evening', 'all day'. Null if not specified.",
            },
            targetFish: {
              type: "string" as const,
              description:
                "Primary target species (e.g., 'Rainbow Trout', 'Brown Trout', 'Cutthroat Trout', 'Brook Trout', 'Steelhead', 'Bonefish', 'Tarpon'). Null if not specified.",
            },
            notes: {
              type: "string" as const,
              description:
                "1-2 sentence practical fishing note about this specific hatch on this specific water. Include hook sizes, techniques, or water-specific tips if mentioned in the source. Null if no useful detail available.",
            },
          },
        },
      },
    },
  },
};

/**
 * Use Claude to extract structured hatch data from a scraped page.
 * Returns an array of hatch entries (one per insect per month).
 */
export async function extractHatchEntries(
  pages: ScrapedHatchPage[]
): Promise<ExtractedHatchEntry[]> {
  if (pages.length === 0) return [];

  const client = getClient();

  const pagesText = pages
    .map(
      (p, i) =>
        `--- Source ${i + 1}: ${p.title} (${p.siteName}, ${p.url}) ---\n${p.content.slice(0, 5000)}`
    )
    .join("\n\n");

  try {
    const response = await client.messages.create({
      model: PIPELINE_CONFIG.anthropic.model,
      max_tokens: 4096,
      system: `You are a fly fishing entomology expert that extracts structured hatch chart data from web pages.

Your job is to extract EVERY month/insect/pattern combination from the hatch chart content.

ACCEPT ONLY content that is a hatch chart, hatch calendar, or hatch guide — a structured listing of which insects hatch in which months on a specific body of water, with recommended fly patterns.

REJECT (set isHatchChart=false):
- Fishing reports describing current conditions only (not a chart/calendar)
- General articles that mention a few hatches casually
- Gear reviews, technique tutorials
- Trip reports or fishing stories
- Shop promotions

When extracting:
1. Create one entry PER INSECT PER MONTH. If "Blue-Winged Olive" hatches March through May, create 3 entries (month 3, 4, 5).
2. Use the most specific scientific name available for species.
3. Use standardized common names for insectName.
4. Match insectType to one of: mayfly, caddis, stonefly, midge, terrestrial, other.
5. Recommend the most commonly used fly pattern for that hatch.
6. Include hook sizes and specific tips in notes when the source mentions them.
7. Determine the region and state from context — use your knowledge of US geography.
8. If the page covers MULTIPLE water bodies, include entries for ALL of them.`,
      tools: [EXTRACT_HATCH_TOOL],
      tool_choice: { type: "tool" as const, name: "save_hatch_entries" },
      messages: [
        {
          role: "user",
          content: `Extract all hatch chart data from these pages:\n\n${pagesText}`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return [];

    const data = toolUse.input as {
      isHatchChart: boolean;
      entries: Array<{
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
    };

    if (!data.isHatchChart) {
      log.debug(`Rejected (not a hatch chart): ${pages[0]?.title ?? "unknown"}`);
      return [];
    }

    // Validate and normalize entries
    return data.entries
      .filter((e) => {
        if (!e.waterBody || !e.species || !e.insectName || !e.patternName) return false;
        if (e.month < 1 || e.month > 12) return false;
        if (!VALID_INSECT_TYPES.includes(e.insectType)) {
          e.insectType = "other";
        }
        return true;
      })
      .map((e) => ({
        waterBody: e.waterBody.trim(),
        region: e.region?.trim() || "Unknown",
        state: e.state?.trim() || null,
        month: e.month,
        species: e.species.trim(),
        insectName: e.insectName.trim(),
        insectType: e.insectType,
        patternName: e.patternName.trim(),
        timeOfDay: e.timeOfDay?.trim() || null,
        targetFish: e.targetFish?.trim() || null,
        notes: e.notes?.trim() || null,
      }));
  } catch (err) {
    log.error("Claude hatch extraction failed", { error: String(err) });
    return [];
  }
}
