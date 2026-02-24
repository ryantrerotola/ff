import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
} from "@/lib/constants";

interface SimilarPatternsProps {
  flyPatternId: string;
  category: string;
  difficulty: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export async function SimilarPatterns({
  flyPatternId,
  category,
  difficulty,
}: SimilarPatternsProps) {
  // Fetch patterns in the same category, excluding the current one
  type PatternRow = { id: string; name: string; slug: string; category: string; difficulty: string; waterType: string; description: string; _count: { materials: number; variations: number } };
  let patterns: PatternRow[] = [];
  try {
    patterns = await withRetry(() => prisma.flyPattern.findMany({
    where: {
      category: category as never,
      id: { not: flyPatternId },
    },
    select: {
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
    },
    orderBy: { name: "asc" },
    take: 20,
  }));
  } catch {
    // Don't break the page if similar patterns fail to load
  }

  // Sort: same difficulty first, then the rest
  const sorted = [...patterns].sort((a, b) => {
    const aMatch = a.difficulty === difficulty ? 0 : 1;
    const bMatch = b.difficulty === difficulty ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });

  const similar = sorted.slice(0, 4);

  if (similar.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Patterns Like This
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {similar.map((pattern) => {
          const difficultyColor =
            DIFFICULTY_COLORS[pattern.difficulty] ??
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

          return (
            <Link
              key={pattern.id}
              href={`/patterns/${pattern.slug}`}
              className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 dark:text-gray-100 dark:group-hover:text-brand-400">
                  {pattern.name}
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor}`}
                >
                  {DIFFICULTY_LABELS[pattern.difficulty]}
                </span>
              </div>
              <p className="mb-3 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                {pattern.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {CATEGORY_LABELS[pattern.category]}
                </span>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {WATER_TYPE_LABELS[pattern.waterType]}
                </span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {pattern._count.materials} materials
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
