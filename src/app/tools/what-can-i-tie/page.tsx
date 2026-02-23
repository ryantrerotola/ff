"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MATERIAL_TYPE_LABELS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/constants";

interface MaterialResult {
  id: string;
  name: string;
  type: string;
}

interface PatternResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty: string;
}

interface AlmostThereResult extends PatternResult {
  totalRequired: number;
  ownedCount: number;
  missing: Array<{ id: string; name: string; type: string }>;
}

interface MatchResults {
  canTie: PatternResult[];
  almostThere: AlmostThereResult[];
}

export default function WhatCanITiePage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MaterialResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected materials
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialResult[]>(
    []
  );

  // Results state
  const [results, setResults] = useState<MatchResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced material search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setSearching(true);
      fetch(
        `/api/tools/materials-search?q=${encodeURIComponent(searchQuery.trim())}`
      )
        .then((r) => r.json())
        .then((d) => setSearchResults(d.materials || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const selectedIds = new Set(selectedMaterials.map((m) => m.id));

  function addMaterial(material: MaterialResult) {
    if (selectedIds.has(material.id)) return;
    setSelectedMaterials((prev) => [...prev, material]);
  }

  function removeMaterial(materialId: string) {
    setSelectedMaterials((prev) => prev.filter((m) => m.id !== materialId));
    // Clear results when materials change
    setResults(null);
    setHasSearched(false);
  }

  function clearAll() {
    setSelectedMaterials([]);
    setResults(null);
    setHasSearched(false);
  }

  const findPatterns = useCallback(async () => {
    if (selectedMaterials.length === 0) return;

    setLoadingResults(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/tools/what-can-i-tie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialIds: selectedMaterials.map((m) => m.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults({ canTie: [], almostThere: [] });
      }
    } catch {
      setResults({ canTie: [], almostThere: [] });
    } finally {
      setLoadingResults(false);
    }
  }, [selectedMaterials]);

  // Group selected materials by type
  const groupedSelected: Record<string, MaterialResult[]> = {};
  for (const m of selectedMaterials) {
    if (!groupedSelected[m.type]) groupedSelected[m.type] = [];
    groupedSelected[m.type]!.push(m);
  }

  // Filter search results to exclude already-selected materials
  const filteredSearchResults = searchResults.filter(
    (m) => !selectedIds.has(m.id)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          What Can I Tie?
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select the materials you have on hand and discover which fly patterns
          you can tie right now.
        </p>
      </div>

      {/* Material Search */}
      <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Search &amp; Add Materials
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by material name..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          {searching && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Searching...
            </p>
          )}
          {filteredSearchResults.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSearchResults.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => addMaterial(material)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {material.name}
                      </span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {MATERIAL_TYPE_LABELS[material.type] || material.type}
                      </span>
                    </div>
                    <svg
                      className="h-4 w-4 text-brand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchQuery.trim() &&
            !searching &&
            searchResults.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No materials found for &quot;{searchQuery}&quot;
              </p>
            )}
        </div>
      </div>

      {/* Selected Materials */}
      {selectedMaterials.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Selected Materials ({selectedMaterials.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {Object.entries(groupedSelected).map(([type, materials]) => (
              <div key={type}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {MATERIAL_TYPE_LABELS[type] || type}
                </h4>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <span
                      key={material.id}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700"
                    >
                      {material.name}
                      <button
                        onClick={() => removeMaterial(material.id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200 dark:hover:bg-brand-800"
                        title={`Remove ${material.name}`}
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Find Patterns Button */}
          <div className="mt-6">
            <button
              onClick={findPatterns}
              disabled={loadingResults}
              className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingResults ? "Searching..." : "Find Patterns"}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedMaterials.length === 0 && !hasSearched && (
        <div className="mt-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
            No materials selected
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Use the search box above to find and add the materials you have on
            hand.
          </p>
        </div>
      )}

      {/* Results */}
      {hasSearched && results && (
        <div className="mt-8 space-y-8">
          {/* Ready to Tie */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ready to Tie
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You have all the required materials for these patterns.
            </p>

            {results.canTie.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {results.canTie.map((pattern) => (
                  <Link
                    key={pattern.id}
                    href={`/patterns/${pattern.slug}`}
                    className="rounded-md border border-green-200 bg-green-50 p-3 transition hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:hover:border-green-700 dark:hover:bg-green-900/30"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {pattern.name}
                    </div>
                    <div className="mt-1 text-xs text-green-700 dark:text-green-400">
                      {CATEGORY_LABELS[pattern.category] || pattern.category}
                      {" -- "}
                      {DIFFICULTY_LABELS[pattern.difficulty] ||
                        pattern.difficulty}
                    </div>
                    <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                      Ready to tie
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-gray-200 p-6 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No patterns found with all required materials. Try adding more
                  materials or check the &quot;Almost There&quot; section below.
                </p>
              </div>
            )}
          </section>

          {/* Almost There */}
          {results.almostThere.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Almost There
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You&apos;re just a few materials away from tying these patterns.
              </p>
              <div className="mt-3 space-y-3">
                {results.almostThere.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/patterns/${pattern.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                        >
                          {pattern.name}
                        </Link>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {CATEGORY_LABELS[pattern.category] ||
                            pattern.category}
                          {" -- "}
                          {DIFFICULTY_LABELS[pattern.difficulty] ||
                            pattern.difficulty}
                          {" -- "}
                          {pattern.ownedCount}/{pattern.totalRequired} materials
                        </div>
                      </div>
                      {/* Progress indicator */}
                      <div className="ml-4 flex items-center gap-1">
                        {Array.from({ length: pattern.totalRequired }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full ${
                                i < pattern.ownedCount
                                  ? "bg-brand-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        Missing:
                      </span>
                      {pattern.missing.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 ring-1 ring-amber-300 dark:bg-gray-800 dark:text-gray-200 dark:ring-amber-600"
                        >
                          {m.name}{" "}
                          <span className="ml-1 text-gray-400 dark:text-gray-500">
                            ({MATERIAL_TYPE_LABELS[m.type] || m.type})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No results at all */}
          {results.canTie.length === 0 &&
            results.almostThere.length === 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No matching patterns found. Try adding more materials to see
                  results.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Loading Results */}
      {loadingResults && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      )}
    </div>
  );
}
