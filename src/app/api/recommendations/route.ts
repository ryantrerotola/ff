import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const monthParam = request.nextUrl.searchParams.get("month");
  const region = request.nextUrl.searchParams.get("region");

  // Default to current month if not provided
  const month = monthParam ? Number(monthParam) : new Date().getMonth() + 1;

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Month must be a number between 1 and 12" },
      { status: 400 },
    );
  }

  const where: Record<string, unknown> = { month };
  if (region) {
    where.region = { contains: region, mode: "insensitive" };
  }

  const hatches = await prisma.hatchEntry.findMany({
    where,
    include: {
      flyPattern: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ insectName: "asc" }],
    take: 50,
  });

  return NextResponse.json({
    month,
    region: region || null,
    hatches: hatches.map((h) => ({
      id: h.id,
      species: h.species,
      insectName: h.insectName,
      insectType: h.insectType,
      pattern: h.flyPattern
        ? { id: h.flyPattern.id, name: h.flyPattern.name, slug: h.flyPattern.slug }
        : { id: null, name: h.patternName, slug: null },
      timeOfDay: h.timeOfDay,
      waterBody: h.waterBody,
      region: h.region,
    })),
  });
}
