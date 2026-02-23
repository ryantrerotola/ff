"use client";

import { useState } from "react";

interface FeedbackFormProps {
  flyPatternId: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export function FeedbackForm({ flyPatternId }: FeedbackFormProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (helpful === null) {
      setErrorMessage("Please select whether this pattern was helpful.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Please add a comment.");
      return;
    }

    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flyPatternId,
          helpful,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitState("success");
      setComment("");
      setHelpful(null);
    } catch {
      setSubmitState("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (submitState === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="font-medium text-green-800 dark:text-green-300">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Feedback</h2>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Was this pattern helpful?
          </legend>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setHelpful(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                helpful === true
                  ? "bg-green-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Yes, helpful
            </button>
            <button
              type="button"
              onClick={() => setHelpful(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                helpful === false
                  ? "bg-red-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Not helpful
            </button>
          </div>
        </fieldset>

        <div className="mt-4">
          <label
            htmlFor="comment"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Comment
          </label>
          <textarea
            id="comment"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this pattern..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {comment.length}/1000 characters
          </p>
        </div>

        {errorMessage && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {submitState === "submitting" ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </section>
  );
}
