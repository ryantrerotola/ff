import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Submissions — My Stuff",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const submissions = await withRetry(() =>
    prisma.userSubmittedPattern.findMany({
      where: { userId: user.id },
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

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Submissions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/patterns/submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Submit Pattern
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p>No submissions yet.</p>
          <Link href="/patterns/submit" className="mt-2 inline-block text-brand-600 hover:text-brand-700">
            Submit your first pattern
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {sub.name}
                  </div>
                  {sub.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {sub.description}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Submitted {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[sub.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {sub.status}
                </span>
              </div>
              {sub.status === "rejected" && (
                <div className="mt-3 rounded-md border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
                  <p className="text-xs font-medium text-red-500 dark:text-red-400">
                    This submission was not approved. Consider resubmitting with more detail.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
