import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PAGE_SIZE = 50; // entries per page (by water body groups)

/** Waterway names we never want to display */
function isValidWaterBody(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return !!lower && !lower.includes("unknown") && lower !== "n/a" && lower !== "tbd";
}

export async function GET(request: NextRequest) {
  const waterBody = request.nextUrl.searchParams.get("waterBody");
  const region = request.nextUrl.searchParams.get("region");
  const month = request.nextUrl.searchParams.get("month");
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));

  const where: Record<string, unknown> = {};
  if (waterBody) where.waterBody = { contains: waterBody, mode: "insensitive" };
  if (region) where.region = { contains: region, mode: "insensitive" };
  if (month) where.month = Number(month);

  // Always exclude UNKNOWN / invalid waterways
  if (!where.waterBody) {
    where.waterBody = { not: { contains: "unknown", mode: "insensitive" } };
  }

  // Get distinct water bodies that match the filters (for pagination)
  const allWaterBodies = await withRetry(() =>
    prisma.hatchEntry.findMany({
      where,
      select: { waterBody: true },
      distinct: ["waterBody"],
      orderBy: { waterBody: "asc" },
    }),
  );

  const validWaterBodies = allWaterBodies
    .map((w) => w.waterBody)
    .filter(isValidWaterBody);

  const totalWaterBodies = validWaterBodies.length;
  const totalPages = Math.max(1, Math.ceil(totalWaterBodies / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Paginate by water body name
  const pageWaterBodies = validWaterBodies.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const entries = pageWaterBodies.length > 0
    ? await withRetry(() =>
        prisma.hatchEntry.findMany({
          where: {
            ...where,
            waterBody: { in: pageWaterBodies },
          },
          include: {
            flyPattern: { select: { id: true, name: true, slug: true } },
            submittedBy: { select: { username: true, displayName: true } },
          },
          orderBy: [{ waterBody: "asc" }, { month: "asc" }, { insectName: "asc" }],
        }),
      )
    : [];

  // Get distinct values for filter dropdowns (excluding invalid waterways)
  const [regions, waterBodiesForFilter] = await withRetry(() =>
    Promise.all([
      prisma.hatchEntry.findMany({ select: { region: true }, distinct: ["region"], orderBy: { region: "asc" } }),
      prisma.hatchEntry.findMany({ select: { waterBody: true }, distinct: ["waterBody"], orderBy: { waterBody: "asc" } }),
    ]),
  );

  return NextResponse.json({
    entries,
    page: safePage,
    totalPages,
    totalWaterBodies,
    filters: {
      regions: regions.map((r) => r.region).filter((r) => r.toLowerCase() !== "unknown"),
      waterBodies: waterBodiesForFilter.map((w) => w.waterBody).filter(isValidWaterBody),
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { waterBody, region, state, month, species, insectName, insectType, patternName, flyPatternId, timeOfDay, targetFish, notes } = body;

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
      targetFish: targetFish || null,
      notes: notes || null,
      submittedById: user.id,
    },
    include: {
      flyPattern: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
