"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  flyPatternId: string;
  onUploaded?: (url: string) => void;
}

export function ImageUpload({ flyPatternId, onUploaded }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [caption, setCaption] = useState("");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload file to presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      // For local uploads, the response contains the URL
      let finalUrl = publicUrl;
      if (uploadUrl.startsWith("/api/upload/local")) {
        const data = await uploadRes.json();
        finalUrl = data.url;
      }

      // 3. Save image record
      const saveRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flyPatternId,
          url: finalUrl,
          caption: caption || undefined,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save image record");
      }

      setSuccess(true);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded?.(finalUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Upload a Photo
      </h3>
      <div className="mt-3 space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-gray-400 dark:file:bg-brand-900/30 dark:file:text-brand-400"
        />
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          maxLength={200}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Image uploaded successfully!
          </p>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
