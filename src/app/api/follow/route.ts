import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();

  const [followersCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    currentUser
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.id,
              followingId: userId,
            },
          },
        })
      : null,
  ]);

  return NextResponse.json({
    followersCount,
    followingCount,
    isFollowing: !!isFollowing,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: user.id, followingId: userId },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFollowing: false });
  }

  await prisma.follow.create({
    data: { followerId: user.id, followingId: userId },
  });

  await createNotification(
    userId,
    "follow",
    "New follower",
    `${user.displayName || user.username} started following you`,
    `/profile/${user.username}`,
  );

  return NextResponse.json({ isFollowing: true });
}
