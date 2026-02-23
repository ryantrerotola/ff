"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface SearchResult {
  id: string;
  type: "pattern" | "forum_post" | "news";
  title: string;
  excerpt: string;
  slug?: string;
  rank: number;
}

const TYPE_LABELS: Record<string, string> = {
  pattern: "Pattern",
  forum_post: "Forum Post",
  news: "News",
};

const TYPE_COLORS: Record<string, string> = {
  pattern: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  forum_post: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  news: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function getResultLink(result: SearchResult): string {
  switch (result.type) {
    case "pattern":
      return `/patterns/${result.slug}`;
    case "forum_post":
      return `/forum/${result.id}`;
    case "news":
      return `/news?search=${encodeURIComponent(result.title)}`;
    default:
      return "#";
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? []))
      .finally(() => setLoading(false));
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Search
      </h1>

      <form onSubmit={handleSearch} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns, forum posts, and news..."
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      )}

      {!loading && q && results.length === 0 && (
        <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
          No results found for &quot;{q}&quot;
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={getResultLink(result)}
              className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[result.type]}`}
                >
                  {TYPE_LABELS[result.type]}
                </span>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {result.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
                {result.excerpt}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
