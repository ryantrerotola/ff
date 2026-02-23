"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
  MATERIAL_TYPE_LABELS,
} from "@/lib/constants";
import type { FlyPatternDetail, FlyPatternListItem } from "@/lib/types";

type ComparePattern = FlyPatternDetail;

interface SearchResult {
  data: FlyPatternListItem[];
}

const MATERIAL_POSITIONS = [
  "hook",
  "thread",
  "tail",
  "body",
  "rib",
  "thorax",
  "wing",
  "hackle",
  "bead",
  "weight",
  "other",
] as const;

function CompareRow({
  label,
  patterns,
  getValue,
}: {
  label: string;
  patterns: ComparePattern[];
  getValue: (p: ComparePattern) => string;
}) {
  const values = patterns.map(getValue);
  const different = values.some((v) => v !== values[0]);
  return (
    <tr
      className={
        different
          ? "bg-amber-50 dark:bg-amber-900/20"
          : "bg-white dark:bg-gray-900"
      }
    >
      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
        {label}
      </td>
      {patterns.map((p, i) => (
        <td
          key={p.id}
          className="px-4 py-3 text-gray-900 dark:text-gray-100"
        >
          {values[i]}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<ComparePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FlyPatternListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search patterns as the user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/patterns?search=${encodeURIComponent(searchQuery.trim())}&limit=8`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data: SearchResult = await res.json();
          setSearchResults(data.data);
          setShowDropdown(true);
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  // Fetch full pattern details when slugs change
  const fetchComparison = useCallback(async (slugs: string[]) => {
    if (slugs.length < 2) {
      setPatterns([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/compare?slugs=${slugs.join(",")}`
      );
      if (res.ok) {
        const data: ComparePattern[] = await res.json();
        setPatterns(data);
      }
    } catch {
      // Network error — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  function addPattern(slug: string) {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 3) return;
    const next = [...selectedSlugs, slug];
    setSelectedSlugs(next);
    setSearchQuery("");
    setShowDropdown(false);
    if (next.length >= 2) {
      fetchComparison(next);
    }
  }

  function removePattern(slug: string) {
    const next = selectedSlugs.filter((s) => s !== slug);
    setSelectedSlugs(next);
    if (next.length >= 2) {
      fetchComparison(next);
    } else {
      setPatterns([]);
    }
  }

  /** Return the material name(s) for a given type in a pattern */
  function getMaterialsForType(
    pattern: ComparePattern,
    materialType: string
  ): string {
    const items = pattern.materials
      .filter((pm) => pm.material.type === materialType)
      .map((pm) => {
        let name = pm.material.name;
        if (pm.customColor) name += ` (${pm.customColor})`;
        if (pm.customSize) name += ` [${pm.customSize}]`;
        return name;
      });
    return items.length > 0 ? items.join(", ") : "—";
  }

  // Gather which material types actually appear in any compared pattern
  const usedMaterialTypes =
    patterns.length > 0
      ? MATERIAL_POSITIONS.filter((type) =>
          patterns.some((p) =>
            p.materials.some((pm) => pm.material.type === type)
          )
        )
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Compare Patterns
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select 2 or 3 fly patterns to compare their materials, difficulty, and
          attributes side by side.
        </p>
      </div>

      {/* Pattern selector */}
      <div className="mb-8" ref={searchRef}>
        <label
          htmlFor="pattern-search"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search and add patterns ({selectedSlugs.length}/3 selected)
        </label>
        <div className="relative">
          <input
            id="pattern-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            disabled={selectedSlugs.length >= 3}
            placeholder={
              selectedSlugs.length >= 3
                ? "Maximum 3 patterns selected"
                : "Type a pattern name..."
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-brand-400 dark:disabled:bg-gray-700"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
            </div>
          )}
          {showDropdown && searchResults.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {searchResults
                .filter((r) => !selectedSlugs.includes(r.slug))
                .map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => addPattern(result.slug)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {CATEGORY_LABELS[result.category]} &middot;{" "}
                        {DIFFICULTY_LABELS[result.difficulty]}
                      </span>
                    </button>
                  </li>
                ))}
              {searchResults.filter((r) => !selectedSlugs.includes(r.slug))
                .length === 0 && (
                <li className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  All results already selected
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Selected pattern chips */}
      {selectedSlugs.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedSlugs.map((slug) => {
            const match =
              patterns.find((p) => p.slug === slug) ||
              searchResults.find((r) => r.slug === slug);
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
              >
                {match?.name ?? slug}
                <button
                  type="button"
                  onClick={() => removePattern(slug)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand-200 dark:hover:bg-brand-800"
                  aria-label={`Remove ${match?.name ?? slug}`}
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Comparison table */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-600" />
        </div>
      )}

      {!loading && selectedSlugs.length < 2 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Add at least 2 patterns above to see a comparison.
          </p>
        </div>
      )}

      {!loading && patterns.length >= 2 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Attribute
                </th>
                {patterns.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300"
                  >
                    <Link
                      href={`/patterns/${p.slug}`}
                      className="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Category */}
              <CompareRow
                label="Category"
                patterns={patterns}
                getValue={(p) => CATEGORY_LABELS[p.category] ?? p.category}
              />

              {/* Difficulty */}
              <CompareRow
                label="Difficulty"
                patterns={patterns}
                getValue={(p) => DIFFICULTY_LABELS[p.difficulty] ?? p.difficulty}
              />

              {/* Water Type */}
              <CompareRow
                label="Water Type"
                patterns={patterns}
                getValue={(p) => WATER_TYPE_LABELS[p.waterType] ?? p.waterType}
              />

              {/* Material positions */}
              {usedMaterialTypes.map((materialType) => (
                <CompareRow
                  key={materialType}
                  label={MATERIAL_TYPE_LABELS[materialType] ?? materialType}
                  patterns={patterns}
                  getValue={(p) => getMaterialsForType(p, materialType)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link back */}
      <div className="mt-8">
        <Link
          href="/"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          &larr; Back to all patterns
        </Link>
      </div>
    </div>
  );
}
