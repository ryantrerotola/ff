import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(999).optional(),
  colors: z.string().max(500).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, itemId } = await params;

  // Verify ownership
  const list = await prisma.tyingList.findFirst({
    where: { id, userId: user.id },
  });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const item = await prisma.tyingListItem.findFirst({
    where: { id: itemId, tyingListId: id },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updated = await prisma.tyingListItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, itemId } = await params;

  const list = await prisma.tyingList.findFirst({
    where: { id, userId: user.id },
  });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const item = await prisma.tyingListItem.findFirst({
    where: { id: itemId, tyingListId: id },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.tyingListItem.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
}
