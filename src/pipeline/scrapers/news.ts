import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { PIPELINE_CONFIG } from "../config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";

const log = createLogger("news-scraper");
const rateLimit = createRateLimiter(PIPELINE_CONFIG.scraping.requestDelayMs);

// ─── News Source Configurations ─────────────────────────────────────────────

interface NewsFeedConfig {
  name: string;
  siteUrl: string;
  feedUrl: string | null;
  /** CSS selectors for scraping the homepage/news listing if no RSS */
  listingSelectors?: {
    articles: string;
    title: string;
    link: string;
    summary?: string;
    image?: string;
    date?: string;
    author?: string;
  };
}

const NEWS_SOURCES: NewsFeedConfig[] = [
  {
    name: "Hatch Magazine",
    siteUrl: "https://www.hatchmag.com",
    feedUrl: "https://www.hatchmag.com/feed",
  },
  {
    name: "Orvis News",
    siteUrl: "https://news.orvis.com",
    feedUrl: "https://news.orvis.com/feed",
  },
  {
    name: "MidCurrent",
    siteUrl: "https://midcurrent.com",
    feedUrl: "https://midcurrent.com/feed/",
  },
  {
    name: "Fly Fisherman Magazine",
    siteUrl: "https://www.flyfisherman.com",
    feedUrl: "https://www.flyfisherman.com/feed/",
  },
  {
    name: "Moldy Chum",
    siteUrl: "https://moldychum.com",
    feedUrl: "https://moldychum.com/feed/",
  },
  {
    name: "The Drake Magazine",
    siteUrl: "https://www.drakemag.com",
    feedUrl: "https://www.drakemag.com/feed",
  },
  {
    name: "Fly Lords",
    siteUrl: "https://flylords.com",
    feedUrl: "https://flylords.com/feed/",
  },
  {
    name: "Gink & Gasoline",
    siteUrl: "https://www.ginkandgasoline.com",
    feedUrl: "https://www.ginkandgasoline.com/feed/",
  },
  // HTML-only fallback sources
  {
    name: "Trout Unlimited",
    siteUrl: "https://www.tu.org",
    feedUrl: null,
    listingSelectors: {
      articles: "article, .post-item, .news-item",
      title: "h2 a, h3 a, .post-title a",
      link: "h2 a, h3 a, .post-title a",
      summary: ".excerpt, .post-excerpt, p",
      image: "img",
      date: "time, .date, .post-date",
    },
  },
];

// ─── RSS Parsing ────────────────────────────────────────────────────────────

interface ParsedArticle {
  url: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date;
}

