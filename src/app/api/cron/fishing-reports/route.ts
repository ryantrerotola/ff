import { NextRequest, NextResponse } from "next/server";
import { runFishingReportsPipeline } from "@/pipeline/scrapers/fishing-reports";

/**
 * Cron endpoint for running the fishing reports pipeline.
 * Runs weekly on Mondays at 5:00 AM UTC via Vercel Cron (see vercel.json).
 * Secured with CRON_SECRET env var.
 *
 * Discovers fishing reports from 60+ sources (search sites, RSS feeds,
 * direct pages, Google CSE, Bing), summarizes them with Claude, and
 * upserts both FishingReport and WaterBody records.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runFishingReportsPipeline();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Fishing reports cron failed:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}

// Also allow POST for external schedulers
export async function POST(request: NextRequest) {
  return GET(request);
}

// Vercel cron jobs have a 60-second timeout on Hobby plan.
// If you're on Pro, it extends to 300s. For the full pipeline (~20 min),
// consider using Vercel's maxDuration or an external scheduler.
export const maxDuration = 300;
