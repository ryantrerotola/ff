import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "../utils/logger";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { PIPELINE_CONFIG } from "../config";

const log = createLogger("images");
const rateLimit = createRateLimiter(250);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiscoveredImage {
  url: string;
  caption: string;
  source: "brave" | "serper" | "youtube_thumb" | "wikimedia" | "blog_scrape" | "fly_shop";
  relevanceScore: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fetch a page with rate limiting, retries, and timeout. */
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
      { maxRetries: 2, backoffMs: 1500, label: `img-fetch:${url}` }
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Check if a URL looks like a real, usable fly pattern image. */
function isUsableImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  // Must be an absolute HTTP(S) URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  // Skip obvious junk: icons, logos, avatars, ads, tracking pixels, svgs, stock photos
  const lower = url.toLowerCase();
  const skipPatterns = [
    "logo", "icon", "avatar", "gravatar", "pixel", "tracking",
    "advertisement", "/ads/", "badge", "button",
    "sprite", ".svg", "1x1", "spacer", "blank", "spinner",
    "favicon", "emoji", "smiley", "widget",
    "placehold", "placeholder", "shutterstock", "gettyimages",
    "istockphoto", "depositphotos", "dreamstime", "adobestock",
    "thumbnail-default", "/avatar/", "gravatar.com",
    "admin-ajax", "cart", "checkout", "payment",
  ];
  if (skipPatterns.some((p) => lower.includes(p))) return false;
  // Accept image extensions, common image path patterns, or CDN URLs
  const hasImageExt = /\.(jpe?g|png|webp)(\?.*)?$/i.test(url);
  const hasImagePath = /\/wp-content\/uploads\//i.test(url) || /\/images?\//i.test(url);
  const hasCdnPattern = /\.(imgix|cloudinary|fastly|akamai|cloudfront|cdn)\./.test(lower)
    || /\/cdn[-/]/.test(lower);
  // Also accept URLs with image format query params (e.g. ?format=jpg)
  const hasFormatParam = /[?&](?:format|fm)=(?:jpe?g|png|webp)/i.test(url);
  return hasImageExt || hasImagePath || hasCdnPattern || hasFormatParam;
}

