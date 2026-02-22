import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          comments: true,
          likes: true,
          forumPosts: true,
          submittedPatterns: true,
        },
      },
      comments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          flyPattern: { select: { name: true, slug: true } },
        },
      },
      forumPosts: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      },
      savedPatterns: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          flyPattern: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
