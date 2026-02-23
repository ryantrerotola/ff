import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import {
  TECHNIQUE_CATEGORY_LABELS,
  TECHNIQUE_DIFFICULTY_LABELS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Learn to Tie",
  description:
    "Browse fly tying techniques by category and difficulty. Video tutorials, key points, and step-by-step guidance.",
};

const DIFFICULTY_BADGE_COLORS: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

interface LearnPageProps {
  searchParams: Promise<{
    category?: string;
    difficulty?: string;
    search?: string;
  }>;
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const { category, difficulty, search } = await searchParams;

  const where: Record<string, unknown> = {};

  if (category && category in TECHNIQUE_CATEGORY_LABELS) {
    where.category = category;
  }

  if (difficulty && difficulty in TECHNIQUE_DIFFICULTY_LABELS) {
    where.difficulty = difficulty;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  type TechniqueRow = Awaited<ReturnType<typeof prisma.tyingTechnique.findMany<{
    include: { _count: { select: { videos: true } } };
  }>>>[number];

  let techniques: TechniqueRow[] = [];

  try {
    techniques = await prisma.tyingTechnique.findMany({
      where,
      include: {
        _count: { select: { videos: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  } catch {
    // Table may not exist yet if migration hasn't been applied
  }

  // Group techniques by category for section display
  const grouped = new Map<string, typeof techniques>();
  for (const t of techniques) {
    const existing = grouped.get(t.category) ?? [];
    existing.push(t);
    grouped.set(t.category, existing);
  }

  // Ordered category keys matching TECHNIQUE_CATEGORY_LABELS order
  const categoryOrder = Object.keys(TECHNIQUE_CATEGORY_LABELS);
  const sortedCategories = categoryOrder.filter((c) => grouped.has(c));

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.difficulty) sp.set("difficulty", params.difficulty);
    if (params.search) sp.set("search", params.search);
    const qs = sp.toString();
    return `/learn${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Learn to Tie
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Master fly tying techniques with curated video tutorials and key points.
      </p>

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <form action="/learn" method="get" className="flex gap-2">
          <input
            name="search"
            type="text"
            defaultValue={search ?? ""}
            placeholder="Search techniques..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {difficulty && (
            <input type="hidden" name="difficulty" value={difficulty} />
          )}
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-0.5">
            <Link
              href={buildUrl({
                search: search ?? "",
                difficulty: difficulty ?? "",
              })}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                !category
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              All
            </Link>
            {Object.entries(TECHNIQUE_CATEGORY_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={buildUrl({
                  category: key,
                  difficulty: difficulty ?? "",
                  search: search ?? "",
                })}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  category === key
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-0.5">
            <Link
              href={buildUrl({
                category: category ?? "",
                search: search ?? "",
              })}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                !difficulty
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              All Levels
            </Link>
            {Object.entries(TECHNIQUE_DIFFICULTY_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={buildUrl({
                  difficulty: key,
                  category: category ?? "",
                  search: search ?? "",
                })}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  difficulty === key
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      {(category || difficulty || search) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Filters:
          </span>
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300">
              &quot;{search}&quot;
              <Link
                href={buildUrl({
                  category: category ?? "",
                  difficulty: difficulty ?? "",
                })}
                className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                x
              </Link>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2.5 py-0.5 text-xs text-brand-700 dark:text-brand-300">
              {TECHNIQUE_CATEGORY_LABELS[category]}
              <Link
                href={buildUrl({
                  search: search ?? "",
                  difficulty: difficulty ?? "",
                })}
                className="ml-0.5 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
              >
                x
              </Link>
            </span>
          )}
          {difficulty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300">
              {TECHNIQUE_DIFFICULTY_LABELS[difficulty]}
              <Link
                href={buildUrl({
                  search: search ?? "",
                  category: category ?? "",
                })}
                className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                x
              </Link>
            </span>
          )}
          <Link
            href="/learn"
            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Techniques listing */}
      {techniques.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {search
              ? `No techniques matching "${search}".`
              : "No techniques yet. Check back soon as we build our library!"}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {sortedCategories.map((cat) => {
            const items = grouped.get(cat)!;
            return (
              <section key={cat}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {TECHNIQUE_CATEGORY_LABELS[cat]}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {items.length} technique{items.length !== 1 ? "s" : ""}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((technique) => {
                    const badgeColor =
                      DIFFICULTY_BADGE_COLORS[technique.difficulty] ??
                      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

                    return (
                      <Link
                        key={technique.id}
                        href={`/learn/${technique.slug}`}
                        className="group rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {technique.name}
                          </h3>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}
                          >
                            {TECHNIQUE_DIFFICULTY_LABELS[technique.difficulty]}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {technique.description}
                        </p>

                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          {technique._count.videos > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                              </svg>
                              {technique._count.videos} video
                              {technique._count.videos !== 1 ? "s" : ""}
                            </span>
                          )}
                          {technique.keyPoints.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                                />
                              </svg>
                              {technique.keyPoints.length} key point
                              {technique.keyPoints.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
