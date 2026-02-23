"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
}

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
  category: { id: string; name: string; slug: string } | null;
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    fetch(`/api/forum?${params}`)
      .then((r) => r.json())
      .then((data: ForumResponse) => {
        setPosts(data.data);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, search, selectedCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum</h1>
        <Link
          href="/forum/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Post
        </Link>
      </div>

      {/* Search & Category filter */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-56"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>

        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {(search || selectedCategory) && (
          <button
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setSelectedCategory("");
              setPage(1);
            }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
          {search || selectedCategory
            ? "No posts matching your filters."
            : "No posts yet. Start a discussion!"}
        </p>
      ) : (
        <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-700">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/forum/${post.id}`}
              className="-mx-4 block rounded-md px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {post.pinned && (
                      <span className="mr-2 inline-flex items-center rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                        Pinned
                      </span>
                    )}
                    {post.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {post.category && (
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {post.category.name}
                      </span>
                    )}
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {post.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
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
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
