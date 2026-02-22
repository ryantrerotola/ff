"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ForumPostUser {
  id: string;
  username: string;
  displayName: string | null;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  user: ForumPostUser;
  _count: { replies: number };
}

interface ForumResponse {
  data: ForumPost[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/forum?page=${page}`)
      .then((r) => r.json())
      .then((data: ForumResponse) => {
        setPosts(data.data);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
        <Link
          href="/forum/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-md bg-gray-100"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          No posts yet. Start a discussion!
        </p>
      ) : (
        <div className="mt-6 divide-y divide-gray-200">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/forum/${post.id}`}
              className="block py-4 hover:bg-gray-50 -mx-4 px-4 rounded-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {post.pinned && (
                      <span className="mr-2 inline-flex items-center rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                        Pinned
                      </span>
                    )}
                    {post.title}
                  </h2>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {post.content}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-gray-500">
                  <span>{post._count.replies} replies</span>
                  <span>
                    by {post.user.displayName || post.user.username}
                  </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
