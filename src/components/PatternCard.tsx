import Link from "next/link";
import type { FlyPatternListItem } from "@/lib/types";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
} from "@/lib/constants";

interface PatternCardProps {
  pattern: FlyPatternListItem;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function PatternCard({ pattern }: PatternCardProps) {
  const difficultyColor =
    DIFFICULTY_COLORS[pattern.difficulty] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  return (
    <Link
      href={`/patterns/${pattern.slug}`}
      className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          {pattern.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor}`}
        >
          {DIFFICULTY_LABELS[pattern.difficulty]}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
        {pattern.description}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          {CATEGORY_LABELS[pattern.category]}
        </span>
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {WATER_TYPE_LABELS[pattern.waterType]}
        </span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {pattern._count.materials} materials
        </span>
        {pattern._count.variations > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pattern._count.variations} variation
            {pattern._count.variations !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