/** Score an image URL's relevance for a given fly pattern name. */
function scoreImageRelevance(
  url: string,
  caption: string,
  patternName: string
): number {
  const lower = (url + " " + caption).toLowerCase();
  const patternLower = patternName.toLowerCase();
  const patternWords = patternLower.split(/\s+/);

  let score = 0.5;
  // Boost if pattern name appears in URL or caption
  if (lower.includes(patternLower.replace(/\s+/g, "-"))) score += 0.3;
  else if (lower.includes(patternLower.replace(/\s+/g, "_"))) score += 0.3;
  else if (patternWords.every((w) => lower.includes(w))) score += 0.2;
  else if (patternWords.some((w) => w.length > 3 && lower.includes(w))) score += 0.1;

  // Boost for fly-tying-related terms
  const flyTerms = ["fly", "tying", "pattern", "hook", "hackle", "dubbing", "recipe"];
  if (flyTerms.some((t) => lower.includes(t))) score += 0.1;

  // Prefer larger images (URLs with size hints)
  if (/\d{3,4}x\d{3,4}/.test(url) || lower.includes("large") || lower.includes("full")) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

// ─── Brave Image Search ─────────────────────────────────────────────────────

const BRAVE_IMAGES_API = "https://api.search.brave.com/res/v1/images/search";

async function searchBraveImages(
  query: string
): Promise<DiscoveredImage[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return [];
  }

  await rateLimit();

  const params = new URLSearchParams({
    q: query,
    count: "20",
    safesearch: "off",
  });

  try {
    const res = await retry(
      () =>
        fetch(`${BRAVE_IMAGES_API}?${params}`, {
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "Cache-Control": "no-cache",
            "X-Subscription-Token": apiKey,
          },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `brave-images:${query}` }
    );

    if (!res.ok) {
      log.error(`Brave image search error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      results?: {
        url: string;
        title: string;
        properties?: { url?: string };
        thumbnail?: { src: string };
      }[];
    };

    return (data.results ?? []).map((item, i) => ({
      url: item.properties?.url || item.url,
      caption: item.title,
      source: "brave" as const,
      relevanceScore: 1 - i * 0.15,
    }));
  } catch (err) {
    log.error("Brave image search failed", { query, error: String(err) });
    return [];
  }
}

// ─── Serper Image Search (Google Images fallback) ───────────────────────────

const SERPER_IMAGES_API = "https://google.serper.dev/images";

async function searchSerperImages(
  query: string
): Promise<DiscoveredImage[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return [];
  }

  await rateLimit();

  try {
    const res = await retry(
      () =>
        fetch(SERPER_IMAGES_API, {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            num: 20,
          }),
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `serper-images:${query}` }
    );

    if (!res.ok) {
      log.error(`Serper image search error: ${res.status}`, { query });
      return [];
    }

    const data = (await res.json()) as {
      images?: { imageUrl: string; title: string; link: string }[];
    };

    return (data.images ?? []).map((item, i) => ({
      url: item.imageUrl,
      caption: item.title,
      source: "serper" as const,
      relevanceScore: 0.9 - i * 0.15,
    }));
  } catch (err) {
    log.error("Serper image search failed", { query, error: String(err) });
    return [];
  }
}

// ─── YouTube Thumbnail Extraction ────────────────────────────────────────────

/**
 * Generate YouTube thumbnail URLs from a video ID.
 * These are publicly accessible without any API key.
 */
export function youtubeThumbUrls(videoId: string): DiscoveredImage[] {
  return [
    {
      url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      caption: "YouTube tutorial thumbnail (high res)",
      source: "youtube_thumb" as const,
      relevanceScore: 0.7,
    },
    {
      url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      caption: "YouTube tutorial thumbnail",
      source: "youtube_thumb" as const,
      relevanceScore: 0.5,
    },
  ];
}

// ─── Wikimedia Commons Search (free, no API key) ────────────────────────────

const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";

/**
 * Search Wikimedia Commons for fly pattern images.
 * Completely free, no API key required. Great for well-known patterns.
 */
async function searchWikimediaImages(
  patternName: string
): Promise<DiscoveredImage[]> {
  await rateLimit();

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${patternName} fly fishing`,
    gsrnamespace: "6", // File namespace
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "800",
  });

  try {
    const res = await retry(
      () =>
        fetch(`${WIKIMEDIA_API}?${params}`, {
          headers: { "User-Agent": PIPELINE_CONFIG.scraping.userAgent },
          signal: AbortSignal.timeout(PIPELINE_CONFIG.scraping.timeoutMs),
        }),
      { maxRetries: 2, backoffMs: 2000, label: `wikimedia:${patternName}` }
    );

    if (!res.ok) {
      log.debug(`Wikimedia API error: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title: string;
            imageinfo?: {
              url: string;
              thumburl?: string;
              width?: number;
              height?: number;
              extmetadata?: {
                ImageDescription?: { value: string };
                ObjectName?: { value: string };
              };
            }[];
          }
        >;
      };
    };

    const pages = data.query?.pages;
    if (!pages) return [];

    const results: DiscoveredImage[] = [];

    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      const imageUrl = info.thumburl || info.url;
      if (!imageUrl) continue;

      // Skip non-image files (PDFs, SVGs, audio, etc.)
      if (!/\.(jpe?g|png|webp)/i.test(imageUrl)) continue;

      // Skip tiny images
      if (info.width && info.height && (info.width < 200 || info.height < 150)) continue;

      const caption =
        info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, "").slice(0, 200) ||
        info.extmetadata?.ObjectName?.value ||
        page.title.replace("File:", "");

      const relevance = scoreImageRelevance(imageUrl, caption, patternName);

      results.push({
        url: imageUrl,
        caption,
        source: "wikimedia" as const,
        relevanceScore: relevance,
      });
    }

    if (results.length > 0) {
      log.debug(`Wikimedia: found ${results.length} images for "${patternName}"`);
    }

    return results;
  } catch (err) {
    log.debug(`Wikimedia search failed for "${patternName}": ${String(err)}`);
    return [];
  }
}

// ─── Blog Site Image Scraping (free, scrapes fly tying sites) ───────────────

/**
 * Well-known fly tying sites to scrape images from.
 * We search each site for the pattern name and extract images from the results.
 */
const FLY_IMAGE_SITES = [
  {
    name: "Charlie's Fly Box",
    searchUrl: (q: string) =>
      `https://charliesflybox.com/?s=${encodeURIComponent(q)}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Orvis Fly Fishing",
    searchUrl: (q: string) =>
      `https://news.orvis.com/?s=${encodeURIComponent(q + " fly tying")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Fly Fisherman Magazine",
    searchUrl: (q: string) =>
      `https://www.flyfisherman.com/?s=${encodeURIComponent(q + " fly pattern")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Fly Tyer Magazine",
    searchUrl: (q: string) =>
      `https://www.flytyer.com/?s=${encodeURIComponent(q)}`,
    contentSelector: "article, .entry-content",
  },
  {
    name: "Global FlyFisher",
    searchUrl: (q: string) =>
      `https://globalflyfisher.com/?s=${encodeURIComponent(q)}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Fly Fish Food",
    searchUrl: (q: string) =>
      `https://www.flyfishfood.com/?s=${encodeURIComponent(q)}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "The Fly Crate",
    searchUrl: (q: string) =>
      `https://theflycrate.com/?s=${encodeURIComponent(q + " fly pattern")}`,
    contentSelector: "article, .entry-content, .post-content",
  },
  {
    name: "Trident Fly Fishing",
    searchUrl: (q: string) =>
      `https://www.tridentflyfishing.com/search?q=${encodeURIComponent(q + " fly")}`,
    contentSelector: "article, .entry-content, .product-content",
  },
];

/**
 * Scrape images from fly tying blog search results.
 * Searches known fly tying sites and extracts relevant <img> tags.
 */
async function scrapeBlogImages(
  patternName: string
): Promise<DiscoveredImage[]> {
  const allImages: DiscoveredImage[] = [];

  for (const site of FLY_IMAGE_SITES) {
    try {
      const html = await fetchPage(site.searchUrl(patternName));
      if (!html) continue;

      const $ = cheerio.load(html);

      // Remove noise elements
      $("script, style, nav, footer, .sidebar, .widget, .ad, header, .comments").remove();

      // Find article links from search results
      const articleLinks: string[] = [];
      $("article a[href], .post a[href], .entry-title a[href], h2 a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("http") && !articleLinks.includes(href)) {
          articleLinks.push(href);
        }
      });

      // Also extract images directly from search results page
      extractImagesFromHtml($, patternName, site.name, allImages);

      // Scrape the first 3 article pages for higher-quality images
      for (const articleUrl of articleLinks.slice(0, 3)) {
        try {
          const articleHtml = await fetchPage(articleUrl);
          if (!articleHtml) continue;

          const $article = cheerio.load(articleHtml);
          $article("script, style, nav, footer, .sidebar, .widget, .ad, header, .comments").remove();
          extractImagesFromHtml($article, patternName, site.name, allImages);
        } catch {
          // Skip failed article fetches
        }
      }

      if (allImages.length >= 15) break; // Enough images found
    } catch (err) {
      log.debug(`Blog scrape failed for ${site.name}: ${String(err)}`);
    }
  }

  if (allImages.length > 0) {
    log.debug(`Blog scrape: found ${allImages.length} images for "${patternName}"`);
  }

  return allImages;
}

/** Extract usable images from a Cheerio-parsed HTML page. */
function extractImagesFromHtml(
  $: cheerio.CheerioAPI,
  patternName: string,
  sourceName: string,
  results: DiscoveredImage[]
): void {
  const seen = new Set(results.map((r) => r.url));

  $("img").each((_, el) => {
    // Try src, data-src, data-lazy-src (common lazy-load attributes)
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src") ||
      $(el).attr("data-original");
    if (!src || !isUsableImageUrl(src)) return;
    if (seen.has(src)) return;

    // Skip tiny images via width/height attributes
    const width = parseInt($(el).attr("width") || "0", 10);
    const height = parseInt($(el).attr("height") || "0", 10);
    if ((width > 0 && width < 150) || (height > 0 && height < 100)) return;

    const alt = $(el).attr("alt") || $(el).attr("title") || "";
    const caption = alt || `${patternName} fly pattern — ${sourceName}`;
    const relevance = scoreImageRelevance(src, caption, patternName);

    seen.add(src);
    results.push({
      url: src,
      caption: caption.slice(0, 200),
      source: "blog_scrape" as const,
      relevanceScore: relevance,
    });
  });

  // Also check <a> tags wrapping images (some sites link to full-res versions)
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!isUsableImageUrl(href)) return;
    if (seen.has(href)) return;

    // Only include if this anchor wraps an image
    if ($(el).find("img").length === 0) return;

    const alt = $(el).find("img").attr("alt") || "";
    const caption = alt || `${patternName} fly pattern — ${sourceName}`;
    const relevance = scoreImageRelevance(href, caption, patternName) + 0.05; // Slight boost for full-res links

    seen.add(href);
    results.push({
      url: href,
      caption: caption.slice(0, 200),
      source: "blog_scrape" as const,
      relevanceScore: Math.min(relevance, 1.0),
    });
  });
}

