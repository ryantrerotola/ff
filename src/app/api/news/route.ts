import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "20"),
    50,
  );
  const offset = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.newsArticle.count(),
  ]);

  return NextResponse.json({
    data: articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
