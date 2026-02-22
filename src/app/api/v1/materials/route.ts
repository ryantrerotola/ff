import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MaterialType } from "@prisma/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const validMaterialTypes: MaterialType[] = [
  "hook",
  "thread",
  "tail",
  "body",
  "rib",
  "thorax",
  "wing",
  "hackle",
  "bead",
  "weight",
  "other",
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  if (type && !validMaterialTypes.includes(type as MaterialType)) {
    return NextResponse.json(
      {
        error: "Invalid material type",
        validTypes: validMaterialTypes,
      },
      { status: 400, headers: corsHeaders }
    );
  }

  const where = type ? { type: type as MaterialType } : {};

  const materials = await prisma.material.findMany({
    where,
    include: {
      substitutionsFrom: {
        include: {
          substituteMaterial: true,
        },
      },
      affiliateLinks: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: materials }, { headers: corsHeaders });
}
