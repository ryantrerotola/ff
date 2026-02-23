import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const patternId = searchParams.get("patternId");
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  if (!patternId || !category) {
    return NextResponse.json(
      { error: "Missing required query parameters: patternId, category" },
      { status: 400 }
    );
  }

  // Fetch patterns in the same category, excluding the current one.
  // Order so that patterns with the same difficulty come first.
  const patterns = await prisma.flyPattern.findMany({
    where: {
      category: category as never,
      id: { not: patternId },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      difficulty: true,
      waterType: true,
      description: true,
      _count: {
        select: {
          materials: true,
          variations: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 20, // fetch extra so we can re-sort
  });

  // Re-sort: same difficulty first, then the rest
  const sorted = [...patterns].sort((a, b) => {
    const aMatch = a.difficulty === difficulty ? 0 : 1;
    const bMatch = b.difficulty === difficulty ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(sorted.slice(0, 6));
}
