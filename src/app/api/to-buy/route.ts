import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const addSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999).default(1),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const items = await prisma.shoppingCartItem.findMany({
    where: { userId: user.id },
    include: {
      material: {
        include: {
          affiliateLinks: true,
        },
      },
    },
    orderBy: [{ purchased: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
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

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Verify material exists
  const material = await prisma.material.findUnique({
    where: { id: parsed.data.materialId },
  });
  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  // Upsert: if material already in cart, update
  const item = await prisma.shoppingCartItem.upsert({
    where: {
      userId_materialId: {
        userId: user.id,
        materialId: parsed.data.materialId,
      },
    },
    create: {
      userId: user.id,
      materialId: parsed.data.materialId,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes ?? null,
    },
    update: {
      quantity: parsed.data.quantity,
      notes: parsed.data.notes ?? null,
      purchased: false,
    },
    include: {
      material: true,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
