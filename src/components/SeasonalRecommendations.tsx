import Link from "next/link";
import { isDatabaseConfigured, prisma, withRetry } from "@/lib/prisma";

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
    take: 30,
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

  let rawHatches: Awaited<ReturnType<typeof loadHatches>> = [];

  try {
    rawHatches = await withRetry(() => loadHatches(currentMonth));
  } catch (error) {
    console.error(
      "[SeasonalRecommendations] Failed to load seasonal hatches; skipping section.",
      error,
    );
    return null;
  }

  // Deduplicate by insectName — keep the first (which has flyPattern link if available)
  const seen = new Set<string>();
  const hatches = rawHatches.filter((h) => {
    const key = h.insectName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);

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
        {hatches.map((hatch) => {
          const patternHref = hatch.flyPattern
            ? `/patterns/${hatch.flyPattern.slug}`
            : null;
          const patternDisplay = hatch.flyPattern?.name ?? hatch.patternName;

          const card = (
            <div className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
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
                <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                  {patternDisplay}
                </span>
                {hatch.timeOfDay && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {hatch.timeOfDay}
                  </span>
                )}
              </div>
            </div>
          );

          return patternHref ? (
            <Link key={hatch.id} href={patternHref}>
              {card}
            </Link>
          ) : (
            <div key={hatch.id}>{card}</div>
          );
        })}
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
