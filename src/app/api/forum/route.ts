import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { forumPostSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "20"),
    50,
  );
  const offset = (page - 1) * limit;
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const categoryId = request.nextUrl.searchParams.get("categoryId");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.forumPost.count({ where }),
  ]);

  return NextResponse.json({
    data: posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = forumPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const post = await prisma.forumPost.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      categoryId: body.categoryId || null,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