async function fetchPage(url: string): Promise<string | null> {
  await rateLimit();

  try {
    return await retry(
      async () => {
        const res = await fetch(url, {
          headers: {
            "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
      },
      { maxRetries: 2, label: `fetch:${url}` },
    );
  } catch (err) {
    log.error("Failed to fetch", { url, error: String(err) });
    return null;
  }
}

function parseRssFeed(
  xml: string,
  source: NewsFeedConfig,
): ParsedArticle[] {
  const $ = cheerio.load(xml, { xml: true });
  const articles: ParsedArticle[] = [];

  // Try RSS 2.0 <item> elements first, then Atom <entry>
  const items = $("item").length > 0 ? $("item") : $("entry");

  items.each((_, el) => {
    const $item = $(el);

    // Title
    const title = $item.find("title").first().text().trim();
    if (!title) return;

    // Link — RSS uses <link>, Atom uses <link href="">
    let url =
      $item.find("link").first().text().trim() ||
      $item.find("link").first().attr("href") ||
      "";
    if (!url) return;

    // Resolve relative URLs
    if (!url.startsWith("http")) {
      url = new URL(url, source.siteUrl).toString();
    }

    // Summary — try description, summary, content:encoded
    let summary =
      $item.find("description").first().text().trim() ||
      $item.find("summary").first().text().trim() ||
      $item.find("content\\:encoded").first().text().trim() ||
      "";

    // Strip HTML tags from summary
    summary = summary.replace(/<[^>]*>/g, "").trim();
    // Truncate
    if (summary.length > 500) {
      summary = summary.slice(0, 497) + "...";
    }

    // Published date
    const dateStr =
      $item.find("pubDate").first().text().trim() ||
      $item.find("published").first().text().trim() ||
      $item.find("dc\\:date").first().text().trim() ||
      "";
    const publishedAt = dateStr ? new Date(dateStr) : new Date();

    // Author
    const author =
      $item.find("dc\\:creator").first().text().trim() ||
      $item.find("author name").first().text().trim() ||
      $item.find("author").first().text().trim() ||
      null;

    // Image — check media:content, enclosure, or embedded in description
    let imageUrl =
      $item.find("media\\:content").first().attr("url") ||
      $item.find("media\\:thumbnail").first().attr("url") ||
      $item.find("enclosure[type^='image']").first().attr("url") ||
      null;

    if (!imageUrl) {
      // Try to extract from description HTML
      const descHtml =
        $item.find("description").first().html() ||
        $item.find("content\\:encoded").first().html() ||
        "";
      const imgMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch?.[1]) {
        imageUrl = imgMatch[1];
      }
    }

    articles.push({
      url,
      title,
      summary: summary || title,
      sourceName: source.name,
      sourceUrl: source.siteUrl,
      author,
      imageUrl,
      publishedAt,
    });
  });

  return articles;
}

// ─── HTML Scraping Fallback ─────────────────────────────────────────────────

function scrapeNewsListing(
  html: string,
  source: NewsFeedConfig,
): ParsedArticle[] {
  if (!source.listingSelectors) return [];

  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];
  const sel = source.listingSelectors;

  $(sel.articles).each((_, el) => {
    const $el = $(el);

    const titleEl = $el.find(sel.title).first();
    const title = titleEl.text().trim();
    if (!title) return;

    let url = titleEl.attr("href") || $el.find(sel.link).first().attr("href") || "";
    if (!url) return;
    if (!url.startsWith("http")) {
      url = new URL(url, source.siteUrl).toString();
    }

    const summary = sel.summary
      ? $el.find(sel.summary).first().text().trim().slice(0, 500)
      : title;

    const imageUrl = sel.image
      ? ($el.find(sel.image).first().attr("src") || null)
      : null;

    const dateStr = sel.date
      ? $el.find(sel.date).first().text().trim() || $el.find(sel.date).first().attr("datetime") || ""
      : "";
    const publishedAt = dateStr ? new Date(dateStr) : new Date();

    const author = sel.author
      ? ($el.find(sel.author).first().text().trim() || null)
      : null;

    articles.push({
      url,
      title,
      summary: summary || title,
      sourceName: source.name,
      sourceUrl: source.siteUrl,
      author,
      imageUrl,
      publishedAt,
    });
  });

  return articles;
}

// ─── Relevance Scoring ──────────────────────────────────────────────────────

const FLY_FISHING_KEYWORDS = [
  "fly fishing",
  "fly tying",
  "trout",
  "steelhead",
  "salmon",
  "bass",
  "tarpon",
  "bonefish",
  "redfish",
  "hatch",
  "mayfly",
  "caddis",
  "stonefly",
  "streamer",
  "nymph",
  "dry fly",
  "emerger",
  "tippet",
  "leader",
  "rod",
  "reel",
  "wading",
  "drift boat",
  "conservation",
  "catch and release",
  "tight lines",
  "river",
  "stream",
  "creek",
  "spring creek",
  "tailwater",
  "freestone",
  "fly pattern",
  "dubbing",
  "hackle",
];

function scoreRelevance(article: ParsedArticle): number {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  let score = 0;

  for (const keyword of FLY_FISHING_KEYWORDS) {
    if (text.includes(keyword)) score += 2;
  }

  // Recency bonus: articles from the last 3 days get a boost
  const ageMs = Date.now() - article.publishedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 1) score += 10;
  else if (ageDays < 3) score += 5;
  else if (ageDays < 7) score += 2;

  // Penalize very old articles
  if (ageDays > 30) score -= 5;

  // Title-specific keywords are worth more
  const titleLower = article.title.toLowerCase();
  if (titleLower.includes("fly fishing")) score += 5;
  if (titleLower.includes("fly tying")) score += 5;

  return score;
}

// ─── Cross-Source Deduplication ──────────────────────────────────────────────

