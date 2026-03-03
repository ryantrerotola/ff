"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
  MATERIAL_TYPE_LABELS,
} from "@/lib/constants";

interface MaterialRecord {
  id: string;
  name: string;
  type: string;
}

interface PatternMaterial {
  id: string;
  materialId: string;
  position: number;
  customColor: string | null;
  customSize: string | null;
  required: boolean;
  material: MaterialRecord;
}

interface PatternImage {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  createdAt: string;
  uploadedBy: { username: string } | null;
}

interface Resource {
  id: string;
  url: string;
  title: string | null;
  sourceType: string;
  qualityScore: number | null;
}

interface TyingStep {
  id: string;
  position: number;
  title: string | null;
  instruction: string;
  tip: string | null;
}

interface PatternDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty: string;
  waterType: string;
  description: string;
  origin: string | null;
  materials: PatternMaterial[];
  images: PatternImage[];
  resources: Resource[];
  tyingSteps: TyingStep[];
}

type EditingMaterial = {
  id: string;
  materialName: string;
  materialType: string;
  customColor: string;
  customSize: string;
};

export default function AdminPatternEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [pattern, setPattern] = useState<PatternDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [waterType, setWaterType] = useState("");
  const [origin, setOrigin] = useState("");

  // Material editing
  const [editingMaterial, setEditingMaterial] = useState<EditingMaterial | null>(null);

  const fetchPattern = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/patterns/${slug}`)
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        if (r.status === 404) throw new Error("Pattern not found");
        if (!r.ok) throw new Error("Failed to load pattern");
        return r.json();
      })
      .then((p: PatternDetail) => {
        setPattern(p);
        setName(p.name);
        setDescription(p.description);
        setCategory(p.category);
        setDifficulty(p.difficulty);
        setWaterType(p.waterType);
        setOrigin(p.origin ?? "");
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchPattern();
  }, [fetchPattern]);

  async function handleSaveDetails() {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch(`/api/admin/patterns/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          difficulty,
          waterType,
          origin: origin || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendAction(body: Record<string, unknown>) {
    const key = JSON.stringify(body);
    setActionLoading(key);
    try {
      const res = await fetch(`/api/admin/patterns/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      fetchPattern();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  function handleDeleteImage(imageId: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    sendAction({ action: "deleteImage", imageId });
  }

  function handleSetPrimary(imageId: string) {
    sendAction({ action: "setPrimaryImage", imageId });
  }

  function handleDeleteMaterial(flyPatternMaterialId: string) {
    if (!confirm("Remove this material from the pattern?")) return;
    sendAction({ action: "deleteMaterial", flyPatternMaterialId });
  }

  function startEditMaterial(m: PatternMaterial) {
    setEditingMaterial({
      id: m.id,
      materialName: m.material.name,
      materialType: m.material.type,
      customColor: m.customColor ?? "",
      customSize: m.customSize ?? "",
    });
  }

  async function handleSaveMaterial() {
    if (!editingMaterial) return;
    await sendAction({
      action: "updateMaterial",
      flyPatternMaterialId: editingMaterial.id,
      materialName: editingMaterial.materialName,
      materialType: editingMaterial.materialType,
      customColor: editingMaterial.customColor || null,
      customSize: editingMaterial.customSize || null,
    });
    setEditingMaterial(null);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-md bg-red-50 p-6 dark:bg-red-900/30">
          <p className="text-lg font-medium text-red-800">{error}</p>
        </div>
        <Link
          href="/admin/patterns"
          className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700"
        >
          Back to patterns
        </Link>
      </div>
    );
  }

  if (loading || !pattern) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-60 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/admin/patterns" className="hover:text-brand-600">
          Patterns
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{pattern.name}</span>
        <span className="ml-auto">
          <Link
            href={`/patterns/${pattern.slug}`}
            className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            View live page
          </Link>
        </span>
      </div>

      {/* ── Pattern Details ── */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Pattern Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {Object.entries(DIFFICULTY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Water Type
              </label>
              <select
                value={waterType}
                onChange={(e) => setWaterType(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {Object.entries(WATER_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Developed by Al Troth in 1957"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Details"}
            </button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Images ── */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Images ({pattern.images.length})
        </h2>

        {pattern.images.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No images for this pattern.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pattern.images.map((image) => (
              <div
                key={image.id}
                className={`group relative overflow-hidden rounded-lg border-2 ${
                  image.isPrimary
                    ? "border-brand-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.caption || pattern.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-medium text-white">
                      Primary
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={actionLoading !== null}
                      className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400"
                    >
                      Set Primary
                    </button>
                  )}
                  {image.isPrimary && (
                    <span className="text-xs text-gray-400">Primary</span>
                  )}
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={actionLoading !== null}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

                {image.caption && (
                  <p className="border-t border-gray-200 px-2 py-1 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Materials ── */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Materials ({pattern.materials.length})
        </h2>

        {pattern.materials.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No materials listed.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pattern.materials.map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-3">
                {editingMaterial?.id === m.id ? (
                  /* ── Editing row ── */
                  <div className="flex flex-1 flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Type</label>
                      <select
                        value={editingMaterial.materialType}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, materialType: e.target.value })
                        }
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        {Object.entries(MATERIAL_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-gray-500">Name</label>
                      <input
                        type="text"
                        value={editingMaterial.materialName}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, materialName: e.target.value })
                        }
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Color</label>
                      <input
                        type="text"
                        value={editingMaterial.customColor}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, customColor: e.target.value })
                        }
                        placeholder="optional"
                        className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Size</label>
                      <input
                        type="text"
                        value={editingMaterial.customSize}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, customSize: e.target.value })
                        }
                        placeholder="optional"
                        className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveMaterial}
                        disabled={actionLoading !== null}
                        className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMaterial(null)}
                        className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <>
                    <span className="w-8 text-center text-xs text-gray-400">
                      {m.position}
                    </span>
                    <span className="w-20 rounded bg-gray-100 px-2 py-0.5 text-center text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {MATERIAL_TYPE_LABELS[m.material.type] ?? m.material.type}
                    </span>
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      {m.material.name}
                      {m.customColor && (
                        <span className="ml-2 text-xs text-gray-500">
                          color: {m.customColor}
                        </span>
                      )}
                      {m.customSize && (
                        <span className="ml-2 text-xs text-gray-500">
                          size: {m.customSize}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditMaterial(m)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        disabled={actionLoading !== null}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Resources ── */}
      {pattern.resources.length > 0 && (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Resources ({pattern.resources.length})
          </h2>
          <ul className="space-y-2">
            {pattern.resources.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {r.sourceType}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {r.title || r.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tying Steps ── */}
      {pattern.tyingSteps.length > 0 && (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Tying Steps ({pattern.tyingSteps.length})
          </h2>
          <ol className="space-y-3">
            {pattern.tyingSteps.map((step) => (
              <li key={step.id} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2 font-medium text-gray-900 dark:text-white">
                  {step.position}.
                  {step.title && ` ${step.title}`}
                </span>
                {step.instruction}
                {step.tip && (
                  <span className="ml-2 text-xs italic text-gray-500">
                    Tip: {step.tip}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/patterns"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to patterns
        </Link>
        <Link
          href={`/patterns/${pattern.slug}`}
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          View live page
        </Link>
      </div>
    </div>
  );
}
