import { NextRequest, NextResponse } from "next/server";
import { getPatternBySlug } from "@/services/pattern.service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Invalid slug parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return NextResponse.json(
      { error: "Pattern not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json(pattern, { headers: corsHeaders });
}
