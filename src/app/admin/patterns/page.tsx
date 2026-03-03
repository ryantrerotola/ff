"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/constants";

interface PatternListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty: string;
  waterType: string;
  _count: { materials: number; images: number; variations: number };
  images: { url: string }[];
}

interface PatternsResponse {
  patterns: PatternListItem[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminPatternsPage() {
  const [data, setData] = useState<PatternsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);

    fetch(`/api/admin/patterns?${params}`)
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        if (!r.ok) throw new Error("Failed to load patterns");
        return r.json();
      })
      .then((d: PatternsResponse) => {
        setData(d);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="rounded-md bg-red-50 p-6 dark:bg-red-900/30">
          <p className="text-lg font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pattern Management
        </h2>
        {data && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {data.total} total patterns
          </span>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by pattern name or slug..."
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : !data || data.patterns.length === 0 ? (
        <p className="rounded-md border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {search ? "No patterns match your search." : "No patterns found."}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pattern
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Materials
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Images
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.patterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {pattern.images[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pattern.images[0].url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                            ?
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/patterns/${pattern.slug}/edit`}
                            className="font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {pattern.name}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {pattern.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {CATEGORY_LABELS[pattern.category] ?? pattern.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {DIFFICULTY_LABELS[pattern.difficulty] ?? pattern.difficulty}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                      {pattern._count.materials}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                      {pattern._count.images}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/patterns/${pattern.slug}`}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/patterns/${pattern.slug}/edit`}
                          className="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
