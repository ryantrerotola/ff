import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "all";

  const [
    recentComments,
    recentForumPosts,
    recentForumReplies,
    pendingSubmissions,
    userCount,
  ] = await Promise.all([
    type === "all" || type === "comments"
      ? prisma.comment.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            flyPattern: { select: { name: true, slug: true } },
          },
        })
      : [],
    type === "all" || type === "forum"
      ? prisma.forumPost.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            _count: { select: { replies: true } },
          },
        })
      : [],
    type === "all" || type === "forum"
      ? prisma.forumReply.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            post: { select: { id: true, title: true } },
          },
        })
      : [],
    prisma.userSubmittedPattern.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    recentComments,
    recentForumPosts,
    recentForumReplies,
    pendingSubmissions,
    userCount,
  });
}

// Admin actions: delete content, ban user, approve/reject submissions
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, targetType, targetId } = await request.json();

  switch (action) {
    case "delete": {
      if (targetType === "comment") {
        await prisma.comment.delete({ where: { id: targetId } });
      } else if (targetType === "forumPost") {
        await prisma.forumPost.delete({ where: { id: targetId } });
      } else if (targetType === "forumReply") {
        await prisma.forumReply.delete({ where: { id: targetId } });
      } else if (targetType === "newsComment") {
        await prisma.newsComment.delete({ where: { id: targetId } });
      }
      return NextResponse.json({ ok: true });
    }
    case "approve-submission": {
      await prisma.userSubmittedPattern.update({
        where: { id: targetId },
        data: { status: "approved" },
      });
      return NextResponse.json({ ok: true });
    }
    case "reject-submission": {
      await prisma.userSubmittedPattern.update({
        where: { id: targetId },
        data: { status: "rejected" },
      });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
