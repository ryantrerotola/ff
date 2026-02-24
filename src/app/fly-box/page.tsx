"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MATERIAL_TYPE_LABELS, CATEGORY_LABELS } from "@/lib/constants";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface InventoryMaterial {
  id: string;
  materialId: string;
  name: string;
  type: string;
  quantity: string | null;
  notes: string | null;
}

interface CanTiePattern {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface AlmostTherePattern {
  id: string;
  name: string;
  slug: string;
  category: string;
  totalMaterials: number;
  ownedCount: number;
  missing: Array<{ id: string; name: string; type: string }>;
}

interface SearchMaterial {
  id: string;
  name: string;
  type: string;
  owned: boolean;
}

interface FlyBoxData {
  inventory: Record<string, InventoryMaterial[]>;
  totalMaterials: number;
  canTie: CanTiePattern[];
  almostThere: AlmostTherePattern[];
}

export default function FlyBoxPage() {
  const [data, setData] = useState<FlyBoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMaterial[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Active section filter
  const [activeType, setActiveType] = useState<string | "all">("all");

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ message: string; materials?: Array<{ id: string; name: string; type: string }> } | null>(null);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setScanResult(null);

    try {
      const res = await fetch("/api/fly-box/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });

      const data = await res.json();

      if (data.matched && data.materials?.length > 0) {
        // Auto-add first matched material
        const material = data.materials[0];
        await addMaterial(material.id);
        setScanResult({
          message: `Added "${material.name}" from barcode scan (${data.productName})`,
          materials: data.materials.slice(1),
        });
      } else {
        setScanResult({
          message: data.message || `Barcode ${barcode} not found. Try searching manually.`,
        });
        setShowSearch(true);
        setSearchQuery(data.productName || barcode);
      }
    } catch {
      setScanResult({ message: "Barcode lookup failed. Try searching manually." });
      setShowSearch(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/fly-box")
      .then((r) => {
        if (r.status === 401) {
          setError("Please log in to view your fly box.");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError("Failed to load fly box"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setSearching(true);
      fetch(`/api/fly-box?search=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.materials || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function addMaterial(materialId: string) {
    const res = await fetch("/api/fly-box", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId }),
    });

    if (res.ok) {
      // Mark as owned in search results
      setSearchResults((prev) =>
        prev.map((m) => (m.id === materialId ? { ...m, owned: true } : m))
      );
      fetchData();
    }
  }

  async function removeMaterial(materialId: string) {
    const res = await fetch("/api/fly-box", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId }),
    });

    if (res.ok) {
      // Mark as not owned in search results
      setSearchResults((prev) =>
        prev.map((m) => (m.id === materialId ? { ...m, owned: false } : m))
      );
      fetchData();
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Fly Box
          </h1>
          <p className="mt-4 text-gray-500 dark:text-gray-400">{error}</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Fly Box
        </h1>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  const typeKeys = Object.keys(data.inventory);
  const filteredInventory =
    activeType === "all"
      ? data.inventory
      : { [activeType]: data.inventory[activeType] || [] };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Fly Box
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your material inventory and see what you can tie.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Scan barcode to add material"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h3v3h-3v-3z" />
            </svg>
            Scan
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showSearch ? "Close" : "Add Materials"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.totalMaterials}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Materials Owned
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
          <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
            {data.canTie.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Patterns You Can Tie
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {data.almostThere.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Almost There
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="mt-4 rounded-md border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-start justify-between">
            <p className="text-sm text-brand-700 dark:text-brand-300">{scanResult.message}</p>
            <button
              onClick={() => setScanResult(null)}
              className="ml-2 shrink-0 text-brand-400 hover:text-brand-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {scanResult.materials && scanResult.materials.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-brand-600 dark:text-brand-400">Also matched:</span>
              {scanResult.materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addMaterial(m.id)}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-300 hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-300 dark:ring-brand-600"
                >
                  + {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search / Add Materials */}
      {showSearch && (
        <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Search Materials to Add
          </h3>
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
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {searchResults.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {material.name}
                      </span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {MATERIAL_TYPE_LABELS[material.type] || material.type}
                      </span>
                    </div>
                    {material.owned ? (
                      <button
                        onClick={() => removeMaterial(material.id)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => addMaterial(material.id)}
                        className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No materials found for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Inventory Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inventory
        </h2>

        {data.totalMaterials === 0 ? (
          <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
            <p>Your fly box is empty.</p>
            <p className="mt-1 text-sm">
              Click &quot;Add Materials&quot; above to start building your
              inventory.
            </p>
          </div>
        ) : (
          <>
            {/* Type filter pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveType("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeType === "all"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                All ({data.totalMaterials})
              </button>
              {typeKeys.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeType === type
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {MATERIAL_TYPE_LABELS[type] || type} (
                  {data.inventory[type]?.length ?? 0})
                </button>
              ))}
            </div>

            {/* Material groups */}
            <div className="mt-4 space-y-6">
              {Object.entries(filteredInventory).map(([type, materials]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {MATERIAL_TYPE_LABELS[type] || type}
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="group flex items-center justify-between rounded-md border border-gray-200 p-3 transition hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-600"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {material.name}
                          </div>
                          {material.quantity && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {material.quantity}
                            </div>
                          )}
                          {material.notes && (
                            <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                              {material.notes}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeMaterial(material.materialId)}
                          className="ml-2 shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400"
                          title="Remove from fly box"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Patterns You Can Tie */}
      {data.canTie.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Patterns You Can Tie
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You have all the required materials for these patterns.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.canTie.map((pattern) => (
              <Link
                key={pattern.id}
                href={`/patterns/${pattern.slug}`}
                className="rounded-md border border-green-200 bg-green-50 p-3 transition hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:hover:border-green-700 dark:hover:bg-green-900/30"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {pattern.name}
                </div>
                <div className="mt-1 text-xs text-green-700 dark:text-green-400">
                  {CATEGORY_LABELS[pattern.category] || pattern.category} --
                  Ready to tie
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Almost There */}
      {data.almostThere.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Almost There
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You&apos;re just a few materials away from tying these patterns.
          </p>
          <div className="mt-3 space-y-3">
            {data.almostThere.map((pattern) => (
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
                      {CATEGORY_LABELS[pattern.category] || pattern.category} --{" "}
                      {pattern.ownedCount}/{pattern.totalMaterials} materials
                    </div>
                  </div>
                  {/* Progress indicator */}
                  <div className="ml-4 flex items-center gap-1">
                    {Array.from({ length: pattern.totalMaterials }).map(
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Missing:
                  </span>
                  {pattern.missing.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addMaterial(m.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 shadow-sm ring-1 ring-amber-300 transition hover:bg-brand-50 hover:ring-brand-400 dark:bg-gray-800 dark:text-gray-200 dark:ring-amber-600 dark:hover:bg-brand-900/20 dark:hover:ring-brand-500"
                      title={`Add ${m.name} to your fly box`}
                    >
                      <svg
                        className="h-3 w-3 text-brand-500"
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
                      {m.name}{" "}
                      <span className="text-gray-400 dark:text-gray-500">
                        ({MATERIAL_TYPE_LABELS[m.type] || m.type})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
