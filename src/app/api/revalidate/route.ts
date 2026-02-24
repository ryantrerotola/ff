import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");

  // Simple secret check — use REVALIDATION_SECRET env var if set
  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const path = searchParams.get("path");

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  // Purge all pattern and learn pages
  revalidatePath("/patterns/[slug]", "page");
  revalidatePath("/learn/[slug]", "page");
  revalidatePath("/", "page");

  return NextResponse.json({ revalidated: true, scope: "all dynamic pages" });
}
