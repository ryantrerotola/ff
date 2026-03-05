"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";

interface PatternImage {
  url: string;
}

interface TyingListItemPattern {
  id: string;
  name: string;
  slug: string;
  category: string;
  images: PatternImage[];
}

interface TyingListItem {
  id: string;
  flyPatternId: string;
  quantity: number;
  colors: string | null;
  notes: string | null;
  completed: boolean;
  flyPattern: TyingListItemPattern;
}

interface TyingList {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items: TyingListItem[];
  _count: { items: number };
}

interface PatternSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export default function ToTiePage() {
  const [lists, setLists] = useState<TyingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create list
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Active list detail
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Add pattern to list
  const [patternSearch, setPatternSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PatternSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addColors, setAddColors] = useState("");
  const [addNotes, setAddNotes] = useState("");

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editColors, setEditColors] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Rename list
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/tying-lists");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to manage your tying lists.");
          return;
        }
        throw new Error("Failed to load lists");
      }
      const data: TyingList[] = await res.json();
      setLists(data);
      setError(null);
    } catch {
      setError("Failed to load tying lists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tying-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDesc.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      setNewListName("");
      setNewListDesc("");
      setShowCreate(false);
      await fetchLists();
    } catch {
      setError("Failed to create list.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteList(listId: string) {
    if (!confirm("Delete this list and all its items?")) return;
    try {
      const res = await fetch(`/api/tying-lists/${listId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete list");
      if (activeListId === listId) setActiveListId(null);
      await fetchLists();
    } catch {
      setError("Failed to delete list.");
    }
  }

  async function handleRenameList(listId: string) {
    if (!renameValue.trim()) return;
    try {
      const res = await fetch(`/api/tying-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      setRenamingListId(null);
      setRenameValue("");
      await fetchLists();
    } catch {
      setError("Failed to rename list.");
    }
  }

  async function searchPatterns(query: string) {
    setPatternSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/patterns?search=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const patterns = data.data ?? data.patterns ?? data;
      setSearchResults(
        (Array.isArray(patterns) ? patterns : []).map((p: PatternSearchResult) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
        })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddPattern(patternId: string) {
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/tying-lists/${activeListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flyPatternId: patternId,
          quantity: addQuantity,
          colors: addColors.trim() || undefined,
          notes: addNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add pattern");
      setPatternSearch("");
      setSearchResults([]);
      setAddQuantity(1);
      setAddColors("");
      setAddNotes("");
      await fetchLists();
    } catch {
      setError("Failed to add pattern to list.");
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/tying-lists/${activeListId}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      await fetchLists();
    } catch {
      setError("Failed to remove item.");
    }
  }

  async function handleToggleCompleted(itemId: string, completed: boolean) {
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/tying-lists/${activeListId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchLists();
    } catch {
      setError("Failed to update item.");
    }
  }

  async function handleSaveItemEdit(itemId: string) {
    if (!activeListId) return;
    try {
      const res = await fetch(`/api/tying-lists/${activeListId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: editQuantity,
          colors: editColors.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingItemId(null);
      await fetchLists();
    } catch {
      setError("Failed to update item.");
    }
  }

  function startEditItem(item: TyingListItem) {
    setEditingItemId(item.id);
    setEditQuantity(item.quantity);
    setEditColors(item.colors ?? "");
    setEditNotes(item.notes ?? "");
  }

  const activeList = lists.find((l) => l.id === activeListId);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            To Tie Lists
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create lists of patterns you want to tie with quantities and color preferences.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New List
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* Create List Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateList}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Create New List
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name (e.g. Spring Dries, Streamer Box)"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              required
            />
            <input
              type="text"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create List"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewListName("");
                  setNewListDesc("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lists sidebar */}
        <div className="space-y-2">
          {lists.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No lists yet. Create one to get started.
              </p>
            </div>
          ) : (
            lists.map((list) => (
              <div key={list.id}>
                {renamingListId === list.id ? (
                  <div className="flex gap-1 rounded-lg border border-brand-300 bg-white p-2 dark:border-brand-600 dark:bg-gray-900">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameList(list.id);
                        if (e.key === "Escape") setRenamingListId(null);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameList(list.id)}
                      className="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingListId(null)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveListId(list.id)}
                    className={`group w-full rounded-lg border p-3 text-left transition ${
                      activeListId === list.id
                        ? "border-brand-300 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {list.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {list._count.items} {list._count.items === 1 ? "pattern" : "patterns"}
                      </span>
                    </div>
                    {list.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {list.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingListId(list.id);
                          setRenameValue(list.name);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Active list detail */}
        <div>
          {!activeList ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lists.length > 0
                  ? "Select a list to view and manage its patterns."
                  : "Create a list to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeList.name}
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Updated {new Date(activeList.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Add pattern search */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add a Pattern
                </h3>
                <input
                  type="text"
                  value={patternSearch}
                  onChange={(e) => searchPatterns(e.target.value)}
                  placeholder="Search patterns..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

                {searching && (
                  <p className="mt-2 text-xs text-gray-500">Searching...</p>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.map((p) => {
                      const alreadyAdded = activeList.items.some(
                        (i) => i.flyPattern.id === p.id,
                      );
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-md border border-gray-100 p-2 dark:border-gray-700"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {p.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {CATEGORY_LABELS[p.category] ?? p.category}
                            </span>
                          </div>
                          {alreadyAdded ? (
                            <span className="text-xs text-gray-400">Already added</span>
                          ) : (
                            <button
                              onClick={() => handleAddPattern(p.id)}
                              className="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick options for adding */}
                {searchResults.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Quantity</label>
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
                      <label className="mb-0.5 block text-xs text-gray-500">Colors</label>
                      <input
                        type="text"
                        value={addColors}
                        onChange={(e) => setAddColors(e.target.value)}
                        placeholder="e.g. olive, tan, black"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-gray-500">Notes</label>
                      <input
                        type="text"
                        value={addNotes}
                        onChange={(e) => setAddNotes(e.target.value)}
                        placeholder="optional notes"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items list */}
              {activeList.items.length === 0 ? (
                <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No patterns in this list yet. Search above to add some.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeList.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg border bg-white shadow-sm transition dark:bg-gray-900 ${
                        item.completed
                          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => handleToggleCompleted(item.id, item.completed)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            item.completed
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 hover:border-brand-400 dark:border-gray-600"
                          }`}
                        >
                          {item.completed && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>

                        {item.flyPattern.images[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.flyPattern.images[0].url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                            ?
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/patterns/${item.flyPattern.slug}`}
                            className={`text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400 ${
                              item.completed
                                ? "text-gray-500 line-through dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {item.flyPattern.name}
                          </Link>
                          <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>{CATEGORY_LABELS[item.flyPattern.category] ?? item.flyPattern.category}</span>
                            <span>Qty: {item.quantity}</span>
                            {item.colors && <span>Colors: {item.colors}</span>}
                            {item.notes && <span>Note: {item.notes}</span>}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => startEditItem(item)}
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
                      {editingItemId === item.id && (
                        <div className="border-t border-gray-100 p-3 dark:border-gray-700">
                          <div className="flex flex-wrap items-end gap-3">
                            <div>
                              <label className="mb-0.5 block text-xs text-gray-500">Quantity</label>
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
                              <label className="mb-0.5 block text-xs text-gray-500">Colors</label>
                              <input
                                type="text"
                                value={editColors}
                                onChange={(e) => setEditColors(e.target.value)}
                                placeholder="e.g. olive, tan, black"
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                                onClick={() => handleSaveItemEdit(item.id)}
                                className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary / link to shopping */}
              {activeList.items.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">
                      {activeList.items.filter((i) => i.completed).length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{activeList.items.length}</span>{" "}
                    patterns completed
                    <span className="ml-3 text-gray-400">
                      {activeList.items.reduce((s, i) => s + i.quantity, 0)} total flies
                    </span>
                  </div>
                  <Link
                    href="/to-buy"
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    View To Buy List
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
