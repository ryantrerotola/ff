import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { patternIds } = body;

  if (!Array.isArray(patternIds) || patternIds.length === 0) {
    return NextResponse.json(
      { error: "patternIds must be a non-empty array" },
      { status: 400 },
    );
  }

  // Fetch all materials for the given patterns, including links
  const patternMaterials = await prisma.flyPatternMaterial.findMany({
    where: { flyPatternId: { in: patternIds } },
    include: {
      material: {
        include: {
          affiliateLinks: true,
        },
      },
      flyPattern: {
        select: { id: true, name: true },
      },
    },
    orderBy: { position: "asc" },
  });

  // Get user's owned materials for comparison
  const ownedMaterials = await prisma.userMaterial.findMany({
    where: { userId: user.id },
    select: { materialId: true },
  });
  const ownedSet = new Set(ownedMaterials.map((m) => m.materialId));

  // Deduplicate materials: group by material ID and collect pattern names
  const materialMap = new Map<
    string,
    {
      material: {
        id: string;
        name: string;
        type: string;
        description: string | null;
      };
      patterns: string[];
      owned: boolean;
      affiliateLinks: Array<{
        id: string;
        retailer: string;
        url: string;
        commissionType: string;
      }>;
    }
  >();

  for (const pm of patternMaterials) {
    const existing = materialMap.get(pm.material.id);
    if (existing) {
      if (!existing.patterns.includes(pm.flyPattern.name)) {
        existing.patterns.push(pm.flyPattern.name);
      }
    } else {
      materialMap.set(pm.material.id, {
        material: {
          id: pm.material.id,
          name: pm.material.name,
          type: pm.material.type,
          description: pm.material.description,
        },
        patterns: [pm.flyPattern.name],
        owned: ownedSet.has(pm.material.id),
        affiliateLinks: pm.material.affiliateLinks.map((link) => ({
          id: link.id,
          retailer: link.retailer,
          url: link.url,
          commissionType: link.commissionType,
        })),
      });
    }
  }

  const materials = Array.from(materialMap.values());

  return NextResponse.json({
    materials,
    totalPatterns: patternIds.length,
    ownedCount: materials.filter((m) => m.owned).length,
    needCount: materials.filter((m) => !m.owned).length,
  });
}
