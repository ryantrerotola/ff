"use client";

import { useCallback, useEffect, useState } from "react";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";

interface AffiliateLink {
  id: string;
  retailer: string;
  url: string;
}

interface CartMaterial {
  id: string;
  name: string;
  type: string;
  description: string | null;
  affiliateLinks: AffiliateLink[];
}

interface CartItem {
  id: string;
  materialId: string;
  quantity: number;
  notes: string | null;
  purchased: boolean;
  createdAt: string;
  material: CartMaterial;
}

interface MaterialSearchResult {
  id: string;
  name: string;
  type: string;
}

export default function ToBuyPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add material
  const [materialSearch, setMaterialSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MaterialSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addNotes, setAddNotes] = useState("");

  // Edit item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  // Filter
  const [showPurchased, setShowPurchased] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/to-buy");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to manage your shopping list.");
          return;
        }
        throw new Error("Failed to load cart");
      }
      const data: CartItem[] = await res.json();
      setItems(data);
      setError(null);
    } catch {
      setError("Failed to load shopping list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function searchMaterials(query: string) {
    setMaterialSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/tools/materials-search?q=${encodeURIComponent(query)}&limit=10`,
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(
        (data.materials ?? data).map((m: MaterialSearchResult) => ({
          id: m.id,
          name: m.name,
          type: m.type,
        })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddMaterial(materialId: string) {
    try {
      const res = await fetch("/api/to-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          quantity: addQuantity,
          notes: addNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setMaterialSearch("");
      setSearchResults([]);
      setAddQuantity(1);
      setAddNotes("");
      await fetchItems();
    } catch {
      setError("Failed to add material.");
    }
  }

  async function handleTogglePurchased(id: string, purchased: boolean) {
    try {
      const res = await fetch(`/api/to-buy/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased: !purchased }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchItems();
    } catch {
      setError("Failed to update item.");
    }
  }

  async function handleRemoveItem(id: string) {
    try {
      const res = await fetch(`/api/to-buy/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      await fetchItems();
    } catch {
      setError("Failed to remove item.");
    }
  }

  async function handleSaveEdit(id: string) {
    try {
      const res = await fetch(`/api/to-buy/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: editQuantity,
          notes: editNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      await fetchItems();
    } catch {
      setError("Failed to update item.");
    }
  }

  async function handleClearPurchased() {
    if (!confirm("Remove all purchased items from the list?")) return;
    const purchased = items.filter((i) => i.purchased);
    for (const item of purchased) {
      await fetch(`/api/to-buy/${item.id}`, { method: "DELETE" });
    }
    await fetchItems();
  }

  function startEdit(item: CartItem) {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
    setEditNotes(item.notes ?? "");
  }

  const unpurchased = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  // Group by material type
  function groupByType(list: CartItem[]) {
    return list.reduce<Record<string, CartItem[]>>((acc, item) => {
      const type = item.material.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});
  }

  const groupedUnpurchased = groupByType(unpurchased);
  const groupedPurchased = groupByType(purchased);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        To Buy List
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Keep a running list of materials you need to pick up. Mark them off as you buy them.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* Add material */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Material to Cart
        </h3>
        <input
          type="text"
          value={materialSearch}
          onChange={(e) => searchMaterials(e.target.value)}
          placeholder="Search materials (e.g. dubbing, hackle, TMC 100)..."
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />

        {searching && <p className="mt-2 text-xs text-gray-500">Searching...</p>}

        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {searchResults.map((m) => {
              const alreadyInCart = items.some((i) => i.materialId === m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 p-2 dark:border-gray-700"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {m.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {MATERIAL_TYPE_LABELS[m.type] ?? m.type}
                    </span>
                  </div>
                  {alreadyInCart ? (
                    <span className="text-xs text-gray-400">In cart</span>
                  ) : (
                    <button
                      onClick={() => handleAddMaterial(m.id)}
                      className="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              );
            })}

            <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">Qty</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="mb-0.5 block text-xs text-gray-500">Notes</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="e.g. running low, need size 14"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 p-3 text-center dark:border-gray-700">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {items.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Items</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {unpurchased.length}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">Need to Buy</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
            <div className="text-xl font-bold text-green-700 dark:text-green-400">
              {purchased.length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Purchased</div>
          </div>
        </div>
      )}

      {/* Unpurchased items */}
      {unpurchased.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
            Need to Buy ({unpurchased.length})
          </h2>
          <div className="mt-4 space-y-6">
            {Object.entries(groupedUnpurchased).map(([type, typeItems]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {MATERIAL_TYPE_LABELS[type] ?? type}
                </h3>
                <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                  {typeItems.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePurchased(item.id, item.purchased)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 hover:border-brand-400 dark:border-gray-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.material.name}
                            {item.quantity > 1 && (
                              <span className="ml-1 text-xs text-gray-500">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {item.material.affiliateLinks.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-brand-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-brand-700"
                            >
                              {link.retailer}
                            </a>
                          ))}
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Inline edit */}
                      {editingId === item.id && (
                        <div className="mt-2 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                          <div>
                            <label className="mb-0.5 block text-xs text-gray-500">Qty</label>
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(Math.max(1, Number(e.target.value)))}
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-0.5 block text-xs text-gray-500">Notes</label>
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="optional notes"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Purchased items */}
      {purchased.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPurchased(!showPurchased)}
              className="flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-400"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showPurchased ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              Purchased ({purchased.length})
            </button>
            <button
              onClick={handleClearPurchased}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear purchased
            </button>
          </div>

          {showPurchased && (
            <div className="mt-4 space-y-6">
              {Object.entries(groupedPurchased).map(([type, typeItems]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {MATERIAL_TYPE_LABELS[type] ?? type}
                  </h3>
                  <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-green-200 bg-green-50/50 dark:divide-gray-700 dark:border-green-800 dark:bg-green-900/10">
                    {typeItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => handleTogglePurchased(item.id, item.purchased)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-green-500 bg-green-500 text-white"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-500 line-through dark:text-gray-400">
                            {item.material.name}
                            {item.quantity > 1 && (
                              <span className="ml-1 text-xs">x{item.quantity}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {items.length === 0 && (
        <div className="mt-6 rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your shopping cart is empty. Search for materials above to add them, or check your{" "}
            <a href="/to-tie" className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
              To Tie lists
            </a>{" "}
            for materials you might need.
          </p>
        </div>
      )}
    </div>
  );
}
