import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const newsArticleId = request.nextUrl.searchParams.get("newsArticleId");
  if (!newsArticleId) {
    return NextResponse.json({ error: "newsArticleId required" }, { status: 400 });
  }

  const user = await getCurrentUser();

  const [count, voted] = await Promise.all([
    prisma.newsVote.count({ where: { newsArticleId } }),
    user
      ? prisma.newsVote.findUnique({
          where: {
            userId_newsArticleId: { userId: user.id, newsArticleId },
          },
        })
      : null,
  ]);

  return NextResponse.json({ count, voted: !!voted });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { newsArticleId } = await request.json();
  if (!newsArticleId) {
    return NextResponse.json({ error: "newsArticleId required" }, { status: 400 });
  }

  const existing = await prisma.newsVote.findUnique({
    where: {
      userId_newsArticleId: { userId: user.id, newsArticleId },
    },
  });

  if (existing) {
    await prisma.newsVote.delete({ where: { id: existing.id } });
    const count = await prisma.newsVote.count({ where: { newsArticleId } });
    return NextResponse.json({ count, voted: false });
  }

  await prisma.newsVote.create({
    data: { userId: user.id, newsArticleId },
  });

  const count = await prisma.newsVote.count({ where: { newsArticleId } });
  return NextResponse.json({ count, voted: true });
}
