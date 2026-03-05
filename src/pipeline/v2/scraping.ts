/**
 * V2 Scraping Stage
 *
 * Extracts content from discovered URLs.
 * Enhanced YouTube description parsing for no-transcript videos.
 * Uses Brave-only approach for web content (no hardcoded site configs).
 */

import * as cheerio from "cheerio";
import { V2_CONFIG } from "./config";
import { createRateLimiter, retry, mapConcurrent } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import { fetchTranscript } from "../scrapers/youtube";
import type { DiscoveredSource, ScrapedSource, InlineImage } from "./types";

const log = createLogger("v2:scraping");
const rateLimit = createRateLimiter(V2_CONFIG.scraping.requestDelayMs);

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Scrape content from all discovered sources for a pattern.
 */
export async function scrapeAllSources(
  sources: DiscoveredSource[]
): Promise<ScrapedSource[]> {
  const allResults = await mapConcurrent(
    sources,
    V2_CONFIG.scraping.concurrency,
    async (source) => {
      try {
        const scraped =
          source.sourceType === "youtube"
            ? await scrapeYouTubeSource(source)
            : await scrapeWebSource(source);

        if (scraped && scraped.content.length >= V2_CONFIG.extraction.minContentLength) {
          return scraped;
        } else if (scraped) {
          log.warn("Content too short, skipping", {
            url: source.url,
            length: String(scraped.content.length),
          });
        }
      } catch (err) {
        log.error("Scrape failed", { url: source.url, error: String(err) });
      }
      return null;
    }
  );

  const results = allResults.filter((r): r is ScrapedSource => r !== null);

  log.success("Scraping complete", {
    attempted: String(sources.length),
    scraped: String(results.length),
  });

  return results;
}

// ─── YouTube Scraping ──────────────────────────────────────────────────────

async function scrapeYouTubeSource(
  source: DiscoveredSource
): Promise<ScrapedSource | null> {
  const videoId = extractVideoId(source.url);
  if (!videoId) return null;

  log.info("Scraping YouTube", { videoId, title: source.title });

  // Try to get transcript
  let transcript: string | null = null;
  try {
    transcript = await fetchTranscript(videoId);
  } catch {
    log.debug("No transcript available", { videoId });
  }

  // Fetch video page for description
  const description = await fetchYouTubeDescription(videoId);

  // Build content: prefer transcript, fall back to description
  let content: string;
  let hasTranscript = false;
  let lowConfidence = false;

  if (transcript && transcript.length > 200) {
    // Best case: full transcript + description
    content = `Title: ${source.title}\n\nDescription:\n${description}\n\nTranscript:\n${transcript}`;
    hasTranscript = true;
  } else if (description && descriptionHasMaterials(description)) {
    // No transcript but description lists materials — usable
    content = `Title: ${source.title}\n\nDescription:\n${description}`;
    lowConfidence = true;
    log.info("Using YouTube description only (no transcript, but has materials)", { videoId });
  } else {
    // No transcript, thin description — skip
    log.warn("Skipping YouTube video: no transcript and thin description", {
      videoId,
      descLength: String(description?.length ?? 0),
    });
    return null;
  }

  // Extract channel name from title (Brave format: "Title - Channel")
  const creator = extractChannelFromTitle(source.title);

  return {
    url: source.url,
    title: source.title,
    sourceType: "youtube",
    content: content.slice(0, V2_CONFIG.scraping.contentCap),
    materialsHtml: null,
    creator,
    platform: "YouTube",
    videoId,
    hasTranscript,
    inlineImages: [],
    lowConfidence,
  };
}

// ─── Web Scraping ──────────────────────────────────────────────────────────

