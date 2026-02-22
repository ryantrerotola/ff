"use client";

import { useEffect, useState, useCallback } from "react";

interface ModerationUser {
  id: string;
  username: string;
  role?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: ModerationUser;
  flyPattern: { name: string; slug: string };
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: ModerationUser;
  _count: { replies: number };
}

interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  user: ModerationUser;
  post: { id: string; title: string };
}

interface PendingSubmission {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; username: string };
}

interface ModerationData {
  recentComments: Comment[];
  recentForumPosts: ForumPost[];
  recentForumReplies: ForumReply[];
  pendingSubmissions: PendingSubmission[];
  userCount: number;
}

export default function ModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/moderation")
      .then((r) => {
        if (r.status === 403) {
          throw new Error("Access denied");
        }
        if (!r.ok) throw new Error("Failed to load moderation data");
        return r.json();
      })
      .then((d: ModerationData) => {
        setData(d);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(
    action: string,
    targetType: string,
    targetId: string,
  ) {
    const key = `${action}-${targetType}-${targetId}`;
    setActionLoading(key);

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetType, targetId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Action failed");
      }

      // Remove the item from local state to avoid a full refetch
      if (data) {
        const updated = { ...data };

        if (action === "delete") {
          if (targetType === "comment") {
            updated.recentComments = updated.recentComments.filter(
              (c) => c.id !== targetId,
            );
          } else if (targetType === "forumPost") {
            updated.recentForumPosts = updated.recentForumPosts.filter(
              (p) => p.id !== targetId,
            );
          } else if (targetType === "forumReply") {
            updated.recentForumReplies = updated.recentForumReplies.filter(
              (r) => r.id !== targetId,
            );
          }
        }

        if (
          action === "approve-submission" ||
          action === "reject-submission"
        ) {
          updated.pendingSubmissions = updated.pendingSubmissions.filter(
            (s) => s.id !== targetId,
          );
        }

        setData(updated);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="rounded-md bg-red-50 p-6">
          <p className="text-lg font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Content Moderation
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-md bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Content Moderation
      </h2>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {data.userCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Pending Submissions
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {data.pendingSubmissions.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Recent Content</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {data.recentComments.length +
              data.recentForumPosts.length +
              data.recentForumReplies.length}
          </p>
        </div>
      </div>

      {/* Pending Submissions */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Pending User-Submitted Patterns
        </h3>
        {data.pendingSubmissions.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No pending submissions.
          </p>
        ) : (
          <div className="space-y-3">
            {data.pendingSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900">
                      {submission.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      by{" "}
                      <span className="font-medium text-gray-700">
                        {submission.user.username}
                      </span>
                      {" \u00b7 "}
                      <span className="capitalize">{submission.category}</span>
                      {" \u00b7 "}
                      <span className="capitalize">{submission.difficulty}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {submission.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Submitted{" "}
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      {submission.status}
                    </span>
                    <button
                      onClick={() =>
                        handleAction(
                          "approve-submission",
                          "submission",
                          submission.id,
                        )
                      }
                      disabled={actionLoading !== null}
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {actionLoading ===
                      `approve-submission-submission-${submission.id}`
                        ? "..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          "reject-submission",
                          "submission",
                          submission.id,
                        )
                      }
                      disabled={actionLoading !== null}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {actionLoading ===
                      `reject-submission-submission-${submission.id}`
                        ? "..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Comments */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Comments
        </h3>
        {data.recentComments.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No recent comments.
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentComments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{comment.content}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    by{" "}
                    <span className="font-medium">{comment.user.username}</span>
                    {comment.user.role === "admin" && (
                      <span className="ml-1 rounded bg-brand-100 px-1 py-0.5 text-xs text-brand-700">
                        admin
                      </span>
                    )}
                    {" on "}
                    <span className="font-medium">
                      {comment.flyPattern.name}
                    </span>
                    {" \u00b7 "}
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleAction("delete", "comment", comment.id)}
                  disabled={actionLoading !== null}
                  className="flex-shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {actionLoading === `delete-comment-${comment.id}`
                    ? "..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Forum Posts */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Forum Posts
        </h3>
        {data.recentForumPosts.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No recent forum posts.
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentForumPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {post.title}
                  </h4>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                    {post.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    by{" "}
                    <span className="font-medium">{post.user.username}</span>
                    {post.user.role === "admin" && (
                      <span className="ml-1 rounded bg-brand-100 px-1 py-0.5 text-xs text-brand-700">
                        admin
                      </span>
                    )}
                    {" \u00b7 "}
                    {post._count.replies} replies
                    {" \u00b7 "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleAction("delete", "forumPost", post.id)
                  }
                  disabled={actionLoading !== null}
                  className="flex-shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {actionLoading === `delete-forumPost-${post.id}`
                    ? "..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Forum Replies */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Forum Replies
        </h3>
        {data.recentForumReplies.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No recent forum replies.
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentForumReplies.map((reply) => (
              <div
                key={reply.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{reply.content}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    by{" "}
                    <span className="font-medium">{reply.user.username}</span>
                    {reply.user.role === "admin" && (
                      <span className="ml-1 rounded bg-brand-100 px-1 py-0.5 text-xs text-brand-700">
                        admin
                      </span>
                    )}
                    {" on "}
                    <span className="font-medium">{reply.post.title}</span>
                    {" \u00b7 "}
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleAction("delete", "forumReply", reply.id)
                  }
                  disabled={actionLoading !== null}
                  className="flex-shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {actionLoading === `delete-forumReply-${reply.id}`
                    ? "..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
