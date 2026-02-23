import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/storage";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fileName, contentType, fileSize } = body;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPEG, PNG, WebP, AVIF, or GIF." },
      { status: 400 },
    );
  }

  if (fileSize && fileSize > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 },
    );
  }

  const result = await createPresignedUploadUrl(fileName, contentType);
  return NextResponse.json(result);
}
