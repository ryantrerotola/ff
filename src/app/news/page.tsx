import { prisma, withRetry } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { NewsEngagement } from "@/components/NewsEngagement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fly Fishing News",
  description:
    "The latest fly fishing news, articles, and stories from top sources.",
};

interface NewsPageProps {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: pageStr, search, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;
  const currentSort = sort === "trending" ? "trending" : "recent";

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { summary: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy =
    currentSort === "trending"
      ? { votes: { _count: "desc" as const } }
      : { publishedAt: "desc" as const };

  const [articles, total] = await withRetry(() =>
    Promise.all([
      prisma.newsArticle.findMany({
        where,
        include: {
          _count: { select: { comments: true, votes: true } },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.newsArticle.count({ where }),
    ]),
  );

  const totalPages = Math.ceil(total / limit);

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.page && params.page !== "1") sp.set("page", params.page);
    if (params.search) sp.set("search", params.search);
    if (params.sort && params.sort !== "recent") sp.set("sort", params.sort);
    const qs = sp.toString();
    return `/news${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fly Fishing News</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Latest stories from across the fly fishing world.
      </p>

      {/* Search & Sort */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/news" method="get" className="flex gap-2">
          <input
            name="search"
            type="text"
            defaultValue={search ?? ""}
            placeholder="Search news..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
          />
          {currentSort === "trending" && <input type="hidden" name="sort" value="trending" />}
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-0.5">
          <Link
            href={buildUrl({ search: search ?? "", sort: "recent" })}
            className={`rounded px-3 py-1 text-sm font-medium ${
              currentSort === "recent"
                ? "bg-brand-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Recent
          </Link>
          <Link
            href={buildUrl({ search: search ?? "", sort: "trending" })}
            className={`rounded px-3 py-1 text-sm font-medium ${
              currentSort === "trending"
                ? "bg-brand-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Trending
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {search
              ? `No articles matching "${search}".`
              : "No news articles yet. Run the news scraper to populate:"}
          </p>
          {!search && (
            <code className="mt-2 inline-block rounded bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              npx tsx src/pipeline/cli.ts news
            </code>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 p-4"
              >
                {article.imageUrl && (
                  <div className="hidden flex-shrink-0 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="h-24 w-36 rounded-md object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="font-medium text-brand-600">
                      {article.sourceName}
                    </span>
                    {article.author && <span>by {article.author}</span>}
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>
              </a>
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
                <NewsEngagement
                  articleId={article.id}
                  initialVoteCount={article._count.votes}
                  initialCommentCount={article._count.comments}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({
                page: String(page - 1),
                search: search ?? "",
                sort: currentSort,
              })}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({
                page: String(page + 1),
                search: search ?? "",
                sort: currentSort,
              })}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
