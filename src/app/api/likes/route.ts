import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const flyPatternId = request.nextUrl.searchParams.get("flyPatternId");

  if (!flyPatternId) {
    return NextResponse.json(
      { error: "flyPatternId is required" },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();

  const [count, liked] = await Promise.all([
    prisma.like.count({ where: { flyPatternId } }),
    user
      ? prisma.like.findUnique({
          where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
        })
      : null,
  ]);

  return NextResponse.json({ count, liked: !!liked });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { flyPatternId } = await request.json();

  if (!flyPatternId) {
    return NextResponse.json(
      { error: "flyPatternId is required" },
      { status: 400 },
    );
  }

  const existing = await prisma.like.findUnique({
    where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const count = await prisma.like.count({ where: { flyPatternId } });
    return NextResponse.json({ count, liked: false });
  }

  await prisma.like.create({
    data: { userId: user.id, flyPatternId },
  });

  const count = await prisma.like.count({ where: { flyPatternId } });
  return NextResponse.json({ count, liked: true });
}
