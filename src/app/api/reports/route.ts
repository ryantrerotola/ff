import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { targetType, targetId, reason, description } = parsed.data;

  // Check for duplicate report from same user
  const existing = await prisma.contentReport.findFirst({
    where: {
      reporterId: user.id,
      targetType,
      targetId,
      status: "pending",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reported this content" },
      { status: 409 },
    );
  }

  const report = await prisma.contentReport.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      description,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "pending";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

  const where = status === "all" ? {} : { status: status as "pending" | "reviewed" | "dismissed" | "actioned" };

  const [reports, total] = await Promise.all([
    prisma.contentReport.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentReport.count({ where }),
  ]);

  return NextResponse.json({
    data: reports,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
