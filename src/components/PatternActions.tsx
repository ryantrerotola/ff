"use client";

import { useEffect, useState } from "react";

interface PatternActionsProps {
  flyPatternId: string;
}

export function PatternActions({ flyPatternId }: PatternActionsProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/likes?flyPatternId=${flyPatternId}`)
      .then((r) => r.json())
      .then((data) => {
        setLikeCount(data.count);
        setLiked(data.liked);
      });

    fetch(`/api/saved-patterns?flyPatternId=${flyPatternId}`)
      .then((r) => {
        if (!r.ok) return { saved: false };
        return r.json();
      })
      .then((data) => setSaved(data.saved));
  }, [flyPatternId]);

  async function toggleLike() {
    setLoading(true);
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flyPatternId }),
    });

    if (res.ok) {
      const data = await res.json();
      setLikeCount(data.count);
      setLiked(data.liked);
    }
    setLoading(false);
  }

  async function toggleSave() {
    setLoading(true);
    const res = await fetch("/api/saved-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flyPatternId }),
    });

    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          liked
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill={liked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        {likeCount}
      </button>

      <button
        onClick={toggleSave}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          saved
            ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
