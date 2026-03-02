"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MATERIAL_TYPES = [
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

const CATEGORIES = [
  { value: "dry", label: "Dry Fly" },
  { value: "nymph", label: "Nymph" },
  { value: "streamer", label: "Streamer" },
  { value: "emerger", label: "Emerger" },
  { value: "saltwater", label: "Saltwater" },
  { value: "other", label: "Other" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const WATER_TYPES = [
  { value: "freshwater", label: "Freshwater" },
  { value: "saltwater", label: "Saltwater" },
  { value: "both", label: "Both" },
];

interface MaterialInput {
  type: string;
  name: string;
  color: string;
  size: string;
}

interface TyingStepInput {
  title: string;
  instruction: string;
  tip: string;
}

export default function SubmitPatternPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<MaterialInput[]>([
    { type: "hook", name: "", color: "", size: "" },
  ]);
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [tyingSteps, setTyingSteps] = useState<TyingStepInput[]>([]);

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { type: "other", name: "", color: "", size: "" },
    ]);
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMaterial(
    index: number,
    field: keyof MaterialInput,
    value: string,
  ) {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/patterns/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        category: form.get("category"),
        difficulty: form.get("difficulty"),
        waterType: form.get("waterType"),
        description: form.get("description"),
        materials: materials
          .filter((m) => m.name.trim())
          .map((m) => ({
            type: m.type,
            name: m.name,
            ...(m.color ? { color: m.color } : {}),
            ...(m.size ? { size: m.size } : {}),
          })),
        videoUrls: videoUrls.filter((u) => u.trim()),
        tyingSteps: tyingSteps
          .filter((s) => s.title.trim() && s.instruction.trim())
          .map((s) => ({
            title: s.title,
            instruction: s.instruction,
            ...(s.tip ? { tip: s.tip } : {}),
          })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to submit a pattern"
          : data.error || "Submission failed",
      );
      setLoading(false);
      return;
    }

    router.push("/my-stuff?submitted=1");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Submit a Pattern
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Share your fly pattern with the community. Submissions are reviewed
        before being published.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pattern name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Pattern Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={200}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Category / Difficulty / Water Type */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="waterType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Water Type
            </label>
            <select
              id="waterType"
              name="waterType"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {WATER_TYPES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            maxLength={5000}
            placeholder="Describe the pattern, when to use it, tips for tying..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Materials */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Materials
            </label>
            <button
              type="button"
              onClick={addMaterial}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              + Add Material
            </button>
          </div>

          <div className="mt-2 space-y-3">
            {materials.map((mat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <select
                  value={mat.type}
                  onChange={(e) => updateMaterial(idx, "type", e.target.value)}
                  className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  value={mat.name}
                  onChange={(e) => updateMaterial(idx, "name", e.target.value)}
                  placeholder="Material name"
                  required
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <input
                  value={mat.color}
                  onChange={(e) => updateMaterial(idx, "color", e.target.value)}
                  placeholder="Color"
                  className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <input
                  value={mat.size}
                  onChange={(e) => updateMaterial(idx, "size", e.target.value)}
                  placeholder="Size"
                  className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {materials.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMaterial(idx)}
                    className="mt-0.5 text-gray-400 hover:text-red-500 dark:text-gray-500"
                  >
                    <svg
                      className="h-5 w-5"
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Video URLs */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Video Links <span className="font-normal text-gray-400">(optional)</span>
            </label>
            {videoUrls.length < 5 && (
              <button
                type="button"
                onClick={() => setVideoUrls((prev) => [...prev, ""])}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                + Add Video
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            YouTube or other video URLs showing how to tie this pattern.
          </p>
          <div className="mt-2 space-y-2">
            {videoUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) =>
                    setVideoUrls((prev) =>
                      prev.map((u, i) => (i === idx ? e.target.value : u)),
                    )
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {videoUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVideoUrls((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tying Steps */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              How-To Steps <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setTyingSteps((prev) => [
                  ...prev,
                  { title: "", instruction: "", tip: "" },
                ])
              }
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              + Add Step
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Step-by-step instructions for tying this pattern.
          </p>
          {tyingSteps.length > 0 && (
            <div className="mt-3 space-y-4">
              {tyingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Step {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTyingSteps((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    value={step.title}
                    onChange={(e) =>
                      setTyingSteps((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, title: e.target.value } : s,
                        ),
                      )
                    }
                    placeholder="Step title (e.g., Attach Thread)"
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <textarea
                    value={step.instruction}
                    onChange={(e) =>
                      setTyingSteps((prev) =>
                        prev.map((s, i) =>
                          i === idx
                            ? { ...s, instruction: e.target.value }
                            : s,
                        ),
                      )
                    }
                    placeholder="Detailed instruction..."
                    rows={2}
                    className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    value={step.tip}
                    onChange={(e) =>
                      setTyingSteps((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, tip: e.target.value } : s,
                        ),
                      )
                    }
                    placeholder="Pro tip (optional)"
                    className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Pattern"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
