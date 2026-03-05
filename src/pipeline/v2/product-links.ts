/**
 * V2 Product Links Stage
 *
 * Finds purchase links for materials from J. Stockard and Trident Fly Fishing
 * using Brave site-restricted search.
 */

import { V2_CONFIG } from "./config";
import { createRateLimiter, retry } from "../utils/rate-limit";
import { createLogger } from "../utils/logger";
import { prisma } from "@/lib/prisma";
import type { V2ConsensusMaterial, ProductLink } from "./types";

const log = createLogger("v2:product-links");
const rateLimit = createRateLimiter(V2_CONFIG.productLinks.requestDelayMs);

const BRAVE_WEB_API = "https://api.search.brave.com/res/v1/web/search";

/**
 * Find purchase links for all consensus materials.
 * Checks cache first (existing AffiliateLink entries).
 */
export async function findProductLinks(
  materials: V2ConsensusMaterial[]
): Promise<ProductLink[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log.warn("BRAVE_SEARCH_API_KEY not configured — skipping product links");
    return [];
  }

  const allLinks: ProductLink[] = [];

  for (const material of materials) {
    // Build a search-friendly material name
    const searchName = buildSearchName(material);
    if (!searchName) continue;

    for (const retailer of V2_CONFIG.productLinks.retailers) {
      // Check cache: do we already have a link for this material+retailer?
      const cached = await checkCache(material.name, retailer.name);
      if (cached) {
        allLinks.push({
          materialName: material.name,
          retailer: retailer.name,
          productUrl: cached.url,
          productName: cached.url, // We store URL as product name in cache
          price: null,
        });
        continue;
      }

      // Search Brave
      const query = retailer.searchTemplate.replace("{material}", searchName);
      const link = await searchForProduct(query, apiKey, material.name, retailer.name);

      if (link) {
        allLinks.push(link);
      }
    }
  }

  log.success("Product link search complete", {
    materials: String(materials.length),
    linksFound: String(allLinks.length),
  });

  return allLinks;
}

async function searchForProduct(
  query: string,
  apiKey: string,
  materialName: string,
  retailerName: "j_stockard" | "trident"
): Promise<ProductLink | null> {
  await rateLimit();

  try {
    const params = new URLSearchParams({
      q: query,
      count: "3",
      country: "us",
    });

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
      { maxRetries: 2, backoffMs: 2000, label: `product:${query}` }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      web?: { results?: { url: string; title: string; description?: string }[] };
    };

    const results = data.web?.results;
    if (!results?.length) return null;

    // Take the first result that looks like a product page
    const productResult = results.find((r) => isProductUrl(r.url));
    if (!productResult) return null;

    return {
      materialName,
      retailer: retailerName,
      productUrl: productResult.url,
      productName: productResult.title,
      price: extractPrice(productResult.description ?? ""),
    };
  } catch (err) {
    log.debug("Product search failed", { query, error: String(err) });
    return null;
  }
}

function buildSearchName(material: V2ConsensusMaterial): string | null {
  // Build the best search query from material data
  const parts: string[] = [];

  if (material.brand) parts.push(material.brand);
  if (material.productCode) parts.push(material.productCode);

  if (parts.length === 0) {
    // No brand info — use the full name
    // Skip generic types that won't search well
    if (material.name.length < 5) return null;
    parts.push(material.name);
  }

  // Add type context for generic names
  if (!material.brand && !material.name.toLowerCase().includes(material.type)) {
    parts.push(material.type);
  }

  return parts.join(" ");
}

function isProductUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Skip search/category pages
  if (lower.includes("/search") || lower.includes("/category") || lower.includes("/collections")) {
    return false;
  }
  // Look for product-like URL patterns
  return (
    lower.includes("/product") ||
    lower.includes("/item") ||
    lower.includes("/p/") ||
    // J. Stockard and Trident usually have product pages without /product/ prefix
    /\/[a-z0-9-]+-[a-z0-9]+\/?$/i.test(url)
  );
}

function extractPrice(description: string): string | null {
  const priceMatch = description.match(/\$\d+\.?\d{0,2}/);
  return priceMatch ? priceMatch[0] : null;
}

async function checkCache(
  materialName: string,
  retailer: string
): Promise<{ url: string } | null> {
  try {
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        material: { name: { equals: materialName, mode: "insensitive" } },
        retailer: retailer,
      },
      select: { url: true },
    });
    return existing;
  } catch {
    return null;
  }
}
