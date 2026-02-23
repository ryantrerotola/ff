import { getStagedExtractions, getPipelineStats } from "@/services/staged.service";
import type { StagedStatus } from "@prisma/client";
import { ReviewTable } from "@/components/admin/ReviewTable";
import { PipelineStatsPanel } from "@/components/admin/PipelineStatsPanel";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const rawParams = await searchParams;

  const status =
    typeof rawParams.status === "string"
      ? (rawParams.status as StagedStatus)
      : undefined;
  const page =
    typeof rawParams.page === "string" ? parseInt(rawParams.page, 10) : 1;

  const [result, stats] = await Promise.all([
    getStagedExtractions({
      status: status ?? "normalized",
      page,
      limit: 20,
    }),
    getPipelineStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Pipeline Review Queue
      </h2>

      <PipelineStatsPanel stats={stats} />

      <div className="mt-8">
        <ReviewTable
          extractions={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          currentStatus={status ?? "normalized"}
        />
      </div>
    </div>
  );
}
