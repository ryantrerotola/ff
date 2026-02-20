import { NextRequest, NextResponse } from "next/server";
import {
  getStagedExtractionById,
  getExtractionsBySlug,
  updateExtractionStatus,
} from "@/services/staged.service";
import { buildConsensus } from "@/pipeline/normalization/consensus";
import { ingestConsensusPattern, markAsIngested } from "@/pipeline/ingestion/ingest";
import type { ExtractedPattern } from "@/pipeline/types";

/**
 * POST /api/admin/staged/[id]/approve
 *
 * Approve an extraction and immediately ingest it into the production database.
 * If there are multiple approved extractions for the same pattern (slug),
 * they will be combined using the consensus engine.
 */
export async function POST(
  request: NextRequest,
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

  let reviewNotes: string | undefined;
  try {
    const body = (await request.json()) as { reviewNotes?: string };
    reviewNotes = body.reviewNotes;
  } catch {
    // No body is fine
  }

  // Mark as approved
  await updateExtractionStatus(id, "approved", reviewNotes);

  // Get all approved extractions for this pattern
  const allForSlug = await getExtractionsBySlug(extraction.normalizedSlug);
  const approvedExtractions = allForSlug.filter(
    (e) => e.status === "approved" || e.id === id
  );

  // Parse extracted data
  const patterns = approvedExtractions
    .map((e) => e.extractedData as unknown as ExtractedPattern)
    .filter((p): p is ExtractedPattern => p !== null && p.patternName !== "");

  if (patterns.length === 0) {
    return NextResponse.json(
      { error: "No valid pattern data to ingest" },
      { status: 400 }
    );
  }

  // Build consensus and ingest
  const consensus = buildConsensus(patterns);

  const sourceUrls = approvedExtractions.map((e) => ({
    url: e.source.url,
    type: e.source.sourceType,
    title: e.source.title ?? consensus.patternName,
    creator: e.source.creatorName ?? "Unknown",
    platform: e.source.platform ?? "Unknown",
  }));

  try {
    const patternId = await ingestConsensusPattern(consensus, sourceUrls);
    await markAsIngested(approvedExtractions.map((e) => e.id));

    return NextResponse.json({
      success: true,
      patternId,
      patternName: consensus.patternName,
      slug: consensus.slug,
      sourcesUsed: approvedExtractions.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Ingestion failed",
        details: String(err),
      },
      { status: 500 }
    );
  }
}
