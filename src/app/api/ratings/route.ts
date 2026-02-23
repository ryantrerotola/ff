import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const flyPatternId = request.nextUrl.searchParams.get("flyPatternId");
  if (!flyPatternId) {
    return NextResponse.json({ error: "flyPatternId required" }, { status: 400 });
  }

  const user = await getCurrentUser();

  const [agg, userRating] = await Promise.all([
    prisma.patternRating.aggregate({
      where: { flyPatternId },
      _avg: { rating: true },
      _count: true,
    }),
    user
      ? prisma.patternRating.findUnique({
          where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
        })
      : null,
  ]);

  return NextResponse.json({
    average: agg._avg.rating ?? 0,
    count: agg._count,
    userRating: userRating?.rating ?? null,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { flyPatternId, rating } = await request.json();

  if (!flyPatternId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.patternRating.upsert({
    where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
    create: { userId: user.id, flyPatternId, rating },
    update: { rating },
  });

  const agg = await prisma.patternRating.aggregate({
    where: { flyPatternId },
    _avg: { rating: true },
    _count: true,
  });

  return NextResponse.json({
    average: agg._avg.rating ?? 0,
    count: agg._count,
    userRating: rating,
  });
}
