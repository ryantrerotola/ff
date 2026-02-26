import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "../utils/logger";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { PIPELINE_CONFIG } from "../config";

const log = createLogger("fishing-reports");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapedReport {
  url: string;
  title: string;
  content: string;
  siteName: string;
  publishDate: string | null;
}

export interface SummarizedReport {
  waterBody: string;
  region: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  waterType: string;
  summary: string;
  conditions: string | null;
  reportDate: string;
  sourceUrls: string[];
  sourceTitles: string[];
}

// ─── Fishing report sources ──────────────────────────────────────────────────
//
// Two types of sources:
// 1. "search" sites — have a search URL we can query with keywords
// 2. "direct" pages — known URLs that always contain fishing reports
//
// The pipeline also uses Google/Bing web search to find reports from
// ANY site on the internet, not just these preconfigured ones.

interface ReportSite {
  name: string;
  searchUrl: (query: string) => string;
  contentSelector: string;
  dateSelector: string;
}

/** Sites with WordPress-style search we can query with keywords. */
const REPORT_SITES: ReportSite[] = [
  // ─── Major fly fishing media ─────────────────────────────────────────
  {
    name: "Orvis Fishing Reports",
    searchUrl: (q) =>
      `https://news.orvis.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Hatch Magazine",
    searchUrl: (q) =>
      `https://www.hatchmag.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Fly Fisherman",
    searchUrl: (q) =>
      `https://www.flyfisherman.com/?s=${encodeURIComponent(q + " report conditions")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "MidCurrent",
    searchUrl: (q) =>
      `https://midcurrent.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content, .single-content",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Fly Lords",
    searchUrl: (q) =>
      `https://flylords.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Gink & Gasoline",
    searchUrl: (q) =>
      `https://www.ginkandgasoline.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Drake Magazine",
    searchUrl: (q) =>
      `https://www.drakemag.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Trout Unlimited",
    searchUrl: (q) =>
      `https://www.tu.org/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content, .page-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  // ─── Fly shops ───────────────────────────────────────────────────────
  {
    name: "Trout's Fly Fishing (CO)",
    searchUrl: (q) =>
      `https://www.troutsflyfishing.com/?s=${encodeURIComponent(q)}`,
    contentSelector: "article, .entry-content, .post-content, .blog-content",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Blue Quill Angler (CO)",
    searchUrl: (q) =>
      `https://bluequillangler.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Vail Valley Anglers (CO)",
    searchUrl: (q) =>
      `https://www.vailvalleyanglers.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "The Fly Shop (CA)",
    searchUrl: (q) =>
      `https://www.theflyshop.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content, .page-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Sweetwater Fly Shop (MT)",
    searchUrl: (q) =>
      `https://sweetwaterflyfishing.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Headhunters Fly Shop (MT)",
    searchUrl: (q) =>
      `https://headhuntersflyfishingco.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Montana Trout Outfitters",
    searchUrl: (q) =>
      `https://montanatroutoutfitters.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Madison River Fishing Company (MT)",
    searchUrl: (q) =>
      `https://www.mrfc.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "World Cast Anglers (ID/WY)",
    searchUrl: (q) =>
      `https://worldcastanglers.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "North Fork Ranch Guide Service (CO)",
    searchUrl: (q) =>
      `https://www.northforkranch.com/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  // ─── Regional / guide service blogs ──────────────────────────────────
  {
    name: "Moldy Chum",
    searchUrl: (q) =>
      `https://www.moldychum.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Fly Crate",
    searchUrl: (q) =>
      `https://theflycrate.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Fishwest",
    searchUrl: (q) =>
      `https://fishwest.com/blog/?s=${encodeURIComponent(q + " report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
];

/**
 * Known pages that always contain fishing reports — scraped directly
 * without a search step. These are fly shops, guides, and agencies
 * that maintain a dedicated report page.
 */
interface DirectReportPage {
  name: string;
  url: string;
  contentSelector: string;
  dateSelector: string;
}

const DIRECT_REPORT_PAGES: DirectReportPage[] = [
  // ─── Fly shops with dedicated report pages ───────────────────────────
  {
    name: "Trout's Fly Fishing",
    url: "https://www.troutsflyfishing.com/fishing-reports",
    contentSelector: "article, .entry-content, .post-content, .blog-list, main",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Blue Quill Angler",
    url: "https://bluequillangler.com/fishing-reports/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Vail Valley Anglers",
    url: "https://www.vailvalleyanglers.com/fishing-reports",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Arkansas River Fly Shop (CO)",
    url: "https://www.arkansasriverflyfishing.com/fishing-report",
    contentSelector: "article, .entry-content, .post-content, .page-content, main",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Headhunters Fly Shop (MT)",
    url: "https://headhuntersflyfishingco.com/missouri-river-fishing-report/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Missoulian Angler (MT)",
    url: "https://www.missoulianangler.com/fishing-reports/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Madison River Fishing Company (MT)",
    url: "https://www.mrfc.com/madison-river-fishing-report/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Fly Shop (CA)",
    url: "https://www.theflyshop.com/pages/northern-california-fishing-reports",
    contentSelector: "article, .entry-content, .post-content, .page-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "South Holston River Fly Shop (TN)",
    url: "https://www.sohoflyshop.com/fishing-reports/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Davidson River Outfitters (NC)",
    url: "https://www.davidsonflyfishing.com/fishing-report/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "TCO Fly Shop (PA)",
    url: "https://tcoflyfishing.com/blogs/fishing-reports",
    contentSelector: "article, .entry-content, .post-content, .blog-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Deschutes Angler (OR)",
    url: "https://www.deschutesangler.com/fishing-report",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  // ─── State fish & wildlife agencies ──────────────────────────────────
  {
    name: "Colorado Parks & Wildlife",
    url: "https://cpw.state.co.us/thingstodo/Pages/FishingConditions.aspx",
    contentSelector: ".page-content, .main-content, article, main, #content",
    dateSelector: "time, .date, .updated, .last-modified",
  },
  {
    name: "Montana FWP Fishing Reports",
    url: "https://fwp.mt.gov/fish/reports",
    contentSelector: ".page-content, .main-content, article, main, #content",
    dateSelector: "time, .date, .updated",
  },
  {
    name: "Idaho Fish & Game",
    url: "https://idfg.idaho.gov/fish/reports",
    contentSelector: ".page-content, .main-content, article, main, #content",
    dateSelector: "time, .date, .updated",
  },
];

// ─── General search queries for broad fishing report discovery ──────────────
// These queries are the PRIMARY mechanism for discovering reports.
// The pipeline searches broadly and lets Claude identify the water bodies.

export const GENERAL_REPORT_QUERIES = [
  // Regional
  "western fly fishing report this week",
  "northeast fly fishing report this week",
  "southeast fly fishing report this week",
  "midwest fly fishing report this week",
  "pacific northwest fly fishing report",
  "rocky mountain fishing conditions",
  // State-specific (major fly fishing states)
  "Colorado fly fishing report",
  "Montana fly fishing report",
  "Idaho fly fishing report",
  "Wyoming fly fishing report",
  "Oregon fly fishing report",
  "Washington fly fishing report",
  "Pennsylvania fly fishing report",
  "New York fly fishing report",
  "North Carolina fly fishing report",
  "Virginia fly fishing report",
  "Michigan fly fishing report",
  "Wisconsin fly fishing report",
  "Arkansas fly fishing report",
  "New Mexico fly fishing report",
  "Utah fly fishing report",
  "California fly fishing report",
  "Vermont fly fishing report",
  "Alaska fly fishing report",
  // Water type
  "tailwater fishing conditions report",
  "spring creek fly fishing report",
  "freestone river fishing report",
  "trout stream conditions update",
  // Species
  "trout fishing conditions this week",
  "steelhead fishing report",
  "salmon fly fishing report",
  "smallmouth bass fly fishing report",
];

// ─── Scraping ───────────────────────────────────────────────────────────────

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

/**
 * Generic article scraper — extracts content from any web page.
 * Used for Google/Bing search results and direct report pages.
 */
function scrapeArticleContent(
  html: string,
  url: string,
  siteName: string,
  contentSelector = "article, .entry-content, .post-content, .page-content, main, .content, #content",
  dateSelector = "time, .entry-date, .post-date, .date, .updated, .published"
): ScrapedReport | null {
  const $ = cheerio.load(html);
  $(
    "script, style, nav, footer, header, .sidebar, .widget, .ad, .ads, .advertisement, .comments, .related-posts, .social-share, .cookie-notice, .popup, .modal"
  ).remove();

  const title = $("h1").first().text().trim() ||
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  // Try multiple content selectors in priority order
  let content = "";
  for (const sel of contentSelector.split(",").map((s) => s.trim())) {
    const text = $(sel).first().text().replace(/\s+/g, " ").trim();
    if (text.length > content.length) {
      content = text;
    }
  }

  if (!title || content.length < 100) return null;

  // Try to find a date
  let publishDate: string | null = null;
  for (const sel of dateSelector.split(",").map((s) => s.trim())) {
    const dateEl = $(sel).first();
    const datetime = dateEl.attr("datetime") || dateEl.text().trim();
    if (datetime) {
      const parsed = new Date(datetime);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > 0) {
        publishDate = parsed.toISOString();
        break;
      }
    }
  }

  return {
    url,
    title,
    content: content.slice(0, 10000),
    siteName,
    publishDate,
  };
}

/**
 * Search a report site and scrape the top results.
 */
export async function searchReportSite(
  site: ReportSite,
  query: string
): Promise<ScrapedReport[]> {
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

  const reports: ScrapedReport[] = [];

  for (const articleUrl of articleLinks.slice(0, 3)) {
    try {
      const articleHtml = await fetchPage(articleUrl);
      if (!articleHtml) continue;

      const report = scrapeArticleContent(
        articleHtml,
        articleUrl,
        site.name,
        site.contentSelector,
        site.dateSelector
      );
      if (report) reports.push(report);
    } catch {
      // Skip failed articles
    }
  }

  return reports;
}

// ─── Google / Bing web search for broad discovery ───────────────────────────
// These find fishing reports from ANY site on the web, not just preconfigured ones.

const GOOGLE_CSE_API = "https://www.googleapis.com/customsearch/v1";
const BING_WEB_API = "https://api.bing.microsoft.com/v7.0/search";

/** URLs to skip — these are not fishing reports. */
const SKIP_DOMAINS = [
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "pinterest.com",
  "tiktok.com",
  "amazon.com",
  "ebay.com",
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

/**
 * Search Google Custom Search for fishing report articles (web results, not images).
 * Requires GOOGLE_CSE_API_KEY and GOOGLE_CSE_ENGINE_ID env vars.
 */
async function searchGoogleWeb(query: string): Promise<ScrapedReport[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const engineId = process.env.GOOGLE_CSE_ENGINE_ID;

  if (!apiKey || !engineId) {
    log.info("Google CSE not configured — skipping Google web search");
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    num: "10",
    dateRestrict: "m3", // Last 3 months only — we want recent reports
  });

  try {
    const res = await retry(
      () =>
        fetch(`${GOOGLE_CSE_API}?${params}`, {
          headers: { "User-Agent": PIPELINE_CONFIG.scraping.userAgent },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `google-web:${query}` }
    );

    if (!res.ok) {
      log.warn(`Google CSE error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      items?: { link: string; title: string }[];
    };

    if (!data.items?.length) return [];

    const reports: ScrapedReport[] = [];

    // Scrape top results
    for (const item of data.items.slice(0, 5)) {
      if (shouldSkipUrl(item.link)) continue;

      try {
        const html = await fetchPage(item.link);
        if (!html) continue;

        const report = scrapeArticleContent(html, item.link, "Google Search");
        if (report) reports.push(report);
      } catch {
        // Skip failed pages
      }
    }

    return reports;
  } catch (err) {
    log.warn("Google web search failed", { error: String(err) });
    return [];
  }
}

/**
 * Search Bing Web Search for fishing report articles.
 * Requires BING_SEARCH_API_KEY env var.
 */
async function searchBingWeb(query: string): Promise<ScrapedReport[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    log.info("Bing API not configured — skipping Bing web search");
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    q: query,
    count: "10",
    freshness: "Month", // Last month only
    mkt: "en-US",
  });

  try {
    const res = await retry(
      () =>
        fetch(`${BING_WEB_API}?${params}`, {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
            "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `bing-web:${query}` }
    );

    if (!res.ok) {
      log.warn(`Bing API error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      webPages?: { value?: { url: string; name: string }[] };
    };

    if (!data.webPages?.value?.length) return [];

    const reports: ScrapedReport[] = [];

    for (const item of data.webPages.value.slice(0, 5)) {
      if (shouldSkipUrl(item.url)) continue;

      try {
        const html = await fetchPage(item.url);
        if (!html) continue;

        const report = scrapeArticleContent(html, item.url, "Bing Search");
        if (report) reports.push(report);
      } catch {
        // Skip failed pages
      }
    }

    return reports;
  } catch (err) {
    log.warn("Bing web search failed", { error: String(err) });
    return [];
  }
}

// ─── Direct report page scraping ────────────────────────────────────────────

/**
 * Scrape known direct report pages — these are fly shops, guides, and
 * agencies with a dedicated fishing report URL.
 */
async function scrapeDirectReportPages(): Promise<ScrapedReport[]> {
  const reports: ScrapedReport[] = [];

  for (const page of DIRECT_REPORT_PAGES) {
    try {
      const html = await fetchPage(page.url);
      if (!html) continue;

      const $ = cheerio.load(html);

      // Some direct pages are a list of links to individual reports
      const articleLinks: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().toLowerCase();
        if (
          href &&
          href.startsWith("http") &&
          (text.includes("report") || text.includes("conditions") || text.includes("update")) &&
          !articleLinks.includes(href)
        ) {
          articleLinks.push(href);
        }
      });

      // If there are sub-links that look like individual reports, scrape those
      if (articleLinks.length > 0) {
        for (const link of articleLinks.slice(0, 3)) {
          try {
            const articleHtml = await fetchPage(link);
            if (!articleHtml) continue;

            const report = scrapeArticleContent(
              articleHtml,
              link,
              page.name,
              page.contentSelector,
              page.dateSelector
            );
            if (report) reports.push(report);
          } catch {
            // skip
          }
        }
      } else {
        // The page itself IS the report — scrape it directly
        const report = scrapeArticleContent(
          html,
          page.url,
          page.name,
          page.contentSelector,
          page.dateSelector
        );
        if (report) reports.push(report);
      }
    } catch (err) {
      log.warn(`Failed to scrape ${page.name}`, { error: String(err) });
    }
  }

  return reports;
}

// ─── Combined discovery ─────────────────────────────────────────────────────

/**
 * Discover fishing reports using ALL available sources:
 * 1. Preconfigured report sites (search-based)
 * 2. Google web search (finds reports from any site)
 * 3. Bing web search (finds reports from any site)
 *
 * This is the primary entry point for the pipeline.
 */
export async function discoverFishingReports(
  query: string
): Promise<ScrapedReport[]> {
  const allReports: ScrapedReport[] = [];
  const seenUrls = new Set<string>();

  const addReports = (reports: ScrapedReport[]) => {
    for (const r of reports) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        allReports.push(r);
      }
    }
  };

  // 1. Search preconfigured sites (pick 5 random sites per query to avoid
  //    hammering all 20+ sites for every single query)
  const shuffledSites = [...REPORT_SITES].sort(() => Math.random() - 0.5);
  for (const site of shuffledSites.slice(0, 5)) {
    try {
      const reports = await searchReportSite(site, query);
      addReports(reports);
      if (reports.length > 0) {
        log.info(`Found ${reports.length} reports from ${site.name}`, { query });
      }
    } catch (err) {
      log.warn(`Failed to search ${site.name}`, { error: String(err) });
    }
  }

  // 2. Google web search — finds reports from ANY site
  try {
    const googleReports = await searchGoogleWeb(query);
    addReports(googleReports);
    if (googleReports.length > 0) {
      log.info(`Found ${googleReports.length} reports from Google`, { query });
    }
  } catch (err) {
    log.warn("Google search failed", { error: String(err) });
  }

  // 3. Bing web search — additional coverage
  try {
    const bingReports = await searchBingWeb(query);
    addReports(bingReports);
    if (bingReports.length > 0) {
      log.info(`Found ${bingReports.length} reports from Bing`, { query });
    }
  } catch (err) {
    log.warn("Bing search failed", { error: String(err) });
  }

  return allReports;
}