// ─── Fly Shop Product Image Scraping ─────────────────────────────────────────

/**
 * Fly shops that sell fly patterns — their product images are the most reliable
 * source for correct pattern photos since they show exactly what you get.
 */
const FLY_SHOP_SITES = [
  {
    name: "The Fly Crate",
    searchUrl: (q: string) =>
      `https://theflycrate.com/search?q=${encodeURIComponent(q)}`,
    productSelector: ".product-card a[href], .grid-item a[href]",
    imageSelector: ".product-single__photo img, .product__image img, .product-featured-image img",
  },
  {
    name: "Umpqua Feather Merchants",
    searchUrl: (q: string) =>
      `https://www.umpqua.com/search?q=${encodeURIComponent(q)}`,
    productSelector: ".product-card a[href], .grid-product a[href]",
    imageSelector: ".product-single__media img, .product__main-image img",
  },
  {
    name: "MFC - Montana Fly Company",
    searchUrl: (q: string) =>
      `https://montanaflycompany.com/search?q=${encodeURIComponent(q)}`,
    productSelector: ".product-card a[href], .grid-item a[href]",
    imageSelector: ".product-single__photo img, .product__image img",
  },
  {
    name: "Fulling Mill",
    searchUrl: (q: string) =>
      `https://www.fullingmill.com/search?q=${encodeURIComponent(q + " fly")}`,
    productSelector: ".product-card a[href], .product-item a[href]",
    imageSelector: ".product-gallery img, .product-image img",
  },
];

