import { NextRequest, NextResponse } from "next/server";
import { getPatterns } from "@/services/pattern.service";
import { patternSearchSchema } from "@/lib/validation";

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
      { status: 400 }
    );
  }

  const result = await getPatterns(parsed.data);
  return NextResponse.json(result);
}
