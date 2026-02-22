import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveLocalFile } from "@/lib/storage";

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  // Prevent path traversal — key must match format: uploads/YYYY/MM/DD/uuid.ext
  if (
    key.includes("..") ||
    key.startsWith("/") ||
    !/^uploads\/\d{4}\/\d{2}\/\d{2}\/[\w-]+\.\w+$/.test(key)
  ) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const data = await request.arrayBuffer();
  if (data.byteLength > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const publicUrl = await saveLocalFile(key, Buffer.from(data));
  return NextResponse.json({ url: publicUrl });
}
