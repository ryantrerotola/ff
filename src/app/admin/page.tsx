import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPipelineStats } from "@/services/staged.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const [
    totalPatterns,
    totalUsers,
    totalComments,
    totalForumPosts,
    recentComments,
    recentSubmissions,
    recentUsers,
    pipelineStats,
  ] = await Promise.all([
    prisma.flyPattern.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.forumPost.count(),
    prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
        flyPattern: { select: { name: true, slug: true } },
      },
    }),
    prisma.userSubmittedPattern.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    getPipelineStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/review"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Review Queue
          </Link>
          <Link
            href="/admin/moderation"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Moderation
          </Link>
        </div>
      </div>

      {/* Key Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Patterns
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {totalPatterns}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Users
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {totalUsers}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Comments
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {totalComments}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Forum Posts
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {totalForumPosts}
          </p>
        </div>
      </div>

      {/* Pipeline Stats */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pipeline Stats
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Sources
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Discovered:{" "}
                <span className="font-semibold">
                  {pipelineStats.sources.discovered}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Scraped:{" "}
                <span className="font-semibold">
                  {pipelineStats.sources.scraped}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Extracted:{" "}
                <span className="font-semibold">
                  {pipelineStats.sources.extracted}
                </span>
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Extractions
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Total:{" "}
                <span className="font-semibold">
                  {pipelineStats.extractions.total}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                High Confidence:{" "}
                <span className="font-semibold">
                  {pipelineStats.extractions.highConfidence}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Low Confidence:{" "}
                <span className="font-semibold">
                  {pipelineStats.extractions.lowConfidence}
                </span>
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pattern Pipeline
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Normalized:{" "}
                <span className="font-semibold">
                  {pipelineStats.patterns.normalized}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Approved:{" "}
                <span className="font-semibold">
                  {pipelineStats.patterns.approved}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Ingested:{" "}
                <span className="font-semibold">
                  {pipelineStats.patterns.ingested}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Rejected:{" "}
                <span className="font-semibold">
                  {pipelineStats.patterns.rejected}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Comments */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Latest Comments
          </h3>
          {recentComments.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              No comments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="line-clamp-2 text-sm text-gray-900 dark:text-gray-100">
                    {comment.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    by{" "}
                    <span className="font-medium">{comment.user.username}</span>
                    {" on "}
                    <Link
                      href={`/patterns/${comment.flyPattern.slug}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {comment.flyPattern.name}
                    </Link>
                    {" \u00b7 "}
                    {comment.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Submissions */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Latest Submissions
          </h3>
          {recentSubmissions.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              No submissions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {submission.name}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        submission.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : submission.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    by{" "}
                    <span className="font-medium">
                      {submission.user.username}
                    </span>
                    {" \u00b7 "}
                    <span className="capitalize">{submission.category}</span>
                    {" \u00b7 "}
                    {submission.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Registrations */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Latest Registrations
          </h3>
          {recentUsers.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              No users yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {u.username}
                    </p>
                    {u.role === "admin" && (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        admin
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {u.email} {" \u00b7 "}
                    {u.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
