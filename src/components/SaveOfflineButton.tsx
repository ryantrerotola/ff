"use client";

import { useEffect, useState } from "react";
import {
  isPatternSavedOffline,
  savePatternOffline,
  removePatternOffline,
} from "@/lib/offline-db";

interface SaveOfflineButtonProps {
  pattern: {
    id: string;
    slug: string;
    name: string;
    category: string;
    difficulty: string;
    waterType: string;
    description: string;
    origin: string | null;
    materials: unknown[];
    variations: unknown[];
    resources: unknown[];
  };
}

export function SaveOfflineButton({ pattern }: SaveOfflineButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isPatternSavedOffline(pattern.id)
      .then(setSaved)
      .finally(() => setLoading(false));
  }, [pattern.id]);

  async function handleToggle() {
    setLoading(true);
    if (saved) {
      await removePatternOffline(pattern.id);
      setSaved(false);
    } else {
      await savePatternOffline(pattern);
      setSaved(true);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <button
        disabled
        className="flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-400"
      >
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        saved
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
      title={saved ? "Remove offline copy" : "Save for offline use"}
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
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      {saved ? "Saved Offline" : "Save Offline"}
    </button>
  );
}
