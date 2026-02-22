import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "My Stuff",
};

export default async function MyStuffPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [
    savedPatterns,
    submissions,
    recentComments,
    likeCount,
    unreadMessages,
  ] = await Promise.all([
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.userSubmittedPattern.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.comment.findMany({
      where: { userId: user.id },
      include: { flyPattern: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.like.count({ where: { userId: user.id } }),
    prisma.directMessage.count({
      where: { receiverId: user.id, read: false },
    }),
  ]);

  const STATUS_BADGE: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Stuff</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.displayName || user.username}
          </p>
        </div>
        <Link
          href="/patterns/submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Submit Pattern
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {savedPatterns.length}
          </div>
          <div className="text-xs text-gray-500">Saved Patterns</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{likeCount}</div>
          <div className="text-xs text-gray-500">Likes Given</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {submissions.length}
          </div>
          <div className="text-xs text-gray-500">Submissions</div>
        </div>
        <Link
          href="/messages"
          className="rounded-lg border border-gray-200 p-4 text-center hover:border-brand-300"
        >
          <div className="text-2xl font-bold text-gray-900">
            {unreadMessages}
          </div>
          <div className="text-xs text-gray-500">Unread Messages</div>
        </Link>
      </div>

      {/* Saved Patterns */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Saved Patterns
        </h2>
        {savedPatterns.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No saved patterns yet.{" "}
            <Link href="/" className="text-brand-600 hover:text-brand-700">
              Browse patterns
            </Link>{" "}
            and click the save button to bookmark them.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {savedPatterns.map((sp) => (
              <Link
                key={sp.id}
                href={`/patterns/${sp.flyPattern.slug}`}
                className="rounded-md border border-gray-200 p-3 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="text-sm font-medium text-gray-900">
                  {sp.flyPattern.name}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {CATEGORY_LABELS[sp.flyPattern.category]} &middot;{" "}
                  {DIFFICULTY_LABELS[sp.flyPattern.difficulty]}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Submissions */}
      {submissions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            My Submissions
          </h2>
          <div className="mt-3 space-y-2">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {sub.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted{" "}
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[sub.status] ?? ""}`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Comments */}
      {recentComments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Comments
          </h2>
          <div className="mt-3 space-y-2">
            {recentComments.map((c) => (
              <Link
                key={c.id}
                href={`/patterns/${c.flyPattern.slug}`}
                className="block rounded-md border border-gray-200 p-3 hover:border-brand-300"
              >
                <div className="text-xs font-medium text-brand-600">
                  {c.flyPattern.name}
                </div>
                <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                  {c.content}
                </p>
                <div className="mt-1 text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
