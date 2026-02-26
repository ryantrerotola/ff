import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");
  const state = request.nextUrl.searchParams.get("state");

  const where: Record<string, unknown> = {
    latitude: { not: null },
    longitude: { not: null },
  };

  if (region) where.region = { contains: region, mode: "insensitive" };
  if (state) where.state = { equals: state, mode: "insensitive" };

  const reports = await withRetry(() =>
    prisma.fishingReport.findMany({
      where,
      orderBy: { reportDate: "desc" },
      take: 200,
    })
  );

  // Get distinct regions and states for filter dropdowns
  const [regions, states] = await withRetry(() =>
    Promise.all([
      prisma.fishingReport.findMany({
        select: { region: true },
        distinct: ["region"],
        orderBy: { region: "asc" },
      }),
      prisma.fishingReport.findMany({
        where: { state: { not: null } },
        select: { state: true },
        distinct: ["state"],
        orderBy: { state: "asc" },
      }),
    ])
  );

  return NextResponse.json({
    reports,
    filters: {
      regions: regions.map((r) => r.region),
      states: states.map((s) => s.state).filter(Boolean),
    },
  });
}
