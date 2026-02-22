import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "20"),
    50,
  );
  const offset = (page - 1) * limit;
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const sort = request.nextUrl.searchParams.get("sort") ?? "recent";

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { summary: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy =
    sort === "trending"
      ? { votes: { _count: "desc" as const } }
      : { publishedAt: "desc" as const };

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      include: {
        _count: { select: { comments: true, votes: true } },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return NextResponse.json({
    data: articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
