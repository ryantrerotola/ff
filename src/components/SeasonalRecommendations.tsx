import Link from "next/link";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function loadHatches(currentMonth: number) {
  return prisma.hatchEntry.findMany({
    where: { month: currentMonth },
    include: {
      flyPattern: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ insectName: "asc" }],
    take: 8,
  });
}

export async function SeasonalRecommendations() {
  if (!isDatabaseConfigured()) {
    console.error(
      "[SeasonalRecommendations] DATABASE_URL is not configured; skipping seasonal query.",
    );
    return null;
  }

  const currentMonth = new Date().getMonth() + 1;

  let hatches: Awaited<ReturnType<typeof loadHatches>> = [];

  try {
    hatches = await loadHatches(currentMonth);
  } catch (error) {
    console.error(
      "[SeasonalRecommendations] Failed to load seasonal hatches; skipping section.",
      error,
    );
    return null;
  }

  if (hatches.length === 0) return null;

  return (
    <section className="my-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        What&apos;s Hatching Now
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Recommended patterns for {MONTH_NAMES[currentMonth - 1]}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hatches.map((hatch) => (
          <div
            key={hatch.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {hatch.insectType}
            </div>
            <h3 className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              {hatch.insectName}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {hatch.species}
            </p>

            <div className="mt-3 flex items-center justify-between">
              {hatch.flyPattern ? (
                <Link
                  href={`/patterns/${hatch.flyPattern.slug}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {hatch.flyPattern.name}
                </Link>
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {hatch.patternName}
                </span>
              )}
              {hatch.timeOfDay && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {hatch.timeOfDay}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/hatch"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View full hatch chart &rarr;
        </Link>
      </div>
    </section>
  );
}
