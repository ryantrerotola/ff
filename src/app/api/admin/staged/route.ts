import { NextRequest, NextResponse } from "next/server";
import { getStagedExtractions, getPipelineStats } from "@/services/staged.service";
import type { StagedStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status") as StagedStatus | null;
  const slug = searchParams.get("slug") ?? undefined;
  const minConfidence = searchParams.get("minConfidence")
    ? parseFloat(searchParams.get("minConfidence")!)
    : undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const statsOnly = searchParams.get("stats") === "true";

  if (statsOnly) {
    const stats = await getPipelineStats();
    return NextResponse.json(stats);
  }

  const result = await getStagedExtractions({
    status: status ?? undefined,
    slug,
    minConfidence,
    page,
    limit,
  });

  return NextResponse.json(result);
}
