"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => setError("Please log in to view notifications"))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-brand-600">Log In</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-md bg-gray-100" />)}
        </div>
      ) : notifications.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No notifications yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-gray-200">
          {notifications.map((n) => {
            const inner = (
              <div
                className={`-mx-4 px-4 py-3 ${
                  n.read ? "opacity-60" : "bg-brand-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.body}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => !n.read && markRead(n.id)}
                  className="block rounded-md hover:bg-gray-50"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className="cursor-pointer rounded-md hover:bg-gray-50"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
