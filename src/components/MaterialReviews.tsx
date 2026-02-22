"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReviewUser {
  id: string;
  username: string;
  displayName: string | null;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  user: ReviewUser;
}

interface MaterialReviewsProps {
  materialId: string;
  materialName: string;
}

export function MaterialReviews({ materialId, materialName }: MaterialReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/materials/${materialId}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      })
      .finally(() => setLoading(false));
  }, [materialId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError("");
    setSubmitting(true);

    const res = await fetch(`/api/materials/${materialId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to leave a review"
          : data.error || "Failed to submit review",
      );
      setSubmitting(false);
      return;
    }

    const review = await res.json();
    setReviews((prev) => [review, ...prev]);
    setReviewCount((prev) => prev + 1);
    // Recalculate average
    const newTotal = averageRating * reviewCount + rating;
    setAverageRating(newTotal / (reviewCount + 1));
    setTitle("");
    setContent("");
    setRating(5);
    setShowForm(false);
    setSubmitting(false);
  }

  const displayStar = hoveredStar ?? rating;

  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Reviews for {materialName}
          </h4>
          {reviewCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {averageRating.toFixed(1)} avg ({reviewCount}{" "}
              {reviewCount === 1 ? "review" : "reviews"})
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Average rating stars */}
      {reviewCount > 0 && (
        <div className="mt-1 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(averageRating)
                  ? "text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      {/* Submission form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-750"
        >
          {error && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Star picker */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <div
              className="flex items-center gap-0.5"
              onMouseLeave={() => setHoveredStar(null)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  className="p-0.5"
                >
                  <svg
                    className={`h-5 w-5 ${
                      star <= displayStar
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label
              htmlFor={`review-title-${materialId}`}
              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Title
            </label>
            <input
              id={`review-title-${materialId}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Summarize your experience..."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor={`review-content-${materialId}`}
              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Review
            </label>
            <textarea
              id={`review-content-${materialId}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              maxLength={5000}
              placeholder="Share your detailed experience with this material..."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-md border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= review.rating
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <h5 className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {review.title}
                  </h5>
                </div>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {review.content}
              </p>
              <Link
                href={`/profile/${review.user.username}`}
                className="mt-2 inline-block text-xs font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
              >
                {review.user.displayName || review.user.username}
              </Link>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !showForm && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No reviews yet. Be the first to review this material!
        </p>
      )}
    </div>
  );
}