/**
 * Scrape all direct report pages. Called once per pipeline run
 * (not per query) since these are known URLs.
 */
export { scrapeDirectReportPages };

/**
 * Discover reports for a specific water body name.
 */
export async function discoverReportsForWater(
  waterName: string,
  state?: string | null
): Promise<ScrapedReport[]> {
  const query = state
    ? `${waterName} ${state} fishing report`
    : `${waterName} fishing report`;
  return discoverFishingReports(query);
}

// ─── Summarization with Claude ──────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: PIPELINE_CONFIG.anthropic.apiKey,
    });
  }
  return anthropicClient;
}

const SUMMARIZE_TOOL = {
  name: "save_fishing_report" as const,
  description:
    "Save a summarized fishing report for a specific body of water.",
  input_schema: {
    type: "object" as const,
    required: [
      "waterBody",
      "region",
      "state",
      "latitude",
      "longitude",
      "waterType",
      "summary",
      "reportDate",
    ],
    properties: {
      waterBody: {
        type: "string" as const,
        description:
          "Official or commonly-used name of the body of water (e.g., 'South Platte River', 'Henry's Fork', 'White River'). Use the most widely recognized name.",
      },
      region: {
        type: "string" as const,
        description:
          "Geographic region. Must be one of: 'Rocky Mountains', 'Northeast', 'Southeast', 'Midwest', 'Pacific Northwest', 'Southwest', 'Mid-Atlantic', 'Great Lakes', 'Alaska', 'Saltwater'",
      },
      state: {
        type: "string" as const,
        description:
          "Two-letter US state abbreviation (e.g., 'CO'). Required — determine from context.",
      },
      latitude: {
        type: "number" as const,
        description:
          "Approximate latitude of the water body. You must provide this — use your knowledge of US geography.",
      },
      longitude: {
        type: "number" as const,
        description:
          "Approximate longitude of the water body. You must provide this — use your knowledge of US geography.",
      },
      waterType: {
        type: "string" as const,
        description:
          "Type of water body. One of: 'river', 'creek', 'spring creek', 'tailwater', 'lake', 'reservoir', 'stream', 'saltwater'",
      },
      summary: {
        type: "string" as const,
        description:
          "A 2-4 sentence synthesis of the fishing report. Include: current fishing quality, what's working (flies, techniques), water conditions. Write in present tense as a current report.",
      },
      conditions: {
        type: "string" as const,
        description:
          "Brief water conditions summary (e.g., 'Water temp 48°F, flows 250 CFS, slightly off-color'). Null if unknown.",
      },
      reportDate: {
        type: "string" as const,
        description:
          "ISO date string for when the report was most recently relevant (use the article publish date or today if unclear)",
      },
    },
  },
};

