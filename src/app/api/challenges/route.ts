import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const challenge = await prisma.tyingChallenge.findFirst({
    where: { active: true },
    include: {
      flyPattern: {
        select: { id: true, name: true, slug: true },
      },
      entries: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { votes: "desc" },
      },
    },
  });

  return NextResponse.json(challenge);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const challenge = await prisma.tyingChallenge.findFirst({
    where: { active: true },
  });

  if (!challenge) {
    return NextResponse.json(
      { error: "No active challenge" },
      { status: 404 },
    );
  }

  const { imageUrl, caption } = await request.json();

  if (!imageUrl?.trim()) {
    return NextResponse.json(
      { error: "Image URL is required" },
      { status: 400 },
    );
  }

  const existing = await prisma.challengeEntry.findUnique({
    where: {
      challengeId_userId: {
        challengeId: challenge.id,
        userId: user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted an entry for this challenge" },
      { status: 409 },
    );
  }

  const entry = await prisma.challengeEntry.create({
    data: {
      challengeId: challenge.id,
      userId: user.id,
      imageUrl: imageUrl.trim(),
      caption: caption?.trim().slice(0, 500) || null,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
