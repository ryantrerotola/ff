import * as cheerio from "cheerio";
import { PIPELINE_CONFIG } from "../config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import type { RawBlogResult, BlogSiteConfig } from "../types";

const log = createLogger("blog-scraper");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

// ─── Site Configurations ────────────────────────────────────────────────────

export const BLOG_SITES: BlogSiteConfig[] = [
  {
    name: "Charlie's Fly Box",
    baseUrl: "https://charliesflybox.com",
    searchUrlTemplate:
      "https://charliesflybox.com/?s={query}",
    selectors: {
      resultLinks: "article a[href*='charliesflybox.com']",
      title: "h1.entry-title, h1.post-title, h1",
      content: ".entry-content, .post-content, article",
      materials: ".recipe-materials, .materials-list, table",
      author: ".author-name, .entry-author, .byline",
    },
    maxPages: 3,
  },
  {
    name: "Orvis Fly Fishing",
    baseUrl: "https://news.orvis.com",
    searchUrlTemplate:
      "https://news.orvis.com/?s={query}+fly+tying",
    selectors: {
      resultLinks: "article a[href*='orvis.com']",
      title: "h1.entry-title, h1",
      content: ".entry-content, .post-content, article",
      materials: ".recipe-card, .materials, table",
      author: ".author-name, .byline",
    },
    maxPages: 2,
  },
  {
    name: "Fly Fisherman Magazine",
    baseUrl: "https://www.flyfisherman.com",
    searchUrlTemplate:
      "https://www.flyfisherman.com/?s={query}+fly+pattern",
    selectors: {
      resultLinks: "article a, .post-listing a",
      title: "h1.entry-title, h1",
      content: ".entry-content, .post-content, article",
      materials: ".recipe, .materials-list, table",
      author: ".author-name, .byline",
    },
    maxPages: 2,
  },
  {
    name: "Hatch Magazine",
    baseUrl: "https://www.hatchmag.com",
    searchUrlTemplate:
      "https://www.hatchmag.com/?s={query}+fly+tying",
    selectors: {
      resultLinks: "article a",
      title: "h1",
      content: ".entry-content, article",
      materials: ".materials, table",
      author: ".author, .byline",
    },
    maxPages: 2,
  },
  {
    name: "Global FlyFisher",
    baseUrl: "https://globalflyfisher.com",
    searchUrlTemplate:
      "https://globalflyfisher.com/search?q={query}+fly+pattern",
    selectors: {
      resultLinks: ".search-results a, article a",
      title: "h1",
      content: ".article-content, .node-content, article",
      materials: ".materials, .recipe, table",
      author: ".author, .username",
    },
    maxPages: 2,
  },
  {
    name: "Fly Tyer Magazine",
    baseUrl: "https://www.flytyer.com",
    searchUrlTemplate:
      "https://www.flytyer.com/?s={query}",
    selectors: {
      resultLinks: "article a",
      title: "h1.entry-title, h1",
      content: ".entry-content, article",
      materials: ".recipe-card, table",
      author: ".author, .byline",
    },
    maxPages: 2,
  },
];

// ─── Core Scraping Functions ────────────────────────────────────────────────

/**
 * Fetch a URL and return the HTML content.
 */
async function fetchPage(url: string): Promise<string | null> {
  await rateLimit();

  try {
    const response = await retry(
      async () => {
        const res = await fetch(url, {
          headers: {
            "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${url}`);
        }
        return res.text();
      },
      { maxRetries: 2, label: `fetch:${url}` }
    );

    return response;
  } catch (err) {
    log.error("Failed to fetch page", { url, error: String(err) });
    return null;
  }
}

/**
 * Search a blog site for articles about a fly pattern.
 */
export async function searchBlogSite(
  site: BlogSiteConfig,
  patternName: string
): Promise<string[]> {
  const searchUrl = site.searchUrlTemplate.replace(
    "{query}",
    encodeURIComponent(patternName)
  );

  log.info("Searching blog site", { site: site.name, pattern: patternName });

  const html = await fetchPage(searchUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const links: string[] = [];

  $(site.selectors.resultLinks).each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      // Resolve relative URLs
      const fullUrl = href.startsWith("http")
        ? href
        : new URL(href, site.baseUrl).toString();

      // Filter to only relevant pages (skip category/tag pages)
      if (
        !fullUrl.includes("/tag/") &&
        !fullUrl.includes("/category/") &&
        !fullUrl.includes("/page/") &&
        !links.includes(fullUrl)
      ) {
        links.push(fullUrl);
      }
    }
  });

  log.info("Found links", {
    site: site.name,
    count: String(links.length),
  });

  return links.slice(0, site.maxPages * 5);
}

/**
 * Scrape a single blog article and extract its content.
 */
