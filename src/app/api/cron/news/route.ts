import { NextRequest, NextResponse } from "next/server";
import { scrapeNews } from "@/pipeline/scrapers/news";

/**
 * Cron endpoint for scraping fly fishing news.
 * Runs daily at 4:00 AM UTC via Vercel Cron (see vercel.json).
 * Secured with CRON_SECRET env var.
 *
 * For external schedulers: POST /api/cron/news with Authorization header.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const count = await scrapeNews();

  return NextResponse.json({
    ok: true,
    articlesProcessed: count,
    timestamp: new Date().toISOString(),
  });
}

// Also allow GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
