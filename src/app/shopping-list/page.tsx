"use client";

import { useCallback, useEffect, useState } from "react";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";

interface SavedPattern {
  id: string;
  flyPattern: {
    id: string;
    name: string;
    slug: string;
    category: string;
    difficulty: string;
    waterType: string;
    description: string;
  };
}

interface ShoppingMaterial {
  material: {
    id: string;
    name: string;
    type: string;
    description: string | null;
  };
  patterns: string[];
  owned: boolean;
  affiliateLinks: Array<{
    id: string;
    retailer: string;
    url: string;
    commissionType: string;
  }>;
}

export default function ShoppingListPage() {
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<ShoppingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOwned, setShowOwned] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      try {
        const res = await fetch("/api/saved-patterns");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to access your shopping list.");
            return;
          }
          throw new Error("Failed to load saved patterns");
        }
        const data: SavedPattern[] = await res.json();
        setSavedPatterns(data);
        setSelectedIds(new Set(data.map((sp) => sp.flyPattern.id)));
      } catch {
        setError("Failed to load saved patterns.");
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, []);

  const togglePattern = (patternId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(patternId)) next.delete(patternId);
      else next.add(patternId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === savedPatterns.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(savedPatterns.map((sp) => sp.flyPattern.id)));
  };

  const generateList = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed to generate list");
      const data = await res.json();
      setMaterials(data.materials);
    } catch {
      setError("Failed to generate shopping list.");
    } finally {
      setGenerating(false);
    }
  }, [selectedIds]);

  const neededMaterials = materials.filter((m) => !m.owned);
  const ownedMaterials = materials.filter((m) => m.owned);

  // Group by type
  function groupByType(items: ShoppingMaterial[]) {
    return items.reduce<Record<string, ShoppingMaterial[]>>((acc, item) => {
      const type = item.material.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});
  }

  const groupedNeeded = groupByType(neededMaterials);
  const groupedOwned = groupByType(ownedMaterials);

  const formatPlainText = () => {
    const lines: string[] = ["Shopping List — Materials to Buy", "=".repeat(40), ""];
    for (const [type, items] of Object.entries(groupedNeeded)) {
      lines.push(MATERIAL_TYPE_LABELS[type] ?? type);
      lines.push("-".repeat(20));
      for (const item of items) {
        lines.push(`  [ ] ${item.material.name}`);
        lines.push(`      Used in: ${item.patterns.join(", ")}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-12 rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        To Tie &amp; Shopping List
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Select patterns you want to tie. We&apos;ll show what materials you already have and what you still need.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {savedPatterns.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 p-6 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No saved patterns yet. Browse patterns and save them to build your tying queue.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Patterns to Tie
              </h2>
              <button
                onClick={toggleAll}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {selectedIds.size === savedPatterns.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {savedPatterns.map((sp) => (
                <label
                  key={sp.flyPattern.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(sp.flyPattern.id)}
                    onChange={() => togglePattern(sp.flyPattern.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {sp.flyPattern.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sp.flyPattern.category} &middot; {sp.flyPattern.difficulty}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={generateList}
              disabled={selectedIds.size === 0 || generating}
              className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              {generating
                ? "Generating..."
                : `Generate Materials List (${selectedIds.size} pattern${selectedIds.size === 1 ? "" : "s"})`}
            </button>
          </section>

          {materials.length > 0 && (
            <>
              {/* Summary */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 text-center dark:border-gray-700">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{materials.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Materials</div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
                  <div className="text-xl font-bold text-green-700 dark:text-green-400">{ownedMaterials.length}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Already Own</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{neededMaterials.length}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Need to Buy</div>
                </div>
              </div>

              {/* Need to Buy */}
              {neededMaterials.length > 0 && (
                <section className="mt-6 print:mt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                      Need to Buy ({neededMaterials.length})
                    </h2>
                    <div className="flex gap-2 print:hidden">
                      <button
                        onClick={copyToClipboard}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        {copied ? "Copied!" : "Copy List"}
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Print
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-6">
                    {Object.entries(groupedNeeded).map(([type, items]) => (
                      <div key={type}>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {MATERIAL_TYPE_LABELS[type] ?? type}
                        </h3>
                        <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                          {items.map((item) => (
                            <li key={item.material.id} className="flex items-center justify-between px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.material.name}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  Used in: {item.patterns.join(", ")}
                                </div>
                              </div>
                              <div className="ml-4 flex shrink-0 gap-2 print:hidden">
                                {item.affiliateLinks.map((link) => (
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
                                  >
                                    {link.retailer}
                                  </a>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Already Own */}
              {ownedMaterials.length > 0 && (
                <section className="mt-6">
                  <button
                    onClick={() => setShowOwned(!showOwned)}
                    className="flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-400"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showOwned ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    Already Own ({ownedMaterials.length})
                  </button>

                  {showOwned && (
                    <div className="mt-4 space-y-6">
                      {Object.entries(groupedOwned).map(([type, items]) => (
                        <div key={type}>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {MATERIAL_TYPE_LABELS[type] ?? type}
                          </h3>
                          <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-green-200 bg-green-50/50 dark:divide-gray-700 dark:border-green-800 dark:bg-green-900/10">
                            {items.map((item) => (
                              <li key={item.material.id} className="flex items-center justify-between px-4 py-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    {item.material.name}
                                  </div>
                                  <div className="mt-0.5 pl-6 text-xs text-gray-500 dark:text-gray-400">
                                    Used in: {item.patterns.join(", ")}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
