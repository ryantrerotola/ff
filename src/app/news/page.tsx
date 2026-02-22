import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fly Fishing News",
  description:
    "The latest fly fishing news, articles, and stories from top sources.",
};

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.newsArticle.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Fly Fishing News</h1>
      <p className="mt-1 text-sm text-gray-500">
        Latest stories from across the fly fishing world.
      </p>

      {articles.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            No news articles yet. Run the news scraper to populate:
          </p>
          <code className="mt-2 inline-block rounded bg-gray-100 px-3 py-1 text-sm text-gray-700">
            npx tsx src/pipeline/cli.ts news
          </code>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="overflow-hidden rounded-lg border border-gray-200 transition hover:border-gray-300 hover:shadow-sm"
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
                  <h2 className="text-base font-semibold text-gray-900 line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-gray-400">
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
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/news?page=${page - 1}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/news?page=${page + 1}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
