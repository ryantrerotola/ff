import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search");

  // If searching for materials to add, return matching materials
  if (search !== null) {
    const materials = await prisma.material.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      take: 50,
    });

    // Get user's existing material IDs to mark which ones are already owned
    const ownedIds = new Set(
      (
        await prisma.userMaterial.findMany({
          where: { userId: user.id },
          select: { materialId: true },
        })
      ).map((um) => um.materialId)
    );

    const results = materials.map((m) => ({
      ...m,
      owned: ownedIds.has(m.id),
    }));

    return NextResponse.json({ materials: results });
  }

  // Get the user's material inventory grouped by type
  const userMaterials = await prisma.userMaterial.findMany({
    where: { userId: user.id },
    include: {
      material: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group materials by type
  const grouped: Record<string, Array<{
    id: string;
    materialId: string;
    name: string;
    type: string;
    quantity: string | null;
    notes: string | null;
  }>> = {};

  for (const um of userMaterials) {
    const type = um.material.type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push({
      id: um.id,
      materialId: um.materialId,
      name: um.material.name,
      type: um.material.type,
      quantity: um.quantity,
      notes: um.notes,
    });
  }

  const ownedMaterialIds = userMaterials.map((um) => um.materialId);

  // Find all patterns and their required materials
  const patterns = await prisma.flyPattern.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      materials: {
        where: { required: true },
        select: {
          materialId: true,
          material: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });

  const canTie: Array<{ id: string; name: string; slug: string; category: string }> = [];
  const almostThere: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    totalMaterials: number;
    ownedCount: number;
    missing: Array<{ id: string; name: string; type: string }>;
  }> = [];

  for (const pattern of patterns) {
    if (pattern.materials.length === 0) continue;

    const requiredMaterialIds = pattern.materials.map((m) => m.materialId);
    const ownedForPattern = requiredMaterialIds.filter((id) =>
      ownedMaterialIds.includes(id)
    );
    const missingCount = requiredMaterialIds.length - ownedForPattern.length;

    if (missingCount === 0) {
      canTie.push({
        id: pattern.id,
        name: pattern.name,
        slug: pattern.slug,
        category: pattern.category,
      });
    } else if (ownedForPattern.length > 0 && missingCount <= 3) {
      const missing = pattern.materials
        .filter((m) => !ownedMaterialIds.includes(m.materialId))
        .map((m) => ({
          id: m.material.id,
          name: m.material.name,
          type: m.material.type,
        }));

      almostThere.push({
        id: pattern.id,
        name: pattern.name,
        slug: pattern.slug,
        category: pattern.category,
        totalMaterials: requiredMaterialIds.length,
        ownedCount: ownedForPattern.length,
        missing,
      });
    }
  }

  // Sort "almost there" by how close they are (fewest missing first)
  almostThere.sort((a, b) => a.missing.length - b.missing.length);

  return NextResponse.json({
    inventory: grouped,
    totalMaterials: userMaterials.length,
    canTie,
    almostThere: almostThere.slice(0, 10),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { materialId, quantity, notes } = await request.json();

  if (!materialId) {
    return NextResponse.json(
      { error: "materialId is required" },
      { status: 400 }
    );
  }

  // Verify the material exists
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    return NextResponse.json(
      { error: "Material not found" },
      { status: 404 }
    );
  }

  // Upsert - add or update the user material
  const userMaterial = await prisma.userMaterial.upsert({
    where: {
      userId_materialId: { userId: user.id, materialId },
    },
    update: {
      quantity: quantity ?? undefined,
      notes: notes ?? undefined,
    },
    create: {
      userId: user.id,
      materialId,
      quantity: quantity ?? null,
      notes: notes ?? null,
    },
    include: {
      material: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return NextResponse.json(userMaterial);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { materialId } = await request.json();

  if (!materialId) {
    return NextResponse.json(
      { error: "materialId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.userMaterial.findUnique({
    where: {
      userId_materialId: { userId: user.id, materialId },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Material not in your fly box" },
      { status: 404 }
    );
  }

  await prisma.userMaterial.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true });
}
