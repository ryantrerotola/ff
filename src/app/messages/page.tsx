"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Conversation {
  partnerId: string;
  partnerUsername: string;
  partnerDisplayName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then(setConversations)
      .catch(() => setError("Please log in to view messages"))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-brand-600">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No messages yet. Visit a user&apos;s profile to start a conversation.
        </p>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {conversations.map((conv) => (
            <Link
              key={conv.partnerId}
              href={`/messages/${conv.partnerId}`}
              className="-mx-4 flex items-center gap-3 rounded-md px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {(conv.partnerDisplayName || conv.partnerUsername)[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {conv.partnerDisplayName || conv.partnerUsername}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
