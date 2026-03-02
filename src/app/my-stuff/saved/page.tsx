import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Patterns — My Stuff",
};

export default async function SavedPatternsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const savedPatterns = await withRetry(() =>
    prisma.savedPattern.findMany({
      where: { userId: user.id },
      include: {
        flyPattern: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            difficulty: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/my-stuff"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        My Stuff
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        Saved Patterns
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {savedPatterns.length} pattern{savedPatterns.length !== 1 ? "s" : ""} saved
      </p>

      {savedPatterns.length === 0 ? (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p>No saved patterns yet.</p>
          <Link href="/" className="mt-2 inline-block text-brand-600 hover:text-brand-700">
            Browse patterns
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {savedPatterns.map((sp) => (
            <Link
              key={sp.id}
              href={`/patterns/${sp.flyPattern.slug}`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {sp.flyPattern.name}
              </div>
              <div className="mt-1 flex gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[sp.flyPattern.category]}
                </span>
                <span className="text-gray-400">&middot;</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {DIFFICULTY_LABELS[sp.flyPattern.difficulty]}
                </span>
              </div>
              {sp.flyPattern.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {sp.flyPattern.description}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Saved {new Date(sp.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
