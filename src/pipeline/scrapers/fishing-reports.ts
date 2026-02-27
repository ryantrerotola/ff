import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { createLogger } from "../utils/logger";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { PIPELINE_CONFIG } from "../config";
import { slugify } from "../utils/slug";

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
// The pipeline also uses Brave/Serper web search to find reports from
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
  {
    name: "BlogFlyFish",
    searchUrl: (q) =>
      `https://blogflyfish.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  // ─── Fly shops (WordPress search) ────────────────────────────────────
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
    name: "Angler's Covey (CO)",
    searchUrl: (q) =>
      `https://anglerscovey.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "RIGS Fly Shop (CO)",
    searchUrl: (q) =>
      `https://fishrigs.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
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
    name: "Colorado Trout Hunters",
    searchUrl: (q) =>
      `https://coloradotrouthunters.com/?s=${encodeURIComponent(q + " fishing report")}`,
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
  {
    name: "Montana Outdoor",
    searchUrl: (q) =>
      `https://www.montanaoutdoor.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Caddis Fly (OR)",
    searchUrl: (q) =>
      `https://oregonflyfishingblog.com/?s=${encodeURIComponent(q + " fishing report")}`,
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
];

/**
 * RSS/Atom feed sources — the most reliable scraping method.
 * Many fly shops (especially Shopify) and WordPress blogs auto-generate feeds.
 * We scrape the feed, then fetch full article content from each entry.
 */
interface FeedSource {
  name: string;
  feedUrl: string;
  siteUrl: string;
  contentSelector: string;
  dateSelector: string;
}

const FEED_SOURCES: FeedSource[] = [
  // ─── Shopify fly shops (Atom feeds) ──────────────────────────────────
  {
    name: "Murray's Fly Shop (VA)",
    feedUrl: "https://www.murraysflyshop.com/blogs/fishing-report.atom",
    siteUrl: "https://www.murraysflyshop.com",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  {
    name: "Red's Fly Shop (WA)",
    feedUrl: "https://redsflyfishing.com/blogs/yakima-river-fishing-report.atom",
    siteUrl: "https://redsflyfishing.com",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  {
    name: "Lost Coast Outfitters (CA)",
    feedUrl: "https://www.lostcoastoutfitters.com/blogs/fishing-report.atom",
    siteUrl: "https://www.lostcoastoutfitters.com",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  {
    name: "Fly and Field Outfitters (OR)",
    feedUrl: "https://www.flyandfield.com/blogs/fishing-reports.atom",
    siteUrl: "https://www.flyandfield.com",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  {
    name: "TCO Fly Shop (PA)",
    feedUrl: "https://tcoflyfishing.com/blogs/fishing-reports.atom",
    siteUrl: "https://tcoflyfishing.com",
    contentSelector: "article, .article__body, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  // ─── WordPress blogs (RSS feeds) ────────────────────────────────────
  {
    name: "Montana Outdoor",
    feedUrl: "https://www.montanaoutdoor.com/feed/",
    siteUrl: "https://www.montanaoutdoor.com",
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "The Caddis Fly (OR)",
    feedUrl: "https://oregonflyfishingblog.com/feed/",
    siteUrl: "https://oregonflyfishingblog.com",
    contentSelector: "article, .entry-content, .post-content",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "BlogFlyFish",
    feedUrl: "https://blogflyfish.com/feed/",
    siteUrl: "https://blogflyfish.com",
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
    name: "Trout's Fly Fishing (CO)",
    url: "https://www.troutsflyfishing.com/fishing-reports",
    contentSelector: "article, .entry-content, .post-content, .blog-list, main",
    dateSelector: "time, .entry-date, .post-date, .date",
  },
  {
    name: "Blue Quill Angler (CO)",
    url: "https://bluequillangler.com/fishing-reports/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Vail Valley Anglers (CO)",
    url: "https://www.vailvalleyanglers.com/fishing-reports",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Angler's Covey (CO)",
    url: "https://anglerscovey.com/fishing-reports/",
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
    name: "RIGS Fly Shop (CO)",
    url: "https://fishrigs.com/fish-report/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Dragonfly Anglers (CO)",
    url: "https://dragonflyanglers.com/fishing-report/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
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
    name: "The River's Edge (MT)",
    url: "https://theriversedge.com/pages/montana-fishing-reports",
    contentSelector: "article, .page-content, .rte, .shopify-section, main",
    dateSelector: "time[datetime], .article__date",
  },
  {
    name: "The Tackle Shop (MT)",
    url: "https://www.thetackleshop.com/montana-fly-fishing-reports/",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Montana Troutfitters (MT)",
    url: "https://troutfitters.com/river-reports",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Fins & Feathers (MT)",
    url: "https://flyfishingbozeman.com/montana-fishing-reports",
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
    name: "Deschutes Angler (OR)",
    url: "https://www.deschutesangler.com/fishing-report",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "House of Fly (ID/MT)",
    url: "https://houseoffly.com/house-of-fly-fishing-reports",
    contentSelector: "article, .entry-content, .post-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "Trout Town Flies (NY)",
    url: "https://trouttownflies.com/reports/",
    contentSelector: "article, .entry-content, .post-content, .report-content, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  {
    name: "High Desert Angler (NM)",
    url: "https://www.highdesertangler.com/stream-report",
    contentSelector: "article, .blog-item, .entry-body, .sqs-block-content, main",
    dateSelector: "time, .blog-date, .entry-date",
  },
  {
    name: "Pat Dorsey Fly Fishing (CO)",
    url: "https://www.patdorseyflyfishing.com/rivers/",
    contentSelector: "article, .entry-content, .post-content, .river-report, main",
    dateSelector: "time, .entry-date, .post-date",
  },
  // ─── Guide services ──────────────────────────────────────────────────
  {
    name: "Spinner Fall Guide Service (UT)",
    url: "https://www.spinnerfall.com/green-river-fly-fishing-report",
    contentSelector: "article, .entry-content, .post-body, .sqs-block-content, main",
    dateSelector: "time, .blog-date, .entry-date",
  },
  {
    name: "Rise Beyond Fly Fishing (CO)",
    url: "https://risebeyondflyfishing.com/blog/tag/river-report",
    contentSelector: "article, .blog-item, .blog-content, .entry-content, main",
    dateSelector: "time, .blog-date, .entry-date",
  },
  {
    name: "Montana Angler",
    url: "https://www.montanaangler.com/montana-fishing-reports",
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
  {
    name: "Oregon DFW Fishing Report",
    url: "https://myodfw.com/recreation-report/fishing-report",
    contentSelector: ".field-content, .views-row, article, .node-content, main",
    dateSelector: "time, .date, .updated",
  },
  {
    name: "Washington DFW Fishing Reports",
    url: "https://wdfw.wa.gov/fishing/reports",
    contentSelector: ".views-row, article, .field-content, .region-report, main",
    dateSelector: "time, .date, .updated",
  },
  {
    name: "Wyoming Game & Fish",
    url: "https://wgfd.wyo.gov/fishing-and-boating/fishing-reports",
    contentSelector: ".page-content, .main-content, article, main, #content",
    dateSelector: "time, .date, .updated",
  },
  {
    name: "Texas Parks & Wildlife Fishing Reports",
    url: "https://tpwd.texas.gov/fishboat/fish/recreational/fishreport.phtml",
    contentSelector: "#content, .report-body, article, main",
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
 * Used for Brave/Serper search results and direct report pages.
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

// ─── RSS / Atom feed scraping ───────────────────────────────────────────────

/**
 * Parse an RSS or Atom feed and extract article URLs + metadata.
 * Returns the most recent entries (up to maxEntries).
 */
function parseFeedEntries(
  xml: string,
  source: FeedSource,
  maxEntries = 5
): { url: string; title: string; publishDate: string | null }[] {
  const $ = cheerio.load(xml, { xml: true });
  const entries: { url: string; title: string; publishDate: string | null }[] = [];

  // RSS 2.0 uses <item>, Atom uses <entry>
  const items = $("item").length > 0 ? $("item") : $("entry");

  items.each((i, el) => {
    if (i >= maxEntries) return false; // cheerio each break

    const $item = $(el);
    const title = $item.find("title").first().text().trim();
    if (!title) return;

    // Link: RSS uses <link> text, Atom uses <link href="">
    let url =
      $item.find("link").first().text().trim() ||
      $item.find("link").first().attr("href") ||
      "";
    if (!url) return;

    // Resolve relative URLs
    if (!url.startsWith("http")) {
      url = new URL(url, source.siteUrl).toString();
    }

    // Date: try pubDate (RSS) or updated/published (Atom)
    let publishDate: string | null = null;
    const dateStr =
      $item.find("pubDate").first().text().trim() ||
      $item.find("updated").first().text().trim() ||
      $item.find("published").first().text().trim() ||
      "";
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        publishDate = parsed.toISOString();
      }
    }

    entries.push({ url, title, publishDate });
  });

  return entries;
}

/**
 * Scrape all RSS/Atom feed sources. Called once per pipeline run.
 * Fetches feeds, parses entries, and scrapes full article content.
 */
async function scrapeFeedSources(): Promise<ScrapedReport[]> {
  const reports: ScrapedReport[] = [];

  for (const source of FEED_SOURCES) {
    try {
      const xml = await fetchPage(source.feedUrl);
      if (!xml) {
        log.warn(`Could not fetch feed: ${source.name}`);
        continue;
      }

      const entries = parseFeedEntries(xml, source);
      if (entries.length === 0) continue;

      log.info(`Parsed ${entries.length} entries from ${source.name} feed`);

      // Fetch full article content for each entry
      for (const entry of entries) {
        try {
          const html = await fetchPage(entry.url);
          if (!html) continue;

          const report = scrapeArticleContent(
            html,
            entry.url,
            source.name,
            source.contentSelector,
            source.dateSelector
          );
          if (report) {
            // Use feed date if article date wasn't found
            if (!report.publishDate && entry.publishDate) {
              report.publishDate = entry.publishDate;
            }
            reports.push(report);
          }
        } catch {
          // Skip failed articles
        }
      }
    } catch (err) {
      log.warn(`Failed to scrape feed: ${source.name}`, { error: String(err) });
    }
  }

  return reports;
}

// ─── Brave / Serper web search for broad discovery ──────────────────────────
// These find fishing reports from ANY site on the web, not just preconfigured ones.

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";
const SERPER_WEB_API = "https://google.serper.dev/search";

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
 * Search Brave Web Search for fishing report articles.
 * Requires BRAVE_SEARCH_API_KEY env var.
 */
async function searchBraveWeb(query: string): Promise<ScrapedReport[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    log.info("Brave Search not configured — skipping Brave web search");
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    q: query,
    count: "10",
    freshness: "pm", // Last month only — we want recent reports
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
      { maxRetries: 2, backoffMs: 2000, label: `brave-web:${query}` }
    );

    if (!res.ok) {
      log.warn(`Brave Search error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      web?: { results?: { url: string; title: string; description?: string }[] };
    };

    if (!data.web?.results?.length) return [];

    const reports: ScrapedReport[] = [];

    // Scrape top results
    for (const item of data.web.results.slice(0, 5)) {
      if (shouldSkipUrl(item.url)) continue;

      try {
        const html = await fetchPage(item.url);
        if (!html) continue;

        const report = scrapeArticleContent(html, item.url, "Brave Search");
        if (report) reports.push(report);
      } catch {
        // Skip failed pages
      }
    }

    return reports;
  } catch (err) {
    log.warn("Brave web search failed", { error: String(err) });
    return [];
  }
}

/**
 * Search Serper.dev (Google results) for fishing report articles.
 * Requires SERPER_API_KEY env var. Fallback to Brave for broader coverage.
 */
async function searchSerperWeb(query: string): Promise<ScrapedReport[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    log.info("Serper not configured — skipping Serper web search");
    return [];
  }

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
            tbs: "qdr:m", // Last month only
            gl: "us",
          }),
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `serper-web:${query}` }
    );

    if (!res.ok) {
      log.warn(`Serper API error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      organic?: { link: string; title: string; snippet?: string }[];
    };

    if (!data.organic?.length) return [];

    const reports: ScrapedReport[] = [];

    for (const item of data.organic.slice(0, 5)) {
      if (shouldSkipUrl(item.link)) continue;

      try {
        const html = await fetchPage(item.link);
        if (!html) continue;

        const report = scrapeArticleContent(html, item.link, "Serper Search");
        if (report) reports.push(report);
      } catch {
        // Skip failed pages
      }
    }

    return reports;
  } catch (err) {
    log.warn("Serper web search failed", { error: String(err) });
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
 * 2. Brave web search (finds reports from any site)
 * 3. Serper web search (Google results, finds reports from any site)
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

  // 2. Brave web search — finds reports from ANY site
  try {
    const braveReports = await searchBraveWeb(query);
    addReports(braveReports);
    if (braveReports.length > 0) {
      log.info(`Found ${braveReports.length} reports from Brave`, { query });
    }
  } catch (err) {
    log.warn("Brave search failed", { error: String(err) });
  }

  // 3. Serper web search (Google results) — additional coverage
  try {
    const serperReports = await searchSerperWeb(query);
    addReports(serperReports);
    if (serperReports.length > 0) {
      log.info(`Found ${serperReports.length} reports from Serper`, { query });
    }
  } catch (err) {
    log.warn("Serper search failed", { error: String(err) });
  }

  return allReports;
}

/**
 * Scrape all direct report pages. Called once per pipeline run
 * (not per query) since these are known URLs.
 */
export { scrapeDirectReportPages, scrapeFeedSources };

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
    "Save a summarized fishing report for a specific body of water. Only call this for content that describes CURRENT fishing conditions on a specific body of water.",
  input_schema: {
    type: "object" as const,
    required: [
      "isFishingReport",
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
      isFishingReport: {
        type: "boolean" as const,
        description:
          "Set to true ONLY if the content is an actual fishing conditions report — describing how a specific water is currently fishing, what hatches are happening, what flies/patterns are working, water conditions, or recent catch reports. Set to false for: gear reviews, news articles, conservation/policy stories, technique tutorials, opinion pieces, shop promotions, fishing stories/memoirs, interviews, tournament results, or anything that does NOT describe current on-the-water conditions.",
      },
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
          "A 2-4 sentence synthesis of CURRENT fishing conditions. Must include specifics: what flies/patterns are producing, what's hatching, how the fishing has been. Write in present tense. Do NOT include gear recommendations, policy discussion, or general advice.",
      },
      conditions: {
        type: "string" as const,
        description:
          "Brief water conditions summary (e.g., 'Water temp 48°F, flows 250 CFS, slightly off-color'). Null if unknown.",
      },
      reportDate: {
        type: "string" as const,
        description:
          "ISO date string for when this report was published. Use the article's actual publish date. If the article has no clear date or appears older than 60 days, set isFishingReport to false.",
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
      system: `You are a fly fishing expert that FILTERS and summarizes fishing reports.

FIRST decide: is this a genuine, current fishing conditions report? Set isFishingReport accordingly.

ACCEPT ONLY content that describes CURRENT conditions on a specific body of water:
- Water levels, flows, temperature, clarity
- What hatches are active right now (specific bugs: BWOs, PMDs, caddis, etc.)
- What fly patterns are producing (specific patterns: #18 Parachute Adams, size 20 RS2, etc.)
- Recent catch reports with specifics about what worked
- Guide reports describing current fishing quality

REJECT (set isFishingReport=false) content that is:
- Gear reviews, product recommendations, rod/reel/wader articles
- Conservation news, regulations, policy changes, stocking reports
- Technique tutorials or "how-to" articles
- Opinion pieces, fishing stories, personal narratives
- Shop promotions, event announcements, tournament results
- Interviews without current water conditions
- General articles that mention a river but don't describe current fishing

If accepted, extract:
1. The specific body of water
2. Current conditions: what's hatching, what flies are working, water conditions, fishing quality
3. Precise name, state, region, coordinates, water type

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
      isFishingReport: boolean;
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

    if (!data.isFishingReport) {
      log.warn(`  Rejected (not a fishing report): ${reports[0]?.title ?? "unknown"}`);
      return null;
    }

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

// ─── Pipeline Runner ────────────────────────────────────────────────────────

export interface FishingReportsPipelineResult {
  created: number;
  updated: number;
  failed: number;
  waterBodiesCreated: number;
  totalReportsScraped: number;
}

/**
 * Upsert a fishing report — update if exists for this water body + region,
 * create if new.
 */
async function upsertFishingReport(
  summary: SummarizedReport,
): Promise<"created" | "updated"> {
  const existing = await prisma.fishingReport.findUnique({
    where: {
      waterBody_region: {
        waterBody: summary.waterBody,
        region: summary.region,
      },
    },
  });

  if (existing) {
    await prisma.fishingReport.update({
      where: { id: existing.id },
      data: {
        summary: summary.summary,
        conditions: summary.conditions,
        sourceUrls: summary.sourceUrls,
        sourceTitles: summary.sourceTitles,
        latitude: summary.latitude,
        longitude: summary.longitude,
        state: summary.state,
        reportDate: new Date(summary.reportDate),
      },
    });
    log.info(`  Updated report for ${summary.waterBody}`);
    return "updated";
  }

  await prisma.fishingReport.create({
    data: {
      waterBody: summary.waterBody,
      region: summary.region,
      state: summary.state,
      latitude: summary.latitude,
      longitude: summary.longitude,
      summary: summary.summary,
      conditions: summary.conditions,
      sourceUrls: summary.sourceUrls,
      sourceTitles: summary.sourceTitles,
      reportDate: new Date(summary.reportDate),
    },
  });
  log.info(`  Created report for ${summary.waterBody}`);
  return "created";
}

/**
 * Auto-create a WaterBody record from a summarized report if one doesn't
 * already exist.
 */
async function ensureWaterBody(summary: SummarizedReport): Promise<boolean> {
  const waterSlug = slugify(
    summary.state
      ? `${summary.waterBody} ${summary.state}`
      : summary.waterBody,
  );

  const existing = await prisma.waterBody.findUnique({
    where: { slug: waterSlug },
  });

  if (existing) return false;

  const existingByName = await prisma.waterBody.findUnique({
    where: {
      name_region: {
        name: summary.waterBody,
        region: summary.region,
      },
    },
  });

  if (existingByName) return false;

  await prisma.waterBody.create({
    data: {
      name: summary.waterBody,
      slug: waterSlug,
      state: summary.state,
      region: summary.region,
      latitude: summary.latitude,
      longitude: summary.longitude,
      waterType: summary.waterType,
    },
  });
  log.info(`  Auto-created water body: ${summary.waterBody} (${waterSlug})`);
  return true;
}

/**
 * Process a single scraped report: summarize with Claude, upsert, and ensure
 * the water body exists. Returns the action taken.
 */
async function processReport(
  report: ScrapedReport,
  stats: { created: number; updated: number; failed: number; waterBodiesCreated: number },
): Promise<void> {
  const summary = await summarizeReports([report]);
  if (!summary) {
    log.warn(`  Could not summarize: ${report.title}`);
    stats.failed++;
    return;
  }

  if (!summary.latitude || !summary.longitude) {
    log.warn(`  No coordinates for ${summary.waterBody} — skipping`);
    stats.failed++;
    return;
  }

  const upsertResult = await upsertFishingReport(summary);
  if (upsertResult === "created") stats.created++;
  else stats.updated++;

  const wbCreated = await ensureWaterBody(summary);
  if (wbCreated) stats.waterBodiesCreated++;
}

/**
 * Run the full fishing reports pipeline: discover, scrape, summarize, and
 * upsert all fishing reports. This is the core function used by both the CLI
 * command and the cron API route.
 */
export async function runFishingReportsPipeline(
  options: { queryLimit?: number } = {},
): Promise<FishingReportsPipelineResult> {
  // Validate that the Prisma client has the FishingReport model.
  // If not, the user needs to run `npx prisma generate` after schema changes.
  if (!prisma.fishingReport) {
    throw new Error(
      "prisma.fishingReport is undefined — the Prisma client is outdated. " +
        "Run `npx prisma generate` (or `npm install`) to regenerate it.",
    );
  }

  const queryLimit = options.queryLimit ?? GENERAL_REPORT_QUERIES.length;
  const queries = GENERAL_REPORT_QUERIES.slice(0, queryLimit);

  const stats = { created: 0, updated: 0, failed: 0, waterBodiesCreated: 0 };
  const seenUrls = new Set<string>();

  // Step 1: Query-based search
  log.info(
    `Step 1: Discovering fishing reports using ${queries.length} search queries`,
  );

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi]!;
    log.info(`  [${qi + 1}/${queries.length}] "${query}"`);

    try {
      const reports = await discoverFishingReports(query);
      if (reports.length === 0) {
        log.info(`    No reports found`);
        continue;
      }

      const newReports = reports.filter((r) => !seenUrls.has(r.url));
      for (const r of reports) seenUrls.add(r.url);

      if (newReports.length === 0) {
        log.info(`    All ${reports.length} reports already processed`);
        continue;
      }

      log.info(
        `    Found ${newReports.length} new reports (${reports.length - newReports.length} dupes skipped)`,
      );

      for (const report of newReports) {
        try {
          await processReport(report, stats);
        } catch (err) {
          log.error(`    Failed to process report: ${report.title}`, {
            error: String(err),
          });
          stats.failed++;
        }
      }
    } catch (err) {
      log.warn(`  Query failed: "${query}"`, { error: String(err) });
    }
  }

  // Step 2: Direct report pages
  log.info("Step 2: Scraping direct report pages (fly shops, guides, agencies)...");
  try {
    const directReports = await scrapeDirectReportPages();
    const newDirect = directReports.filter((r) => !seenUrls.has(r.url));
    for (const r of directReports) seenUrls.add(r.url);

    log.info(
      `  Found ${newDirect.length} reports from direct pages (${directReports.length - newDirect.length} dupes skipped)`,
    );

    for (const report of newDirect) {
      try {
        await processReport(report, stats);
      } catch (err) {
        log.error(`  Failed to process direct report: ${report.title}`, {
          error: String(err),
        });
        stats.failed++;
      }
    }
  } catch (err) {
    log.warn("Direct page scraping failed", { error: String(err) });
  }

  // Step 3: RSS/Atom feeds
  log.info("Step 3: Scraping RSS/Atom feeds (fly shops, blogs)...");
  try {
    const feedReports = await scrapeFeedSources();
    const newFeeds = feedReports.filter((r) => !seenUrls.has(r.url));
    for (const r of feedReports) seenUrls.add(r.url);

    log.info(
      `  Found ${newFeeds.length} reports from feeds (${feedReports.length - newFeeds.length} dupes skipped)`,
    );

    for (const report of newFeeds) {
      try {
        await processReport(report, stats);
      } catch (err) {
        log.error(`  Failed to process feed report: ${report.title}`, {
          error: String(err),
        });
        stats.failed++;
      }
    }
  } catch (err) {
    log.warn("Feed scraping failed", { error: String(err) });
  }

  const totalReportsScraped = seenUrls.size;

  log.info(
    `Fishing reports pipeline complete: ${stats.created} created, ${stats.updated} updated, ${stats.failed} failed, ${stats.waterBodiesCreated} water bodies auto-created`,
  );

  return { ...stats, totalReportsScraped };
}
