import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { slug } = await context.params;

  const pattern = await prisma.flyPattern.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const images = await prisma.patternImage.findMany({
    where: { flyPatternId: pattern.id },
    include: {
      uploadedBy: { select: { username: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(images);
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { slug } = await context.params;

  const pattern = await prisma.flyPattern.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const { url, caption } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const image = await prisma.patternImage.create({
    data: {
      flyPatternId: pattern.id,
      url,
      caption: caption || null,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { username: true } },
    },
  });

  return NextResponse.json(image, { status: 201 });
}
