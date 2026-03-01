"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/?${params.toString()}`;
  }

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav
      className="mt-8 flex flex-col items-center gap-3"
      aria-label="Pagination"
    >
      <div className="flex items-center gap-1.5">
        {/* First */}
        <Link
          href={buildHref(1)}
          className={btnClass}
          aria-label="First page"
          aria-disabled={currentPage === 1}
          {...(currentPage === 1 && { tabIndex: -1, style: { pointerEvents: "none", opacity: 0.4 } })}
        >
          First
        </Link>

        {/* Previous */}
        <Link
          href={buildHref(Math.max(1, currentPage - 1))}
          className={btnClass}
          aria-label="Previous page"
          aria-disabled={currentPage === 1}
          {...(currentPage === 1 && { tabIndex: -1, style: { pointerEvents: "none", opacity: 0.4 } })}
        >
          Prev
        </Link>

        {/* Page numbers */}
        {pages[0]! > 1 && (
          <span className="px-1 text-sm text-gray-400 dark:text-gray-500">...</span>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(page)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              page === currentPage
                ? "bg-brand-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {page}
          </Link>
        ))}

        {pages[pages.length - 1]! < totalPages && (
          <span className="px-1 text-sm text-gray-400 dark:text-gray-500">...</span>
        )}

        {/* Next */}
        <Link
          href={buildHref(Math.min(totalPages, currentPage + 1))}
          className={btnClass}
          aria-label="Next page"
          aria-disabled={currentPage === totalPages}
          {...(currentPage === totalPages && { tabIndex: -1, style: { pointerEvents: "none", opacity: 0.4 } })}
        >
          Next
        </Link>

        {/* Last */}
        <Link
          href={buildHref(totalPages)}
          className={btnClass}
          aria-label="Last page"
          aria-disabled={currentPage === totalPages}
          {...(currentPage === totalPages && { tabIndex: -1, style: { pointerEvents: "none", opacity: 0.4 } })}
        >
          Last
        </Link>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </p>
    </nav>
  );
}
