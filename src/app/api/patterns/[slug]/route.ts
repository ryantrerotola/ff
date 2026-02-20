import { NextRequest, NextResponse } from "next/server";
import { getPatternBySlug } from "@/services/pattern.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Invalid slug parameter" },
      { status: 400 }
    );
  }

  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return NextResponse.json(
      { error: "Pattern not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(pattern);
}
