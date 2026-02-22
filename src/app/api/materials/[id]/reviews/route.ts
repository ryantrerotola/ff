import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const reviews = await prisma.materialReview.findMany({
    where: { materialId: id },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const agg = await prisma.materialReview.aggregate({
    where: { materialId: id },
    _avg: { rating: true },
    _count: true,
  });

  return NextResponse.json({
    reviews,
    averageRating: agg._avg.rating ?? 0,
    reviewCount: agg._count,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { rating, title, content } = await request.json();

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !title?.trim() ||
    !content?.trim()
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const review = await prisma.materialReview.create({
    data: {
      userId: user.id,
      materialId: id,
      rating,
      title: title.slice(0, 200),
      content: content.slice(0, 5000),
    },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json(review, { status: 201 });
}
