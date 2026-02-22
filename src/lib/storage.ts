/**
 * S3-compatible storage client for image uploads.
 *
 * Supports any S3-compatible service (AWS S3, Cloudflare R2, MinIO, etc.)
 * via environment variables:
 *
 *   S3_ENDPOINT       - e.g., https://s3.us-east-1.amazonaws.com or https://xxx.r2.cloudflarestorage.com
 *   S3_REGION         - e.g., us-east-1 or auto
 *   S3_BUCKET         - bucket name
 *   S3_ACCESS_KEY_ID  - access key
 *   S3_SECRET_ACCESS_KEY - secret key
 *   S3_PUBLIC_URL     - public-facing URL prefix, e.g., https://cdn.flypatterndb.com
 *
 * If not configured, uploads are stored locally in public/uploads/ as a fallback.
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION ?? "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

function isS3Configured(): boolean {
  return !!(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
}

function generateKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const hash = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  return `uploads/${date}/${hash}${ext}`;
}

/**
 * Generate a presigned PUT URL for direct client-to-S3 upload.
 *
 * Uses AWS Signature V4 (manual implementation to avoid SDK dependency).
 */
function sign(
  method: string,
  url: URL,
  headers: Record<string, string>,
  signedHeaders: string[],
  payloadHash: string,
): string {
  const date = headers["x-amz-date"]!;
  const dateShort = date.slice(0, 8);
  const scope = `${dateShort}/${S3_REGION}/s3/aws4_request`;

  const canonicalHeaders = signedHeaders
    .map((h) => `${h}:${headers[h]!.trim()}`)
    .join("\n");
  const signedHeadersStr = signedHeaders.join(";");

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders + "\n",
    signedHeadersStr,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    date,
    scope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  function hmac(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac("sha256", key).update(data).digest();
  }

  const kDate = hmac(`AWS4${S3_SECRET_ACCESS_KEY}`, dateShort);
  const kRegion = hmac(kDate, S3_REGION);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  return crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
}

export async function createPresignedUploadUrl(
  originalName: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const key = generateKey(originalName);

  if (isS3Configured()) {
    const expiresIn = 600; // 10 minutes
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
    const dateShort = amzDate.slice(0, 8);
    const scope = `${dateShort}/${S3_REGION}/s3/aws4_request`;

    const url = new URL(`/${S3_BUCKET}/${key}`, S3_ENDPOINT);
    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set("X-Amz-Credential", `${S3_ACCESS_KEY_ID}/${scope}`);
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(expiresIn));
    url.searchParams.set("X-Amz-SignedHeaders", "content-type;host");
    url.searchParams.sort();

    const headers: Record<string, string> = {
      "content-type": contentType,
      host: url.host,
      "x-amz-date": amzDate,
    };

    const signature = sign("PUT", url, headers, ["content-type", "host"], "UNSIGNED-PAYLOAD");
    url.searchParams.set("X-Amz-Signature", signature);

    const publicUrl = S3_PUBLIC_URL
      ? `${S3_PUBLIC_URL}/${key}`
      : `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

    return { uploadUrl: url.toString(), publicUrl, key };
  }

  // Local fallback — return a URL to our own upload endpoint
  return {
    uploadUrl: `/api/upload/local?key=${encodeURIComponent(key)}`,
    publicUrl: `/uploads/${key.replace("uploads/", "")}`,
    key,
  };
}

export async function saveLocalFile(
  key: string,
  data: Buffer,
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const subPath = key.replace("uploads/", "");
  const fullPath = path.join(uploadDir, subPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
  return `/uploads/${subPath}`;
}
