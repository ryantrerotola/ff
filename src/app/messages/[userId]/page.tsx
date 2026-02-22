"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MessageUser {
  id: string;
  username: string;
  displayName: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: MessageUser;
  receiver: MessageUser;
}

export default function ConversationPage() {
  const params = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<MessageUser | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages?userId=${params.userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data: Message[]) => {
        setMessages(data);
        if (data.length > 0) {
          const firstMsg = data[0]!;
          const other =
            firstMsg.sender.id === params.userId
              ? firstMsg.sender
              : firstMsg.receiver;
          setPartner(other);
        }
      })
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [params.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setSending(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: params.userId, content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send");
      setSending(false);
      return;
    }

    const message = await res.json();
    setMessages((prev) => [...prev, message]);
    if (!partner) {
      setPartner(message.receiver);
    }
    setContent("");
    setSending(false);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="text-sm text-brand-600 hover:text-brand-700"
        >
          &larr; Messages
        </Link>
        {partner && (
          <Link
            href={`/profile/${partner.username}`}
            className="text-sm font-medium text-gray-900 hover:text-brand-600"
          >
            {partner.displayName || partner.username}
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-gray-200 p-4" style={{ maxHeight: "60vh" }}>
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-500">
              Start the conversation!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender.id !== params.userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${isMe ? "text-brand-200" : "text-gray-400"}`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          maxLength={5000}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