async function scrapeWebSource(
  source: DiscoveredSource
): Promise<ScrapedSource | null> {
  log.info("Scraping web", { url: source.url });

  const html = await fetchPage(source.url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, footer, .sidebar, .widget, .ad, .advertisement, .comments, .social-share, header, .related-posts"
  ).remove();

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    source.title;

  // Extract main content
  const contentSelectors = [
    "article", ".post-content", ".entry-content", ".article-content",
    ".content", "main", "#content", ".post",
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
    content = $("body").text().replace(/\s+/g, " ").trim();
  }

  // Extract structured materials section (HTML preserved)
  let materialsHtml: string | null = null;
  const materialsSelectors = [
    ".recipe-materials", ".materials-list", ".recipe-card",
    ".recipe", ".ingredients", ".materials",
  ];

  for (const selector of materialsSelectors) {
    const el = $(selector).first();
    if (el.length) {
      materialsHtml = el.html();
      break;
    }
  }

  // Also check tables that look like materials tables
  if (!materialsHtml) {
    $("table").each((_: number, el: cheerio.Element) => {
      const tableText = $(el).text().toLowerCase();
      if (
        (tableText.includes("hook") || tableText.includes("thread")) &&
        (tableText.includes("material") || tableText.includes("body") || tableText.includes("tail"))
      ) {
        materialsHtml = $(el).html();
      }
    });
  }

  // Extract inline images
  const inlineImages = extractInlineImages($, source.url);

  // Extract author
  const authorSelectors = [".author", ".byline", '[rel="author"]', ".post-author"];
  let creator: string | null = null;
  for (const selector of authorSelectors) {
    const text = $(selector).first().text().trim();
    if (text && text.length < 100) {
      creator = text;
      break;
    }
  }

  // Determine platform from URL
  const hostname = new URL(source.url).hostname.replace("www.", "");

  return {
    url: source.url,
    title,
    sourceType: "web",
    content: content.slice(0, V2_CONFIG.scraping.contentCap),
    materialsHtml,
    creator,
    platform: hostname,
    videoId: null,
    hasTranscript: false,
    inlineImages,
    lowConfidence: content.length < 500,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  await rateLimit();

  try {
    const response = await retry(
      async () => {
        const res = await fetch(url, {
          headers: {
            "User-Agent": V2_CONFIG.scraping.userAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(V2_CONFIG.scraping.timeoutMs),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
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

async function fetchYouTubeDescription(videoId: string): Promise<string> {
  await rateLimit();

  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(V2_CONFIG.scraping.timeoutMs),
    });

    if (!res.ok) return "";

    const html = await res.text();

    // Extract description from YouTube page JSON
    const descMatch = html.match(
      /"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/
    );

    if (descMatch?.[1]) {
      return descMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }

    return "";
  } catch {
    return "";
  }
}

function descriptionHasMaterials(description: string): boolean {
  const lower = description.toLowerCase();
  const materialKeywords = ["hook", "thread", "tail", "body", "hackle", "wing", "dubbing", "bead"];
  const matches = materialKeywords.filter((kw) => lower.includes(kw)).length;
  return matches >= 3; // At least 3 material keywords = likely has a recipe
}

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

function extractChannelFromTitle(title: string): string {
  const cleaned = title.replace(/\s*[-–]\s*YouTube$/i, "");
  const parts = cleaned.split(/\s*[-–]\s*/);
  return parts.length > 1 ? parts[parts.length - 1]!.trim() : "";
}

function extractInlineImages($: cheerio.CheerioAPI, pageUrl: string): InlineImage[] {
  const images: InlineImage[] = [];
  const seen = new Set<string>();

  $("img").each((_: number, el: cheerio.Element) => {
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src");

    if (!src || seen.has(src)) return;

    // Resolve relative URLs
    let fullUrl: string;
    try {
      fullUrl = src.startsWith("http") ? src : new URL(src, pageUrl).toString();
    } catch {
      return;
    }

    // Skip junk images
    const lower = fullUrl.toLowerCase();
    if (
      lower.includes("logo") ||
      lower.includes("icon") ||
      lower.includes("avatar") ||
      lower.includes("pixel") ||
      lower.includes(".svg") ||
      lower.includes("placeholder")
    ) {
      return;
    }

    // Skip tiny images
    const width = parseInt($(el).attr("width") || "0", 10);
    const height = parseInt($(el).attr("height") || "0", 10);
    if ((width > 0 && width < 150) || (height > 0 && height < 100)) return;

    seen.add(src);
    images.push({
      url: fullUrl,
      alt: $(el).attr("alt") || "",
      caption: $(el).attr("title") || $(el).attr("alt") || "",
    });
  });

  return images;
}
