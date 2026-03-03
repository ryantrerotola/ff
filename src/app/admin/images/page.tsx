"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface PatternImage {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  createdAt: string;
  flyPattern: { id: string; name: string; slug: string };
  uploadedBy: { id: string; username: string } | null;
}

interface ImagesResponse {
  images: PatternImage[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminImagesPage() {
  const [data, setData] = useState<ImagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);

    fetch(`/api/admin/images?${params}`)
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        if (!r.ok) throw new Error("Failed to load images");
        return r.json();
      })
      .then((d: ImagesResponse) => {
        setData(d);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;

    setDeleting(imageId);
    try {
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Delete failed");
      }

      if (data) {
        setData({
          ...data,
          images: data.images.filter((img) => img.id !== imageId),
          total: data.total - 1,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="rounded-md bg-red-50 p-6 dark:bg-red-900/30">
          <p className="text-lg font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Image Management
        </h2>
        {data && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {data.total} total images
          </span>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by pattern name..."
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : !data || data.images.length === 0 ? (
        <p className="rounded-md border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {search ? "No images match your search." : "No images found."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.caption || image.flyPattern.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-medium text-white">
                      Primary
                    </span>
                  )}
                  {/* Delete overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={deleting !== null}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting === image.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <Link
                    href={`/patterns/${image.flyPattern.slug}`}
                    className="block truncate text-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                  >
                    {image.flyPattern.name}
                  </Link>
                  {image.caption && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {image.caption}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {image.uploadedBy
                      ? image.uploadedBy.username
                      : "Pipeline"}
                    {" \u00b7 "}
                    {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
