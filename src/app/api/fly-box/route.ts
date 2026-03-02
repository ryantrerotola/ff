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

  const ownedMaterialIds = new Set(userMaterials.map((um) => um.materialId));

  // Group owned materials by type for flexible matching
  const ownedByType: Record<string, string[]> = {};
  for (const um of userMaterials) {
    const type = um.material.type;
    if (!ownedByType[type]) ownedByType[type] = [];
    ownedByType[type].push(um.materialId);
  }

  // Types where any material of the same type is considered interchangeable
  // (e.g., any thread can substitute for another thread, flash is interchangeable)
  const FLEXIBLE_TYPES = new Set(["thread", "weight", "bead"]);

  // Load substitutions for smarter matching
  const substitutions = await prisma.materialSubstitution.findMany({
    select: { materialId: true, substituteMaterialId: true },
  });
  const subMap = new Map<string, Set<string>>();
  for (const sub of substitutions) {
    if (!subMap.has(sub.materialId)) subMap.set(sub.materialId, new Set());
    subMap.get(sub.materialId)!.add(sub.substituteMaterialId);
    // Bidirectional: if A substitutes B, B can substitute A
    if (!subMap.has(sub.substituteMaterialId)) subMap.set(sub.substituteMaterialId, new Set());
    subMap.get(sub.substituteMaterialId)!.add(sub.materialId);
  }

  /**
   * Check if the user can cover a required material slot.
   * Match order: exact ID → known substitution → same type (for flexible types).
   */
  function canCoverMaterial(materialId: string, materialType: string): boolean {
    // Exact match
    if (ownedMaterialIds.has(materialId)) return true;

    // Known substitution from the database
    const subs = subMap.get(materialId);
    if (subs) {
      for (const subId of subs) {
        if (ownedMaterialIds.has(subId)) return true;
      }
    }

    // Flexible type match: any material of the same type counts
    if (FLEXIBLE_TYPES.has(materialType)) {
      return (ownedByType[materialType]?.length ?? 0) > 0;
    }

    // Same-type matching for other categories (tail, body, wing, hackle, etc.)
    // The user has a material of the same type → flexible match
    return (ownedByType[materialType]?.length ?? 0) > 0;
  }

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

    let coveredCount = 0;
    const missingMaterials: Array<{ id: string; name: string; type: string }> = [];

    for (const pm of pattern.materials) {
      if (canCoverMaterial(pm.materialId, pm.material.type)) {
        coveredCount++;
      } else {
        missingMaterials.push({
          id: pm.material.id,
          name: pm.material.name,
          type: pm.material.type,
        });
      }
    }

    if (missingMaterials.length === 0) {
      canTie.push({
        id: pattern.id,
        name: pattern.name,
        slug: pattern.slug,
        category: pattern.category,
      });
    } else if (coveredCount > 0 && missingMaterials.length <= 3) {
      almostThere.push({
        id: pattern.id,
        name: pattern.name,
        slug: pattern.slug,
        category: pattern.category,
        totalMaterials: pattern.materials.length,
        ownedCount: coveredCount,
        missing: missingMaterials,
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