/**
 * Use Claude to summarize scraped fishing report content into structured data.
 */
export async function summarizeReports(
  reports: ScrapedReport[],
  waterBody?: { name: string; state?: string | null; latitude?: number | null; longitude?: number | null }
): Promise<SummarizedReport | null> {
  if (reports.length === 0) return null;

  const client = getClient();

  const reportsText = reports
    .map(
      (r, i) =>
        `--- Source ${i + 1}: ${r.title} (${r.siteName}) ---\n${r.content.slice(0, 3000)}`
    )
    .join("\n\n");

  const waterContext = waterBody
    ? `You are summarizing fishing reports specifically about "${waterBody.name}"${waterBody.state ? `, ${waterBody.state}` : ""}. ${
        waterBody.latitude && waterBody.longitude
          ? `Known coordinates: ${waterBody.latitude}, ${waterBody.longitude}.`
          : "Estimate the latitude/longitude if you know the location."
      }`
    : "Identify the primary body of water discussed in these reports. Provide its full name, state, coordinates, and water type. Use your geographical knowledge to fill in any missing details.";

  try {
    const response = await client.messages.create({
      model: PIPELINE_CONFIG.anthropic.model,
      max_tokens: 1024,
      system: `You are a fly fishing expert summarizing fishing reports. Your job is to:
1. Identify the specific body of water being discussed
2. Provide its precise name, state, region, coordinates, and water type
3. Extract actionable intel for anglers: what's hatching, what flies are working, water conditions, and overall fishing quality
Be concise and practical. Always provide latitude, longitude, and state — use your knowledge of US geography. ${waterContext}`,
      tools: [SUMMARIZE_TOOL],
      tool_choice: { type: "tool" as const, name: "save_fishing_report" },
      messages: [
        {
          role: "user",
          content: `Summarize these fishing reports into a single structured report:\n\n${reportsText}`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;

    const data = toolUse.input as {
      waterBody: string;
      region: string;
      state?: string;
      latitude?: number;
      longitude?: number;
      waterType?: string;
      summary: string;
      conditions?: string;
      reportDate: string;
    };

    return {
      waterBody: waterBody?.name ?? data.waterBody,
      region: data.region,
      state: data.state ?? waterBody?.state ?? null,
      latitude: waterBody?.latitude ?? data.latitude ?? null,
      longitude: waterBody?.longitude ?? data.longitude ?? null,
      waterType: data.waterType ?? "river",
      summary: data.summary,
      conditions: data.conditions ?? null,
      reportDate: data.reportDate,
      sourceUrls: reports.map((r) => r.url),
      sourceTitles: reports.map((r) => r.title),
    };
  } catch (err) {
    log.error("Failed to summarize reports", { error: String(err) });
    return null;
  }
}
