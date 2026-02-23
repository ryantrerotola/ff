import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const pagination = paginationSchema.safeParse({
    page: request.nextUrl.searchParams.get("page"),
    limit: request.nextUrl.searchParams.get("limit"),
  });
  const page = pagination.success ? pagination.data.page : 1;
  const limit = pagination.success ? pagination.data.limit : 20;
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
