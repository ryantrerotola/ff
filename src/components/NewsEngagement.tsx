"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface NewsComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string | null;
  };
}

interface NewsEngagementProps {
  articleId: string;
  initialVoteCount: number;
  initialCommentCount: number;
}

export function NewsEngagement({
  articleId,
  initialVoteCount,
  initialCommentCount,
}: NewsEngagementProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [voted, setVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Fetch current vote state on mount
  useEffect(() => {
    fetch(`/api/news/votes?newsArticleId=${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        setVoteCount(data.count);
        setVoted(data.voted);
      })
      .catch(() => {
        // Keep initial values on error
      });
  }, [articleId]);

  // Fetch comments when expanded for the first time
  const fetchComments = useCallback(() => {
    if (commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    fetch(`/api/news/comments?newsArticleId=${articleId}`)
      .then((r) => r.json())
      .then((data: NewsComment[]) => {
        setComments(data);
        setCommentCount(data.length);
        setCommentsLoaded(true);
      })
      .catch(() => {
        // Silently fail; user can retry by collapsing and reopening
      })
      .finally(() => setCommentsLoading(false));
  }, [articleId, commentsLoaded, commentsLoading]);

  function handleToggleComments() {
    const willOpen = !commentsOpen;
    setCommentsOpen(willOpen);
    if (willOpen) {
      fetchComments();
    }
  }

  async function handleVote() {
    setVoteLoading(true);
    try {
      const res = await fetch("/api/news/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsArticleId: articleId }),
      });

      if (res.ok) {
        const data = await res.json();
        setVoteCount(data.count);
        setVoted(data.voted);
      }
    } catch {
      // Silently fail on network error
    }
    setVoteLoading(false);
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentError("");
    setCommentSubmitting(true);

    try {
      const res = await fetch("/api/news/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsArticleId: articleId, content: newComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCommentError(
          res.status === 401
            ? "Please log in to comment"
            : data.error || "Failed to post comment"
        );
        setCommentSubmitting(false);
        return;
      }

      const comment: NewsComment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
    } catch {
      setCommentError("Something went wrong. Please try again.");
    }
    setCommentSubmitting(false);
  }

  return (
    <div className="mt-2">
      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Upvote button */}
        <button
          onClick={handleVote}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            voted
              ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={voted ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
          {voteCount}
        </button>

        {/* Comment toggle button */}
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            commentsOpen
              ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
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
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          {commentCount}
        </button>
      </div>

      {/* Expanded comments section */}
      {commentsOpen && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {/* Comment form */}
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            {commentError && (
              <p className="mt-1 text-sm text-red-600">{commentError}</p>
            )}
            <button
              type="submit"
              disabled={commentSubmitting || !newComment.trim()}
              className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {commentSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </form>

          {/* Comments list */}
          <div className="mt-5 space-y-4">
            {commentsLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
            )}

            {!commentsLoading && comments.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}

            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {(
                      comment.user.displayName || comment.user.username
                    )[0]?.toUpperCase()}
                  </span>
                  <Link
                    href={`/profile/${comment.user.username}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white"
                  >
                    {comment.user.displayName || comment.user.username}
                  </Link>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
