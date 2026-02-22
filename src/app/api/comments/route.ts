import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { commentSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const flyPatternId = request.nextUrl.searchParams.get("flyPatternId");

  if (!flyPatternId) {
    return NextResponse.json(
      { error: "flyPatternId is required" },
      { status: 400 },
    );
  }

  const comments = await prisma.comment.findMany({
    where: { flyPatternId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      userId: user.id,
      flyPatternId: parsed.data.flyPatternId,
      content: parsed.data.content,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
