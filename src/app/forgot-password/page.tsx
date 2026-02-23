"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setResetToken(data.resetToken ?? "");
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Reset Password
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            If an account with that email exists, a reset link has been sent.
          </div>

          {resetToken && (
            <div className="rounded-md border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Dev mode — in production this would be emailed:
              </p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                className="text-sm text-brand-600 hover:text-brand-700 break-all"
              >
                /reset-password?token={resetToken}
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/login" className="text-brand-600 hover:text-brand-700">
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
