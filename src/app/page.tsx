import { Suspense } from "react";
import { getPatterns } from "@/services/pattern.service";
import { patternSearchSchema } from "@/lib/validation";
import { PatternList } from "@/components/PatternList";
import { PatternFilters } from "@/components/PatternFilters";
import { Pagination } from "@/components/Pagination";
import { SeasonalRecommendations } from "@/components/SeasonalRecommendations";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;

  const parsed = patternSearchSchema.safeParse({
    search:
      typeof rawParams.search === "string" ? rawParams.search : undefined,
    category:
      typeof rawParams.category === "string" ? rawParams.category : undefined,
    difficulty:
      typeof rawParams.difficulty === "string"
        ? rawParams.difficulty
        : undefined,
    waterType:
      typeof rawParams.waterType === "string"
        ? rawParams.waterType
        : undefined,
    page: typeof rawParams.page === "string" ? rawParams.page : undefined,
    limit: typeof rawParams.limit === "string" ? rawParams.limit : undefined,
  });

  const params = parsed.success
    ? parsed.data
    : { page: 1, limit: 12 };

  const result = await getPatterns(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse fly tying patterns with detailed materials, substitutes, and
          instructional resources.
        </p>
      </div>

      <Suspense fallback={<div className="h-32" />}>
        <PatternFilters />
      </Suspense>

      <Suspense fallback={null}>
        <SeasonalRecommendations />
      </Suspense>

      <PatternList patterns={result.data} />

      <Suspense fallback={null}>
        <Pagination currentPage={result.page} totalPages={result.totalPages} />
      </Suspense>

      <div className="mt-8 text-center text-xs text-gray-400">
        Showing {result.data.length} of {result.total} patterns
      </div>
    </div>
  );
}