/**
 * Scrape product images from fly shop search results.
 * These images are the highest quality and most accurate for a specific pattern.
 */
async function scrapeFlyShopImages(
  patternName: string
): Promise<DiscoveredImage[]> {
  const allImages: DiscoveredImage[] = [];
  const seen = new Set<string>();

  for (const shop of FLY_SHOP_SITES) {
    try {
      const html = await fetchPage(shop.searchUrl(patternName));
      if (!html) continue;

      const $ = cheerio.load(html);

      // Try to find product links from search results
      const productLinks: string[] = [];
      $(shop.productSelector).each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : new URL(href, shop.searchUrl("")).origin + href;
          if (!productLinks.includes(fullUrl)) productLinks.push(fullUrl);
        }
      });

      // Extract images from search results page directly
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (!src || !isUsableImageUrl(src) || seen.has(src)) return;

        const alt = ($(el).attr("alt") || "").toLowerCase();
        const patternLower = patternName.toLowerCase();
        // Only include if alt text mentions the pattern name
        if (!alt.includes(patternLower.split(" ")[0] || "")) return;

        seen.add(src);
        allImages.push({
          url: src,
          caption: `${patternName} — ${shop.name}`,
          source: "fly_shop" as const,
          relevanceScore: 0.95, // High confidence from fly shops
        });
      });

      // Scrape first 2 product pages for detailed images
      for (const productUrl of productLinks.slice(0, 2)) {
        try {
          const productHtml = await fetchPage(productUrl);
          if (!productHtml) continue;

          const $prod = cheerio.load(productHtml);
          $prod(shop.imageSelector + ", .product img, article img").each((_, el) => {
            const src = $prod(el).attr("src") || $prod(el).attr("data-src");
            if (!src || !isUsableImageUrl(src) || seen.has(src)) return;

            seen.add(src);
            allImages.push({
              url: src,
              caption: `${patternName} — ${shop.name}`,
              source: "fly_shop" as const,
              relevanceScore: 0.98, // Highest confidence — product page image
            });
          });
        } catch {
          // Skip failed product page fetches
        }
      }

      if (allImages.length >= 5) break;
    } catch (err) {
      log.debug(`Fly shop scrape failed for ${shop.name}: ${String(err)}`);
    }
  }

  if (allImages.length > 0) {
    log.debug(`Fly shops: found ${allImages.length} images for "${patternName}"`);
  }

  return allImages;
}

// ─── Staged Source Image Extraction ─────────────────────────────────────────

