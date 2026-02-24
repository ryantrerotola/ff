import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where: Prisma.TyingTechniqueWhereInput = {};

  if (category) {
    const validCategories = [
      "fundamentals",
      "thread_work",
      "materials_prep",
      "body_techniques",
      "hackle_techniques",
      "wing_techniques",
      "head_finishing",
      "specialty",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 },
      );
    }
    where.category = category as Prisma.EnumTechniqueCategoryFilter["equals"];
  }

  if (difficulty) {
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 },
      );
    }
    where.difficulty =
      difficulty as Prisma.EnumTechniqueDifficultyFilter["equals"];
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const techniques = await withRetry(() =>
    prisma.tyingTechnique.findMany({
      where,
      include: {
        _count: { select: { videos: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  );

  return NextResponse.json({
    techniques: techniques.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      difficulty: t.difficulty,
      description: t.description,
      keyPoints: t.keyPoints,
      videoCount: t._count.videos,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    total: techniques.length,
  });
}
