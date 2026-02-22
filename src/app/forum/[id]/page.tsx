"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PostUser {
  id: string;
  username: string;
  displayName: string | null;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
}

interface Post {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  user: PostUser;
  replies: Reply[];
}

export default function ForumPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/forum/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() || !post) return;

    setError("");
    setReplying(true);

    const res = await fetch("/api/forum/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, content: replyContent }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(
        res.status === 401
          ? "Please log in to reply"
          : data.error || "Failed to post reply",
      );
      setReplying(false);
      return;
    }

    const reply = await res.json();
    setPost((prev) =>
      prev ? { ...prev, replies: [...prev.replies, reply] } : prev,
    );
    setReplyContent("");
    setReplying(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-gray-500">Post not found.</p>
        <Link href="/forum" className="mt-4 inline-block text-brand-600">
          Back to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/forum"
        className="mb-4 inline-block text-sm text-brand-600 hover:text-brand-700"
      >
        &larr; Back to Forum
      </Link>

      {/* Original post */}
      <article className="rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={`/profile/${post.user.username}`}
            className="font-medium text-gray-900 hover:text-brand-600"
          >
            {post.user.displayName || post.user.username}
          </Link>
          <span>&middot;</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-4 whitespace-pre-wrap text-gray-700">
          {post.content}
        </div>
      </article>

      {/* Replies */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Replies ({post.replies.length})
        </h2>

        <div className="mt-4 space-y-4">
          {post.replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-md border border-gray-200 p-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {(reply.user.displayName || reply.user.username)[0]?.toUpperCase()}
                </span>
                <Link
                  href={`/profile/${reply.user.username}`}
                  className="font-medium text-gray-900 hover:text-brand-600"
                >
                  {reply.user.displayName || reply.user.username}
                </Link>
                <span className="text-xs text-gray-500">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {reply.content}
              </p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <form onSubmit={handleReply} className="mt-6">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            maxLength={5000}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={replying || !replyContent.trim()}
            className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {replying ? "Posting..." : "Reply"}
          </button>
        </form>
      </section>
    </div>
  );
}