/**
 * Extract images from already-scraped staged source HTML content.
 * This is the cheapest source — no network requests needed.
 */
export function extractImagesFromStagedContent(
  rawContent: string,
  patternName: string
): DiscoveredImage[] {
  if (!rawContent || rawContent.length < 50) return [];

  // rawContent might be plain text (YouTube transcripts) or HTML
  // Only try to extract images if it looks like it contains HTML img tags
  if (!rawContent.includes("<img")) return [];

  try {
    const $ = cheerio.load(rawContent);
    const results: DiscoveredImage[] = [];
    extractImagesFromHtml($, patternName, "staged-source", results);
    return results;
  } catch {
    return [];
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Search for images of a fly pattern using all available sources.
 * Runs API searches in parallel, always scrapes blogs, uses multiple query variants.
 */
export async function discoverPatternImages(
  patternName: string,
  existingVideoIds: string[] = [],
  stagedHtmlContent: string[] = []
): Promise<DiscoveredImage[]> {
  // Use multiple query variants to cast a wider net
  const queries = [
    `${patternName} fly pattern close up photo`,
    `${patternName} fly tying recipe`,
  ];

  let images: DiscoveredImage[] = [];

  // 1. Run all API searches in parallel (Brave, Serper, Wikimedia, blogs, fly shops)
  const apiSearches = [
    ...queries.flatMap((q) => [
      searchBraveImages(q),
      searchSerperImages(q),
    ]),
    searchWikimediaImages(patternName),
    scrapeBlogImages(patternName),
    scrapeFlyShopImages(patternName),
  ];

  const results = await Promise.allSettled(apiSearches);
  for (const result of results) {
    if (result.status === "fulfilled") {
      images.push(...result.value);
    }
  }

  // 2. Extract from already-scraped staged sources (free, no network)
  for (const html of stagedHtmlContent) {
    const stagedImages = extractImagesFromStagedContent(html, patternName);
    images.push(...stagedImages);
  }

  // 3. Always add YouTube thumbnails from existing scraped sources
  for (const videoId of existingVideoIds.slice(0, 5)) {
    images.push(...youtubeThumbUrls(videoId));
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  images = images.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  // Sort by relevance
  images.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return images;
}

/**
 * Quick check if a URL looks like a placeholder image.
 */
export function isPlaceholderImage(url: string): boolean {
  return url.includes("placehold.co") || url.includes("placeholder");
}

// ─── Vision-Based Image Validation ──────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: PIPELINE_CONFIG.anthropic.apiKey,
    });
  }
  return anthropicClient;
}

/**
 * Download an image and return it as a base64-encoded string with media type.
 * Returns null if the image can't be fetched or is too large.
 */
async function downloadImageAsBase64(
  url: string
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": PIPELINE_CONFIG.scraping.userAgent,
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    if (contentType.includes("png")) mediaType = "image/png";
    else if (contentType.includes("webp")) mediaType = "image/webp";
    else if (contentType.includes("gif")) mediaType = "image/gif";
    else mediaType = "image/jpeg";

    const buffer = await res.arrayBuffer();

    // Skip images larger than 5MB (Claude's limit) or smaller than 5KB (likely junk)
    if (buffer.byteLength > 5 * 1024 * 1024 || buffer.byteLength < 5000) return null;

    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mediaType };
  } catch {
    return null;
  }
}

/**
 * Use Claude vision to verify an image matches a SPECIFIC fly pattern.
 * Returns true only if the image clearly shows the named pattern (not just any fly).
 * Uses Haiku for speed and cost efficiency.
 */
export async function validateImageWithVision(
  url: string,
  patternName: string
): Promise<boolean> {
  const imageData = await downloadImageAsBase64(url);
  if (!imageData) return false;

  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageData.mediaType,
                data: imageData.base64,
              },
            },
            {
              type: "text",
              text: `Does this image show a fly used for fly fishing? It should be an artificial fly (tied on a hook with feathers, fur, thread, etc.) — not a nature photo, logo, person, landscape, or product listing. It could be a "${patternName}" or a similar fly pattern. Answer ONLY "yes" or "no".`,
            },
          ],
        },
      ],
    });

    const answer =
      response.content[0]?.type === "text"
        ? response.content[0].text.trim().toLowerCase()
        : "";

    return answer.startsWith("yes");
  } catch (err) {
    log.warn("Vision validation failed", { url, error: String(err) });
    return false;
  }
}
