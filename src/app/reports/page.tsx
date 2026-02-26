"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapFishingReport } from "@/components/ReportsMap";

const ReportsMap = dynamic(() => import("@/components/ReportsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
    </div>
  ),
});

type FishingReport = MapFishingReport;

interface Filters {
  regions: string[];
  states: string[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<FishingReport[]>([]);
  const [filters, setFilters] = useState<Filters>({ regions: [], states: [] });
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");
  const [selectedReport, setSelectedReport] = useState<FishingReport | null>(null);

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (state) params.set("state", state);

    fetch(`/api/fishing-reports?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports);
        setFilters(data.filters);
      })
      .finally(() => setLoading(false));
  }, [region, state]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function daysAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Fishing Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aggregated fishing conditions from across the web. Click a marker for
          the full report.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All Regions</option>
          {filters.regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All States</option>
          {filters.states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reports.length} report{reports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Map */}
      <div className="relative mt-4">
        {loading ? (
          <div className="flex h-[600px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-600" />
          </div>
        ) : (
          <ReportsMap
            reports={reports}
            onSelectReport={setSelectedReport}
          />
        )}

        {/* Report popup overlay */}
        {selectedReport && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/20">
            <div className="mx-4 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedReport.waterBody}
                    {selectedReport.state && (
                      <span className="ml-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                        {selectedReport.state}
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {selectedReport.region} &middot; Updated{" "}
                    {daysAgo(selectedReport.reportDate)} ({formatDate(selectedReport.reportDate)})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {selectedReport.summary}
              </p>

              {selectedReport.conditions && (
                <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    Conditions
                  </p>
                  <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-400">
                    {selectedReport.conditions}
                  </p>
                </div>
              )}

              {selectedReport.sourceUrls.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Sources
                  </p>
                  <ul className="mt-1 space-y-1">
                    {selectedReport.sourceUrls.map((url, i) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          {selectedReport.sourceTitles[i] || url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
