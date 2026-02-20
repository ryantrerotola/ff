"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedPattern } from "@/pipeline/types";
import type { StagedSource, StagedExtraction } from "@prisma/client";

type ExtractionWithSource = StagedExtraction & { source: StagedSource };

interface ReviewDetailProps {
  extraction: ExtractionWithSource;
}

export function ReviewDetail({ extraction }: ReviewDetailProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState("");

  const data = extraction.extractedData as unknown as ExtractedPattern;

  async function handleApprove() {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/staged/${extraction.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNotes }),
        }
      );

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Approval failed");
      }

      router.push("/admin/review?status=ingested");
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/staged/${extraction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          reviewNotes,
        }),
      });

      if (!res.ok) throw new Error("Rejection failed");

      router.push("/admin/review");
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to queue
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {data?.patternName ?? "Unknown Pattern"}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {extraction.source.sourceType}
            </span>
            <ConfidenceIndicator confidence={extraction.confidence} />
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {extraction.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Extracted Data */}
        <div className="space-y-6">
          {/* Pattern Info */}
          <Section title="Pattern Information">
            <InfoRow label="Category" value={data?.category ?? "—"} />
            <InfoRow label="Difficulty" value={data?.difficulty ?? "—"} />
            <InfoRow label="Water Type" value={data?.waterType ?? "—"} />
            {data?.origin && <InfoRow label="Origin" value={data.origin} />}
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                {data?.description ?? "No description"}
              </p>
            </div>
          </Section>

          {/* Materials */}
          <Section title={`Materials (${data?.materials?.length ?? 0})`}>
            {data?.materials?.length ? (
              <div className="space-y-2">
                {data.materials.map((mat, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between rounded-md border border-gray-100 px-3 py-2"
                  >
                    <div>
                      <span className="text-xs font-medium uppercase text-gray-400">
                        {mat.type}
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {mat.name}
                      </p>
                      {(mat.color || mat.size) && (
                        <p className="text-xs text-gray-500">
                          {[mat.color, mat.size].filter(Boolean).join(" — ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!mat.required && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          Optional
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        #{mat.position}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No materials extracted</p>
            )}
          </Section>

          {/* Variations */}
          {data?.variations && data.variations.length > 0 && (
            <Section title={`Variations (${data.variations.length})`}>
              {data.variations.map((v, i) => (
                <div key={i} className="mb-2 rounded-md border border-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.description}</p>
                  {v.materialChanges.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {v.materialChanges.map((mc, j) => (
                        <li key={j} className="text-xs text-gray-600">
                          <span className="line-through">{mc.original}</span>
                          {" → "}
                          <span className="font-medium">{mc.replacement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Substitutions */}
          {data?.substitutions && data.substitutions.length > 0 && (
            <Section title={`Substitutions (${data.substitutions.length})`}>
              {data.substitutions.map((sub, i) => (
                <div key={i} className="mb-2 text-sm">
                  <span className="text-gray-600">{sub.originalMaterial}</span>
                  {" → "}
                  <span className="font-medium text-gray-900">
                    {sub.substituteMaterial}
                  </span>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {sub.substitutionType}
                  </span>
                  {sub.notes && (
                    <p className="mt-0.5 text-xs text-gray-400">{sub.notes}</p>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Right: Source Info & Actions */}
        <div className="space-y-6">
          {/* Source Info */}
          <Section title="Source">
            <InfoRow label="Type" value={extraction.source.sourceType} />
            <InfoRow label="Title" value={extraction.source.title ?? "—"} />
            <InfoRow
              label="Creator"
              value={extraction.source.creatorName ?? "—"}
            />
            <InfoRow
              label="Platform"
              value={extraction.source.platform ?? "—"}
            />
            <div className="mt-2">
              <a
                href={extraction.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 underline hover:text-brand-700"
              >
                View Source
              </a>
            </div>
          </Section>

          {/* Raw Content Preview */}
          {extraction.source.rawContent && (
            <Section title="Raw Content Preview">
              <div className="max-h-[300px] overflow-y-auto rounded-md bg-gray-50 p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-600">
                  {extraction.source.rawContent.slice(0, 3000)}
                  {extraction.source.rawContent.length > 3000 && "\n\n[truncated...]"}
                </pre>
              </div>
            </Section>
          )}

          {/* Review Actions */}
          {extraction.status !== "ingested" &&
            extraction.status !== "rejected" && (
              <Section title="Review Actions">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="reviewNotes"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Review Notes (optional)
                    </label>
                    <textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Any notes about this extraction..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing..." : "Approve & Ingest"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </Section>
            )}

          {/* Review info if already reviewed */}
          {extraction.reviewNotes && (
            <Section title="Review Notes">
              <p className="text-sm text-gray-600">
                {extraction.reviewNotes}
              </p>
              {extraction.reviewedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Reviewed at: {new Date(extraction.reviewedAt).toLocaleString()}
                </p>
              )}
            </Section>
          )}

          {/* Raw JSON */}
          <Section title="Raw Extracted JSON">
            <details>
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Show raw data
              </summary>
              <div className="mt-2 max-h-[400px] overflow-y-auto rounded-md bg-gray-50 p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-600">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </details>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const width = `${pct}%`;

  let barColor = "bg-red-500";
  if (pct >= 80) barColor = "bg-green-500";
  else if (pct >= 60) barColor = "bg-yellow-500";
  else if (pct >= 40) barColor = "bg-orange-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600">{pct}%</span>
    </div>
  );
}
