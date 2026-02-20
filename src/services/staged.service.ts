import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { StagedStatus } from "@prisma/client";

// ─── Staged Sources ─────────────────────────────────────────────────────────

export async function createStagedSource(data: {
  sourceType: "youtube" | "blog" | "pdf";
  url: string;
  title?: string;
  creatorName?: string;
  platform?: string;
  patternQuery: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.stagedSource.upsert({
    where: { url: data.url },
    update: {
      title: data.title,
      creatorName: data.creatorName,
      platform: data.platform,
      metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    create: {
      sourceType: data.sourceType,
      url: data.url,
      title: data.title ?? null,
      creatorName: data.creatorName ?? null,
      platform: data.platform ?? null,
      patternQuery: data.patternQuery,
      metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function updateStagedSourceContent(
  id: string,
  rawContent: string
) {
  return prisma.stagedSource.update({
    where: { id },
    data: {
      rawContent,
      status: "scraped",
      scrapedAt: new Date(),
    },
  });
}

export async function getStagedSourcesByStatus(status: StagedStatus) {
  return prisma.stagedSource.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
  });
}

export async function getStagedSourcesByQuery(patternQuery: string) {
  return prisma.stagedSource.findMany({
    where: { patternQuery },
    include: { extractions: true },
  });
}

// ─── Staged Extractions ─────────────────────────────────────────────────────

export async function createStagedExtraction(data: {
  sourceId: string;
  patternName: string;
  normalizedSlug: string;
  extractedData: Record<string, unknown>;
  confidence: number;
}) {
  // Update the source status
  await prisma.stagedSource.update({
    where: { id: data.sourceId },
    data: { status: "extracted" },
  });

  return prisma.stagedExtraction.create({
    data: {
      sourceId: data.sourceId,
      patternName: data.patternName,
      normalizedSlug: data.normalizedSlug,
      extractedData: data.extractedData as Prisma.InputJsonValue,
      confidence: data.confidence,
      status: "extracted",
    },
  });
}

export async function getStagedExtractions(options: {
  status?: StagedStatus;
  slug?: string;
  minConfidence?: number;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    slug,
    minConfidence,
    page = 1,
    limit = 20,
  } = options;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (slug) where.normalizedSlug = slug;
  if (minConfidence !== undefined) {
    where.confidence = { gte: minConfidence };
  }

  const [data, total] = await Promise.all([
    prisma.stagedExtraction.findMany({
      where,
      include: {
        source: {
          select: {
            url: true,
            sourceType: true,
            title: true,
            creatorName: true,
            platform: true,
          },
        },
      },
      orderBy: [
        { confidence: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stagedExtraction.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStagedExtractionById(id: string) {
  return prisma.stagedExtraction.findUnique({
    where: { id },
    include: {
      source: true,
    },
  });
}

export async function updateExtractionStatus(
  id: string,
  status: StagedStatus,
  reviewNotes?: string
) {
  return prisma.stagedExtraction.update({
    where: { id },
    data: {
      status,
      reviewNotes: reviewNotes ?? null,
      reviewedAt: new Date(),
    },
  });
}

export async function updateExtractionData(
  id: string,
  extractedData: Record<string, unknown>
) {
  return prisma.stagedExtraction.update({
    where: { id },
    data: { extractedData: extractedData as Prisma.InputJsonValue },
  });
}

export async function getExtractionsBySlug(slug: string) {
  return prisma.stagedExtraction.findMany({
    where: { normalizedSlug: slug },
    include: { source: true },
    orderBy: { confidence: "desc" },
  });
}

// ─── Pipeline Stats ─────────────────────────────────────────────────────────

export async function getPipelineStats() {
  const [
    discoveredSources,
    scrapedSources,
    extractedSources,
    totalExtractions,
    highConfidence,
    lowConfidence,
    approvedExtractions,
    rejectedExtractions,
    ingestedExtractions,
    normalizedExtractions,
  ] = await Promise.all([
    prisma.stagedSource.count({ where: { status: "discovered" } }),
    prisma.stagedSource.count({ where: { status: "scraped" } }),
    prisma.stagedSource.count({
      where: { status: { in: ["extracted", "normalized", "approved", "ingested"] } },
    }),
    prisma.stagedExtraction.count(),
    prisma.stagedExtraction.count({
      where: { confidence: { gte: 0.7 } },
    }),
    prisma.stagedExtraction.count({
      where: { confidence: { lt: 0.7 } },
    }),
    prisma.stagedExtraction.count({ where: { status: "approved" } }),
    prisma.stagedExtraction.count({ where: { status: "rejected" } }),
    prisma.stagedExtraction.count({ where: { status: "ingested" } }),
    prisma.stagedExtraction.count({ where: { status: "normalized" } }),
  ]);

  return {
    sources: {
      discovered: discoveredSources,
      scraped: scrapedSources,
      extracted: extractedSources,
    },
    extractions: {
      total: totalExtractions,
      highConfidence,
      lowConfidence,
    },
    patterns: {
      normalized: normalizedExtractions,
      approved: approvedExtractions,
      rejected: rejectedExtractions,
      ingested: ingestedExtractions,
    },
  };
}
