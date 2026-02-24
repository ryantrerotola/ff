import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/prisma-errors";
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

  if (!isDatabaseConfigured()) {
    console.error(
      "[PatternService] DATABASE_URL is not configured; returning empty pattern list."
    );
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  let data: FlyPatternListItem[] = [];
  let total = 0;

  try {
    [data, total] = await withDatabaseRetry(() =>
      Promise.all([
        prisma.flyPattern.findMany({
          where,
          select: patternListSelect,
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.flyPattern.count({ where }),
      ])
    );
  } catch (error) {
    console.error(
      "[PatternService] Failed to load patterns; returning empty result.",
      error
    );
  }

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
  if (!isDatabaseConfigured()) {
    console.error(
      `[PatternService] DATABASE_URL is not configured; cannot load pattern \"${slug}\".`
    );
    return null;
  }

  let pattern: FlyPatternDetail | null = null;

  try {
    pattern = (await withDatabaseRetry(() =>
      prisma.flyPattern.findUnique({
        where: { slug },
        include: patternDetailInclude,
      })
    )) as FlyPatternDetail | null;
  } catch (error) {
    console.error(
      `[PatternService] Failed to load pattern \"${slug}\".`,
      error
    );
  }

  return pattern;
}

export async function getAllPatternSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    console.error(
      "[PatternService] DATABASE_URL is not configured; returning no slugs."
    );
    return [];
  }

  let patterns: { slug: string }[] = [];

  try {
    patterns = await withDatabaseRetry(() =>
      prisma.flyPattern.findMany({
        select: { slug: true },
      })
    );
  } catch (error) {
    console.error("[PatternService] Failed to load pattern slugs.", error);
  }

  return patterns.map((p) => p.slug);
}
