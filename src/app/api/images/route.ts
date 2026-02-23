import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const flyPatternId = request.nextUrl.searchParams.get("flyPatternId");
  if (!flyPatternId) {
    return NextResponse.json({ error: "flyPatternId required" }, { status: 400 });
  }

  const images = await prisma.patternImage.findMany({
    where: { flyPatternId },
    include: {
      uploadedBy: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { flyPatternId, url, caption } = await request.json();

  if (!flyPatternId || !url) {
    return NextResponse.json({ error: "flyPatternId and url required" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const image = await prisma.patternImage.create({
    data: {
      flyPatternId,
      url,
      caption: caption || null,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json(image, { status: 201 });
}