/**
 * Extract significant tokens from a title for comparison.
 * Removes stop words, lowercases, strips punctuation.
 */
function titleTokens(title: string): Set<string> {
  const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "it", "its", "how", "what", "when", "where", "who", "why", "new",
    "about", "into", "over", "after", "before", "up", "out", "your",
  ]);

  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Compute Jaccard similarity between two token sets (0-1).
 */
function tokenSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Deduplicate articles across sources. When multiple articles cover the same
 * story (similarity >= threshold), keep the one with the highest relevance score.
 */
function deduplicateArticles(
  articles: { article: ParsedArticle; score: number }[],
  similarityThreshold = 0.5,
): { article: ParsedArticle; score: number }[] {
  const tokenCache = articles.map((a) => ({
    ...a,
    tokens: titleTokens(a.article.title),
  }));

  const kept: typeof tokenCache = [];

  for (const candidate of tokenCache) {
    let isDuplicate = false;

    for (let i = 0; i < kept.length; i++) {
      const existing = kept[i]!;
      const sim = tokenSimilarity(candidate.tokens, existing.tokens);

      if (sim >= similarityThreshold) {
        isDuplicate = true;
        // Keep the higher-scored version
        if (candidate.score > existing.score) {
          kept[i] = candidate;
          log.info("Dedup: replaced article", {
            kept: candidate.article.title.slice(0, 60),
            dropped: existing.article.title.slice(0, 60),
            source: candidate.article.sourceName,
            similarity: sim.toFixed(2),
          });
        } else {
          log.info("Dedup: skipped duplicate", {
            kept: existing.article.title.slice(0, 60),
            dropped: candidate.article.title.slice(0, 60),
            source: candidate.article.sourceName,
            similarity: sim.toFixed(2),
          });
        }
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(candidate);
    }
  }

  return kept.map(({ article, score }) => ({ article, score }));
}

// ─── Main Scrape Function ───────────────────────────────────────────────────

export async function scrapeNews(maxPerSource = 10): Promise<number> {
  log.info(`Scraping news from ${NEWS_SOURCES.length} sources`);

  // Collect all articles from all sources first (for cross-source dedup)
  const allScored: { article: ParsedArticle; score: number }[] = [];

  for (const source of NEWS_SOURCES) {
    try {
      let articles: ParsedArticle[] = [];

      if (source.feedUrl) {
        const xml = await fetchPage(source.feedUrl);
        if (xml) {
          articles = parseRssFeed(xml, source);
          log.info("Parsed RSS feed", {
            source: source.name,
            articles: String(articles.length),
          });
        }
      }

      // Fallback to HTML scraping
      if (articles.length === 0 && source.listingSelectors) {
        const html = await fetchPage(source.siteUrl);
        if (html) {
          articles = scrapeNewsListing(html, source);
          log.info("Scraped HTML listing", {
            source: source.name,
            articles: String(articles.length),
          });
        }
      }

      if (articles.length === 0) {
        log.warn("No articles found", { source: source.name });
        continue;
      }

      // Score and sort by relevance, take top per source
      const scored = articles
        .map((a) => ({ article: a, score: scoreRelevance(a) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPerSource);

      allScored.push(...scored);
    } catch (err) {
      log.error("Failed to scrape source", {
        source: source.name,
        error: String(err),
      });
    }
  }

  // Sort all articles by score (best first) then deduplicate across sources
  allScored.sort((a, b) => b.score - a.score);
  const deduplicated = deduplicateArticles(allScored);

  log.info(
    `Deduplication: ${allScored.length} articles -> ${deduplicated.length} unique stories`
  );

  // Upsert unique articles into database
  let totalNew = 0;

  for (const { article } of deduplicated) {
    try {
      await prisma.newsArticle.upsert({
        where: { url: article.url },
        create: {
          url: article.url,
          title: article.title,
          summary: article.summary,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          author: article.author,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
        },
        update: {
          title: article.title,
          summary: article.summary,
          imageUrl: article.imageUrl,
        },
      });
      totalNew++;
    } catch {
      // Skip duplicates or invalid dates
    }
  }

  log.success(`News scrape complete: ${totalNew} articles saved/updated`);
  return totalNew;
}
