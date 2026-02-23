import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStagedExtractions, getPipelineStats } from "@/services/staged.service";
import { paginationSchema } from "@/lib/validation";
import type { StagedStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status") as StagedStatus | null;
  const slug = searchParams.get("slug") ?? undefined;
  const minConfidence = searchParams.get("minConfidence")
    ? parseFloat(searchParams.get("minConfidence")!)
    : undefined;
  const pagination = paginationSchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });
  const page = pagination.success ? pagination.data.page : 1;
  const limit = pagination.success ? pagination.data.limit : 20;
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
