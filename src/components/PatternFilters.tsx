"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
} from "@/lib/constants";

export function PatternFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const currentCategory = searchParams.get("category") ?? "";
  const currentDifficulty = searchParams.get("difficulty") ?? "";
  const currentWaterType = searchParams.get("waterType") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-8 space-y-4">
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchRef.current) {
            updateParams("search", searchRef.current.value);
          }
        }}
        className="relative"
      >
        <label htmlFor="search" className="sr-only">
          Search patterns
        </label>
        <input
          ref={searchRef}
          id="search"
          type="text"
          placeholder="Search fly patterns..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="Search"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </form>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-4">
        <FilterSelect
          label="Category"
          value={currentCategory}
          options={CATEGORY_LABELS}
          onChange={(value) => updateParams("category", value)}
        />
        <FilterSelect
          label="Difficulty"
          value={currentDifficulty}
          options={DIFFICULTY_LABELS}
          onChange={(value) => updateParams("difficulty", value)}
        />
        <FilterSelect
          label="Water Type"
          value={currentWaterType}
          options={WATER_TYPE_LABELS}
          onChange={(value) => updateParams("waterType", value)}
        />
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="min-w-[160px]">
      <label
        htmlFor={`filter-${label}`}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id={`filter-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All {label.endsWith("y") ? label.slice(0, -1) + "ies" : label + "s"}</option>
        {Object.entries(options).map(([key, displayLabel]) => (
          <option key={key} value={key}>
            {displayLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
