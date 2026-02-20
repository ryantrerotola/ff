import { NextRequest, NextResponse } from "next/server";
import {
  getStagedExtractionById,
  updateExtractionStatus,
  updateExtractionData,
} from "@/services/staged.service";
import { z } from "zod";
import type { StagedStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z
    .enum([
      "extracted",
      "normalized",
      "approved",
      "rejected",
      "ingested",
    ] as const)
    .optional(),
  reviewNotes: z.string().optional(),
  extractedData: z.record(z.unknown()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const extraction = await getStagedExtractionById(id);

  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(extraction);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, reviewNotes, extractedData } = parsed.data;

  const extraction = await getStagedExtractionById(id);
  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction not found" },
      { status: 404 }
    );
  }

  if (extractedData) {
    await updateExtractionData(id, extractedData);
  }

  if (status) {
    const updated = await updateExtractionStatus(
      id,
      status as StagedStatus,
      reviewNotes
    );
    return NextResponse.json(updated);
  }

  const updated = await getStagedExtractionById(id);
  return NextResponse.json(updated);
}