export async function scrapeBlogArticle(
  url: string,
  site: BlogSiteConfig
): Promise<RawBlogResult | null> {
  log.info("Scraping article", { url });

  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Remove noise: scripts, styles, nav, footer, sidebar, ads
  $(
    "script, style, nav, footer, .sidebar, .widget, .ad, .advertisement, .comments, .related-posts, .social-share"
  ).remove();

  const title = $(site.selectors.title).first().text().trim();
  if (!title) {
    log.warn("No title found", { url });
    return null;
  }

  // Extract main content
  const contentEl = $(site.selectors.content).first();
  const content = contentEl.text().replace(/\s+/g, " ").trim();

  if (content.length < 100) {
    log.warn("Content too short, skipping", {
      url,
      length: String(content.length),
    });
    return null;
  }

  // Try to extract structured materials section
  let materialsHtml: string | null = null;
  if (site.selectors.materials) {
    const materialsEl = $(site.selectors.materials).first();
    if (materialsEl.length) {
      materialsHtml = materialsEl.html();
    }
  }

  // Try to extract author
  let author: string | null = null;
  if (site.selectors.author) {
    author = $(site.selectors.author).first().text().trim() || null;
  }

  return {
    url,
    title,
    siteName: site.name,
    author,
    content: content.slice(0, 15000), // Cap content length
    materialsHtml,
  };
}

/**
 * Discover and scrape all blog content for a given pattern across all configured sites.
 */
export async function discoverBlogContent(
  patternName: string
): Promise<RawBlogResult[]> {
  const results: RawBlogResult[] = [];

  for (const site of BLOG_SITES) {
    try {
      const links = await searchBlogSite(site, patternName);

      for (const link of links) {
        const article = await scrapeBlogArticle(link, site);
        if (article) {
          results.push(article);
        }
      }
    } catch (err) {
      log.error("Error scraping site", {
        site: site.name,
        error: String(err),
      });
    }
  }

  return results;
}

/**
 * Scrape a single arbitrary URL (manual import).
 * Attempts to intelligently extract content from any webpage.
 */
export async function scrapeArbitraryUrl(
  url: string
): Promise<RawBlogResult | null> {
  log.info("Scraping arbitrary URL", { url });

  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, footer, .sidebar, .widget, .ad, .advertisement, .comments, .social-share, header"
  ).remove();

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Unknown Title";

  // Extract main content - try common selectors
  const contentSelectors = [
    "article",
    ".post-content",
    ".entry-content",
    ".article-content",
    ".content",
    "main",
    "#content",
    ".post",
  ];

  let content = "";
  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length) {
      content = el.text().replace(/\s+/g, " ").trim();
      if (content.length > 200) break;
    }
  }

  if (!content || content.length < 100) {
    // Fall back to body text
    content = $("body").text().replace(/\s+/g, " ").trim();
  }

  // Determine site name from URL
  const hostname = new URL(url).hostname.replace("www.", "");

  // Look for author
  const authorSelectors = [
    ".author",
    ".byline",
    '[rel="author"]',
    ".post-author",
  ];
  let author: string | null = null;
  for (const selector of authorSelectors) {
    const text = $(selector).first().text().trim();
    if (text) {
      author = text;
      break;
    }
  }

  // Look for structured materials (tables, lists)
  let materialsHtml: string | null = null;
  const tables = $("table");
  tables.each((_, el) => {
    const tableText = $(el).text().toLowerCase();
    if (
      tableText.includes("hook") ||
      tableText.includes("thread") ||
      tableText.includes("material")
    ) {
      materialsHtml = $(el).html();
    }
  });

  return {
    url,
    title,
    siteName: hostname,
    author,
    content: content.slice(0, 15000),
    materialsHtml,
  };
}

/**
 * Score a blog result for content quality.
 */
export function scoreBlogResult(result: RawBlogResult): number {
  let score = 0;

  // Content length
  if (result.content.length > 2000) score += 10;
  else if (result.content.length > 500) score += 5;

  // Has structured materials
  if (result.materialsHtml) score += 15;

  // Title relevance
  const titleLower = result.title.toLowerCase();
  if (titleLower.includes("recipe")) score += 8;
  if (titleLower.includes("how to tie")) score += 8;
  if (titleLower.includes("fly pattern")) score += 5;
  if (titleLower.includes("materials")) score += 5;
  if (titleLower.includes("tutorial")) score += 5;
  if (titleLower.includes("step by step")) score += 5;

  // Content keyword density
  const contentLower = result.content.toLowerCase();
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
    "thorax",
    "chenille",
  ];
  const matchCount = materialKeywords.filter((kw) =>
    contentLower.includes(kw)
  ).length;
  score += matchCount * 2;

  // Has author
  if (result.author) score += 3;

  return score;
}
