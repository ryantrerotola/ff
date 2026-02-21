"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExtractedPattern } from "@/pipeline/types";

interface ExtractionRow {
  id: string;
  patternName: string;
  normalizedSlug: string;
  confidence: number;
  status: string;
  createdAt: string | Date;
  reviewedAt: string | Date | null;
  extractedData: unknown;
  source: {
    url: string;
    sourceType: string;
    title: string | null;
    creatorName: string | null;
    platform: string | null;
  };
}

interface ReviewTableProps {
  extractions: ExtractionRow[];
  total: number;
  page: number;
  totalPages: number;
  currentStatus: string;
}

const STATUS_TABS = [
  { value: "normalized", label: "Ready for Review" },
  { value: "extracted", label: "Extracted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "ingested", label: "Ingested" },
];

export function ReviewTable({
  extractions,
  total,
  page,
  totalPages,
  currentStatus,
}: ReviewTableProps) {
  const router = useRouter();

  return (
    <div>
      {/* Status tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => router.push(`/admin/review?status=${tab.value}`)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              currentStatus === tab.value
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Pattern
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Materials
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {extractions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No extractions found with status &quot;{currentStatus}&quot;
                </td>
              </tr>
            )}
            {extractions.map((extraction) => {
              const data =
                extraction.extractedData as unknown as ExtractedPattern | null;
              const materialCount = data?.materials?.length ?? 0;

              return (
                <tr key={extraction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {extraction.patternName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {extraction.normalizedSlug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {extraction.source.sourceType}
                      </span>
                      <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-500">
                        {extraction.source.title ?? extraction.source.url}
                      </p>
                      <p className="text-xs text-gray-400">
                        {extraction.source.creatorName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {materialCount}
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge confidence={extraction.confidence} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/review/${extraction.id}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() =>
                  router.push(
                    `/admin/review?status=${currentStatus}&page=${page - 1}`
                  )
                }
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() =>
                  router.push(
                    `/admin/review?status=${currentStatus}&page=${page + 1}`
                  )
                }
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);

  let color = "bg-red-100 text-red-700";
  if (pct >= 80) color = "bg-green-100 text-green-700";
  else if (pct >= 60) color = "bg-yellow-100 text-yellow-700";
  else if (pct >= 40) color = "bg-orange-100 text-orange-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {pct}%
    </span>
  );
}
