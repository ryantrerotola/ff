import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const addItemSchema = z.object({
  flyPatternId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999).default(1),
  colors: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.tyingList.findFirst({
    where: { id, userId: user.id },
  });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Verify pattern exists
  const pattern = await prisma.flyPattern.findUnique({
    where: { id: parsed.data.flyPatternId },
  });
  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  // Upsert: if pattern already in list, update it
  const item = await prisma.tyingListItem.upsert({
    where: {
      tyingListId_flyPatternId: {
        tyingListId: id,
        flyPatternId: parsed.data.flyPatternId,
      },
    },
    create: {
      tyingListId: id,
      flyPatternId: parsed.data.flyPatternId,
      quantity: parsed.data.quantity,
      colors: parsed.data.colors ?? null,
      notes: parsed.data.notes ?? null,
    },
    update: {
      quantity: parsed.data.quantity,
      colors: parsed.data.colors ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: {
      flyPattern: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
