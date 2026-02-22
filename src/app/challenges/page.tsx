"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EntryUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ChallengeEntry {
  id: string;
  imageUrl: string;
  caption: string | null;
  votes: number;
  createdAt: string;
  user: EntryUser;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  month: number;
  year: number;
  flyPattern: { id: string; name: string; slug: string } | null;
  entries: ChallengeEntry[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ChallengesPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((data) => setChallenge(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, caption: caption || null }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to submit an entry"
          : data.error || "Failed to submit entry",
      );
      setSubmitting(false);
      return;
    }

    const entry = await res.json();
    setChallenge((prev) =>
      prev ? { ...prev, entries: [...prev.entries, entry] } : prev,
    );
    setImageUrl("");
    setCaption("");
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleVote(entryId: string) {
    if (votingId) return;

    setVotingId(entryId);
    setError("");

    const res = await fetch("/api/challenges/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to vote"
          : data.error || "Failed to vote",
      );
      setVotingId(null);
      return;
    }

    const { votes } = await res.json();
    setChallenge((prev) =>
      prev
        ? {
            ...prev,
            entries: prev.entries.map((entry) =>
              entry.id === entryId ? { ...entry, votes } : entry,
            ),
          }
        : prev,
    );
    setVotingId(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tying Challenge
        </h1>
        <div className="mt-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
            No active challenge this month. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const monthLabel = MONTHS[challenge.month - 1] ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {monthLabel} {challenge.year} Challenge
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {challenge.title}
            </h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? "Cancel" : "Submit Entry"}
          </button>
        </div>

        <p className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">
          {challenge.description}
        </p>

        {challenge.flyPattern && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Featured pattern:{" "}
            <Link
              href={`/patterns/${challenge.flyPattern.slug}`}
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {challenge.flyPattern.name}
            </Link>
          </p>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Submit Your Entry
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                placeholder="https://example.com/my-fly.jpg"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="caption"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Caption <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="Tell us about your tie..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !imageUrl.trim()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Entries Gallery */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Community Entries ({challenge.entries.length})
        </h2>

        {challenge.entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              No entries yet. Be the first to submit!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {challenge.entries.map((entry) => (
              <div
                key={entry.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.imageUrl}
                  alt={entry.caption || `Entry by ${entry.user.displayName || entry.user.username}`}
                  className="h-56 w-full object-cover"
                />
                <div className="p-4">
                  {entry.caption && (
                    <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                      {entry.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        {(entry.user.displayName || entry.user.username)[0]?.toUpperCase()}
                      </span>
                      <Link
                        href={`/profile/${entry.user.username}`}
                        className="text-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {entry.user.displayName || entry.user.username}
                      </Link>
                    </div>
                    <button
                      onClick={() => handleVote(entry.id)}
                      disabled={votingId === entry.id}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300"
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
                          d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
                        />
                      </svg>
                      {entry.votes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
