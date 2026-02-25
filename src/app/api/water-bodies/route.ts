import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");
  const state = request.nextUrl.searchParams.get("state");
  const search = request.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (region) where.region = { contains: region, mode: "insensitive" };
  if (state) where.state = { contains: state, mode: "insensitive" };
  if (search) where.name = { contains: search, mode: "insensitive" };

  const waterBodies = await prisma.waterBody.findMany({
    where,
    orderBy: [{ region: "asc" }, { name: "asc" }],
    take: 200,
  });

  return NextResponse.json({ waterBodies });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support single entry or bulk array
    const entries: Array<{
      name: string;
      region: string;
      state?: string;
      waterType?: string;
      latitude?: number;
      longitude?: number;
      description?: string;
    }> = Array.isArray(body) ? body : [body];

    const errors: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!;
      if (!e.name) errors.push(`Entry ${i}: missing name`);
      if (!e.region) errors.push(`Entry ${i}: missing region`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const results: Array<{ name: string; status: string }> = [];

    for (const entry of entries) {
      const slug = slugify(`${entry.name} ${entry.state ?? entry.region}`);

      const existing = await prisma.waterBody.findUnique({
        where: { slug },
      });

      if (existing) {
        skipped++;
        results.push({ name: entry.name, status: "skipped" });
        continue;
      }

      await prisma.waterBody.create({
        data: {
          name: entry.name,
          slug,
          region: entry.region,
          state: entry.state ?? null,
          waterType: entry.waterType ?? "river",
          latitude: entry.latitude ?? null,
          longitude: entry.longitude ?? null,
          description: entry.description ?? null,
        },
      });

      created++;
      results.push({ name: entry.name, status: "created" });
    }

    return NextResponse.json({
      created,
      skipped,
      total: entries.length,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create water bodies", details: String(err) },
      { status: 500 },
    );
  }
}
