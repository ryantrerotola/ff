import { prisma } from "@/lib/prisma";
import type {
  FlyPatternDetail,
  FlyPatternListItem,
  PaginatedResponse,
  PatternSearchParams,
} from "@/lib/types";
import { Prisma } from "@prisma/client";

const patternListSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  difficulty: true,
  waterType: true,
  description: true,
  _count: {
    select: {
      materials: true,
      variations: true,
    },
  },
} satisfies Prisma.FlyPatternSelect;

const patternDetailInclude = {
  materials: {
    orderBy: { position: "asc" as const },
    include: {
      material: {
        include: {
          substitutionsFrom: {
            include: {
              substituteMaterial: {
                include: {
                  affiliateLinks: true,
                },
              },
            },
          },
          affiliateLinks: true,
        },
      },
    },
  },
  variations: {
    include: {
      overrides: {
        include: {
          originalMaterial: true,
          replacementMaterial: true,
        },
      },
    },
  },
  tyingSteps: {
    orderBy: { position: "asc" as const },
  },
  resources: {
    orderBy: { qualityScore: "desc" as const },
  },
  feedback: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
  images: {
    include: { uploadedBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.FlyPatternInclude;

export async function getPatterns(
  params: PatternSearchParams
): Promise<PaginatedResponse<FlyPatternListItem>> {
  const {
    search,
    category,
    difficulty,
    waterType,
    page = 1,
    limit = 12,
  } = params;

  const where: Prisma.FlyPatternWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (waterType) where.waterType = waterType;

  const [data, total] = await Promise.all([
    prisma.flyPattern.findMany({
      where,
      select: patternListSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.flyPattern.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPatternBySlug(
  slug: string
): Promise<FlyPatternDetail | null> {
  const pattern = await prisma.flyPattern.findUnique({
    where: { slug },
    include: patternDetailInclude,
  });

  return pattern as FlyPatternDetail | null;
}

export async function getAllPatternSlugs(): Promise<string[]> {
  const patterns = await prisma.flyPattern.findMany({
    select: { slug: true },
  });
  return patterns.map((p) => p.slug);
}
