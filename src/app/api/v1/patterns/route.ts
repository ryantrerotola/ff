import { NextRequest, NextResponse } from "next/server";
import { getPatterns } from "@/services/pattern.service";
import { patternSearchSchema } from "@/lib/validation";
import { APP_URL } from "@/lib/constants";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const parsed = patternSearchSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    waterType: searchParams.get("waterType") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders }
    );
  }

  const result = await getPatterns(parsed.data);

  // Build Link header for pagination
  const links: string[] = [];
  const buildUrl = (page: number) => {
    const url = new URL(`${APP_URL}/api/v1/patterns`);
    if (parsed.data.search) url.searchParams.set("search", parsed.data.search);
    if (parsed.data.category)
      url.searchParams.set("category", parsed.data.category);
    if (parsed.data.difficulty)
      url.searchParams.set("difficulty", parsed.data.difficulty);
    if (parsed.data.waterType)
      url.searchParams.set("waterType", parsed.data.waterType);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(parsed.data.limit));
    return url.toString();
  };

  if (result.page > 1) {
    links.push(`<${buildUrl(1)}>; rel="first"`);
    links.push(`<${buildUrl(result.page - 1)}>; rel="prev"`);
  }
  if (result.page < result.totalPages) {
    links.push(`<${buildUrl(result.page + 1)}>; rel="next"`);
    links.push(`<${buildUrl(result.totalPages)}>; rel="last"`);
  }

  const headers: Record<string, string> = { ...corsHeaders };
  if (links.length > 0) {
    headers["Link"] = links.join(", ");
  }

  return NextResponse.json(result, { headers });
}
