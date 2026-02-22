"use client";

import { useEffect, useState } from "react";

interface StarRatingProps {
  flyPatternId: string;
}

interface RatingData {
  average: number;
  count: number;
  userRating: number | null;
}

export function StarRating({ flyPatternId }: StarRatingProps) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/ratings?flyPatternId=${flyPatternId}`)
      .then((r) => r.json())
      .then((data: RatingData) => {
        setAverage(data.average);
        setCount(data.count);
        setUserRating(data.userRating);
      });
  }, [flyPatternId]);

  async function handleRate(value: number) {
    if (submitting) return;

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flyPatternId, rating: value }),
    });

    if (res.status === 401) {
      setError("Log in to rate");
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      setError("Failed to submit rating");
      setSubmitting(false);
      return;
    }

    const data: RatingData = await res.json();
    setAverage(data.average);
    setCount(data.count);
    setUserRating(data.userRating);
    setSubmitting(false);
  }

  // Determine which stars to fill based on hover state or average
  const displayValue = hoveredStar ?? userRating ?? average;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoveredStar(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayValue);
          return (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoveredStar(star)}
              className="disabled:cursor-wait"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <svg
                className={`h-5 w-5 ${filled ? "text-yellow-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="text-sm text-gray-600">
        {average.toFixed(1)} ({count} {count === 1 ? "rating" : "ratings"})
      </span>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
