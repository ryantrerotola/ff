import { NextRequest, NextResponse } from "next/server";
import { fullTextSearch } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  const types = typeParam
    ? (typeParam.split(",") as ("pattern" | "forum_post" | "news")[])
    : undefined;
  const limit = Math.min(
    50,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "20")),
  );

  const results = await fullTextSearch(q, { types, limit });
  return NextResponse.json({ results });
}
