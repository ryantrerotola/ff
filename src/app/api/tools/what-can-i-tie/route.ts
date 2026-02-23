import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { materialIds?: string[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { materialIds } = body;

  if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
    return NextResponse.json(
      { error: "materialIds array is required" },
      { status: 400 }
    );
  }

  // Cap the number of materials to prevent abuse
  if (materialIds.length > 500) {
    return NextResponse.json(
      { error: "Too many materials selected (max 500)" },
      { status: 400 }
    );
  }

  // Expand material set with substitutions so equivalent materials match
  const substitutions = await prisma.materialSubstitution.findMany({
    where: {
      OR: [
        { substituteMaterialId: { in: materialIds } },
        { materialId: { in: materialIds } },
      ],
    },
  });

  const expandedSet = new Set(materialIds);
  for (const sub of substitutions) {
    // If user has the substitute, they effectively have the original
    if (expandedSet.has(sub.substituteMaterialId)) {
      expandedSet.add(sub.materialId);
    }
    // If user has the original, they effectively have the substitute
    if (expandedSet.has(sub.materialId)) {
      expandedSet.add(sub.substituteMaterialId);
    }
  }

  // Fetch all patterns with their required materials
  const patterns = await prisma.flyPattern.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      difficulty: true,
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

  const canTie: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    difficulty: string;
  }> = [];

  const almostThere: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    difficulty: string;
    totalRequired: number;
    ownedCount: number;
    missing: Array<{ id: string; name: string; type: string }>;
  }> = [];

  for (const pattern of patterns) {
    // Skip patterns with no required materials
    if (pattern.materials.length === 0) continue;

    const requiredIds = pattern.materials.map((m) => m.materialId);
    const ownedCount = requiredIds.filter((id) => expandedSet.has(id)).length;
    const missingCount = requiredIds.length - ownedCount;

    if (missingCount === 0) {
      canTie.push({
        id: pattern.id,
        name: pattern.name,
        slug: pattern.slug,
        category: pattern.category,
        difficulty: pattern.difficulty,
      });
    } else if (missingCount <= 3 && ownedCount > 0) {
      const missing = pattern.materials
        .filter((m) => !expandedSet.has(m.materialId))
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
        difficulty: pattern.difficulty,
        totalRequired: requiredIds.length,
        ownedCount,
        missing,
      });
    }
  }

  // Sort almost-there by fewest missing first
  almostThere.sort((a, b) => a.missing.length - b.missing.length);

  return NextResponse.json({
    canTie,
    almostThere: almostThere.slice(0, 20),
  });
}
