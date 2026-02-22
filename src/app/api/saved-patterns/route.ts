import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const flyPatternId = request.nextUrl.searchParams.get("flyPatternId");

  // Check if a specific pattern is saved
  if (flyPatternId) {
    const saved = await prisma.savedPattern.findUnique({
      where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
    });
    return NextResponse.json({ saved: !!saved });
  }

  // Return all saved patterns for the user
  const savedPatterns = await prisma.savedPattern.findMany({
    where: { userId: user.id },
    include: {
      flyPattern: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          difficulty: true,
          waterType: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(savedPatterns);
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

  const existing = await prisma.savedPattern.findUnique({
    where: { userId_flyPatternId: { userId: user.id, flyPatternId } },
  });

  if (existing) {
    await prisma.savedPattern.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.savedPattern.create({
    data: { userId: user.id, flyPatternId },
  });

  return NextResponse.json({ saved: true });
}
