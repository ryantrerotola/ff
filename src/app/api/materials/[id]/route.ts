import { NextRequest, NextResponse } from "next/server";
import { getMaterialById } from "@/services/material.service";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = paramsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid material ID" },
      { status: 400 }
    );
  }

  const material = await getMaterialById(parsed.data.id);

  if (!material) {
    return NextResponse.json(
      { error: "Material not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(material);
}
