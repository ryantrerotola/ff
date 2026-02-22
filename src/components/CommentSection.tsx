"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommentUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  user: CommentUser;
}

interface CommentSectionProps {
  flyPatternId: string;
}

export function CommentSection({ flyPatternId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetch(`/api/comments?flyPatternId=${flyPatternId}`)
      .then((r) => r.json())
      .then(setComments);

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setCurrentUserId(data.user?.id ?? null));
  }, [flyPatternId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flyPatternId, content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to comment"
          : data.error || "Failed to post comment",
      );
      setLoading(false);
      return;
    }

    const comment = await res.json();
    setComments((prev) => [comment, ...prev]);
    setContent("");
    setLoading(false);
  }

  async function handleEdit(id: string) {
    if (!editContent.trim()) return;
    const res = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      const updated = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content: updated.content, editedAt: updated.editedAt } : c)),
      );
      setEditingId(null);
      setEditContent("");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900">
        Comments ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts or tips..."
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-md border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {(comment.user.displayName || comment.user.username)[0]?.toUpperCase()}
                </span>
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="text-sm font-medium text-gray-900 hover:text-brand-600"
                >
                  {comment.user.displayName || comment.user.username}
                </Link>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {comment.editedAt && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>
              {currentUserId === comment.user.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            {editingId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    className="rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditContent(""); }}
                    className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {comment.content}
              </p>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-gray-500">
            No comments yet. Be the first to share your experience with this
            pattern!
          </p>
        )}
      </div>
    </section>
  );
}
