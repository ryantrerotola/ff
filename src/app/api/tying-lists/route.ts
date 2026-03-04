import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const lists = await prisma.tyingList.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          flyPattern: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(lists);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const list = await prisma.tyingList.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  });

  return NextResponse.json(list, { status: 201 });
}
