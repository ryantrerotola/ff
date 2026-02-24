import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const waterBody = request.nextUrl.searchParams.get("waterBody");
  const region = request.nextUrl.searchParams.get("region");
  const month = request.nextUrl.searchParams.get("month");
  const species = request.nextUrl.searchParams.get("species");

  const where: Record<string, unknown> = {};
  if (waterBody) where.waterBody = { contains: waterBody, mode: "insensitive" };
  if (region) where.region = { contains: region, mode: "insensitive" };
  if (month) where.month = Number(month);
  if (species) where.species = { contains: species, mode: "insensitive" };

  const entries = await withRetry(() =>
    prisma.hatchEntry.findMany({
      where,
      include: {
        flyPattern: { select: { id: true, name: true, slug: true } },
        submittedBy: { select: { username: true, displayName: true } },
      },
      orderBy: [{ month: "asc" }, { insectName: "asc" }],
      take: 100,
    }),
  );

  // Get distinct values for filter dropdowns
  const [regions, waterBodies, speciesList] = await withRetry(() =>
    Promise.all([
      prisma.hatchEntry.findMany({ select: { region: true }, distinct: ["region"], orderBy: { region: "asc" } }),
      prisma.hatchEntry.findMany({ select: { waterBody: true }, distinct: ["waterBody"], orderBy: { waterBody: "asc" } }),
      prisma.hatchEntry.findMany({ select: { species: true }, distinct: ["species"], orderBy: { species: "asc" } }),
    ]),
  );

  return NextResponse.json({
    entries,
    filters: {
      regions: regions.map((r) => r.region),
      waterBodies: waterBodies.map((w) => w.waterBody),
      species: speciesList.map((s) => s.species),
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { waterBody, region, state, month, species, insectName, insectType, patternName, flyPatternId, timeOfDay, notes } = body;

  if (!waterBody || !region || !month || !species || !insectName || !insectType || !patternName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (typeof month !== "number" || month < 1 || month > 12) {
    return NextResponse.json({ error: "Month must be 1-12" }, { status: 400 });
  }

  const entry = await prisma.hatchEntry.create({
    data: {
      waterBody,
      region,
      state: state || null,
      month,
      species,
      insectName,
      insectType,
      patternName,
      flyPatternId: flyPatternId || null,
      timeOfDay: timeOfDay || null,
      notes: notes || null,
      submittedById: user.id,
    },
    include: {
      flyPattern: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
