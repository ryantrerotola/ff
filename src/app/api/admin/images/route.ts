import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const deleteSchema = z.object({
  imageId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 50)));
  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  const where = search
    ? {
        flyPattern: {
          name: { contains: search, mode: "insensitive" as const },
        },
      }
    : {};

  const [images, total] = await Promise.all([
    prisma.patternImage.findMany({
      where,
      include: {
        flyPattern: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patternImage.count({ where }),
  ]);

  return NextResponse.json({ images, total, page, limit });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    await prisma.patternImage.delete({ where: { id: parsed.data.imageId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = String(err);
    if (message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
