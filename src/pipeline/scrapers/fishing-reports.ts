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
  summary: string;
  conditions: string | null;
  reportDate: string;
  sourceUrls: string[];
  sourceTitles: string[];
}

// ─── Well-known fishing report sources ──────────────────────────────────────

interface ReportSite {
  name: string;
  searchUrl: (query: string) => string;
  contentSelector: string;
  dateSelector: string;
}

const REPORT_SITES: ReportSite[] = [
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
];

// ─── General search queries for broad fishing report discovery ──────────────

export const GENERAL_REPORT_QUERIES = [
  "fly fishing report this week",
  "trout fishing conditions report",
  "fly fishing river conditions update",
  "western fly fishing report",
  "northeast fly fishing report",
  "tailwater fishing conditions",
  "spring creek fishing report",
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

      const $a = cheerio.load(articleHtml);
      $a(
        "script, style, nav, footer, .sidebar, .widget, .ad, .comments, .related-posts, .social-share"
      ).remove();

      const title = $a("h1").first().text().trim();
      const content = $a(site.contentSelector)
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (!title || content.length < 200) continue;

      // Try to find a date
      let publishDate: string | null = null;
      const dateEl = $a(site.dateSelector).first();
      const datetime =
        dateEl.attr("datetime") || dateEl.text().trim();
      if (datetime) {
        const parsed = new Date(datetime);
        if (!isNaN(parsed.getTime())) {
          publishDate = parsed.toISOString();
        }
      }

      reports.push({
        url: articleUrl,
        title,
        content: content.slice(0, 10000),
        siteName: site.name,
        publishDate,
      });
    } catch {
      // Skip failed articles
    }
  }

  return reports;
}

/**
 * Discover fishing reports across all configured sites.
 */
export async function discoverFishingReports(
  query: string
): Promise<ScrapedReport[]> {
  const allReports: ScrapedReport[] = [];

  for (const site of REPORT_SITES) {
    try {
      const reports = await searchReportSite(site, query);
      allReports.push(...reports);
      log.info(`Found ${reports.length} reports from ${site.name}`, {
        query,
      });
    } catch (err) {
      log.warn(`Failed to search ${site.name}`, { error: String(err) });
    }
  }

  return allReports;
}

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
      "summary",
      "reportDate",
    ],
    properties: {
      waterBody: {
        type: "string" as const,
        description: "Name of the body of water (e.g., 'South Platte River')",
      },
      region: {
        type: "string" as const,
        description:
          "Geographic region (e.g., 'Rocky Mountains', 'Northeast', 'Pacific Northwest', 'Mid-South', 'Great Lakes', 'Saltwater')",
      },
      state: {
        type: "string" as const,
        description: "Two-letter US state abbreviation (e.g., 'CO')",
      },
      latitude: {
        type: "number" as const,
        description: "Approximate latitude of the water body",
      },
      longitude: {
        type: "number" as const,
        description: "Approximate longitude of the water body",
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
    : "Identify the primary body of water these reports are about and provide its details.";

  try {
    const response = await client.messages.create({
      model: PIPELINE_CONFIG.anthropic.model,
      max_tokens: 1024,
      system: `You are a fly fishing expert summarizing fishing reports. Extract actionable intel for anglers: what's hatching, what flies are working, water conditions, and overall fishing quality. Be concise and practical. ${waterContext}`,
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
