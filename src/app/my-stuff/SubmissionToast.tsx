"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function SubmissionToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("submitted") === "1") {
      setVisible(true);
      // Clean URL without triggering a Next.js server re-render
      window.history.replaceState({}, "", "/my-stuff");
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
      <svg className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
      <p className="text-sm font-medium text-green-800 dark:text-green-300">
        Thanks for submitting your pattern! We&apos;ll review it and add it to the catalog.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="ml-auto text-green-400 hover:text-green-600 dark:hover:text-green-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
