import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const newsArticleId = request.nextUrl.searchParams.get("newsArticleId");
  if (!newsArticleId) {
    return NextResponse.json({ error: "newsArticleId required" }, { status: 400 });
  }

  const comments = await prisma.newsComment.findMany({
    where: { newsArticleId },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
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

  const { newsArticleId, content } = await request.json();
  if (!newsArticleId || !content?.trim()) {
    return NextResponse.json({ error: "newsArticleId and content required" }, { status: 400 });
  }

  const comment = await prisma.newsComment.create({
    data: { userId: user.id, newsArticleId, content: content.slice(0, 2000) },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
