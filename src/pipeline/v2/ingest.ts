/**
 * V2 Ingestion Stage
 *
 * Writes quality-gated patterns to production database.
 * Same approach as v1 but with:
 *   - Product links via AffiliateLink model
 *   - PatternImage entries from validated images
 *   - LLM-generated substitutions
 */

import { prisma } from "@/lib/prisma";
import { createLogger } from "../utils/logger";
import { sanitizeMaterialType } from "../normalization/normalizer";
import type {
  FlyCategory,
  Difficulty,
  WaterType,
  MaterialType,
  SubstitutionType,
  ResourceType,
} from "@prisma/client";
import type {
  V2ConsensusPattern,
  ValidatedImage,
  ProductLink,
  ScrapedSource,
} from "./types";

const log = createLogger("v2:ingest");

/**
 * Ingest a quality-gated pattern into production.
 */
export async function ingestV2Pattern(
  consensus: V2ConsensusPattern,
  sources: ScrapedSource[],
  images: ValidatedImage[],
  productLinks: ProductLink[]
): Promise<string> {
  log.info("Ingesting pattern", {
    pattern: consensus.patternName,
    materials: String(consensus.materials.length),
    steps: String(consensus.tyingSteps.length),
    images: String(images.length),
    links: String(productLinks.length),
  });

  return prisma.$transaction(async (tx) => {
    // Check if pattern already exists
    const existing = await tx.flyPattern.findUnique({
      where: { slug: consensus.slug },
      select: { id: true },
    });

    if (existing) {
      log.info("Pattern already exists, updating sources", {
        pattern: consensus.patternName,
      });
      await addNewResources(tx, existing.id, sources);
      await addNewImages(tx, existing.id, images);
      return existing.id;
    }

    // Create FlyPattern
    const flyPattern = await tx.flyPattern.create({
      data: {
        name: consensus.patternName,
        slug: consensus.slug,
        category: consensus.category.value as FlyCategory,
        difficulty: consensus.difficulty.value as Difficulty,
        waterType: consensus.waterType.value as WaterType,
        description: consensus.description,
        origin: consensus.origin,
      },
    });

    // Create materials
    for (const mat of consensus.materials) {
      const safeType = sanitizeMaterialType(mat.type) as MaterialType;
      const material = await tx.material.upsert({
        where: { name_type: { name: mat.name, type: safeType } },
        update: {},
        create: { name: mat.name, type: safeType },
      });

      await tx.flyPatternMaterial.create({
        data: {
          flyPatternId: flyPattern.id,
          materialId: material.id,
          customColor: mat.color,
          customSize: mat.size,
          required: mat.required,
          position: mat.position,
        },
      });

      // Add product links for this material
      const matLinks = productLinks.filter(
        (l) => l.materialName.toLowerCase() === mat.name.toLowerCase()
      );
      for (const link of matLinks) {
        const existingLink = await tx.affiliateLink.findFirst({
          where: { materialId: material.id, retailer: link.retailer },
        });
        if (!existingLink) {
          await tx.affiliateLink.create({
            data: {
              materialId: material.id,
              retailer: link.retailer,
              url: link.productUrl,
              commissionType: "percentage",
            },
          });
        }
      }
    }

    // Create substitutions
    for (const sub of consensus.substitutions) {
      const originalMat = await findOrCreateMaterial(tx, sub.originalMaterial);
      const substituteMat = await findOrCreateMaterial(tx, sub.substituteMaterial);

      if (originalMat && substituteMat) {
        const existing = await tx.materialSubstitution.findFirst({
          where: {
            materialId: originalMat.id,
            substituteMaterialId: substituteMat.id,
          },
        });

        if (!existing) {
          await tx.materialSubstitution.create({
            data: {
              materialId: originalMat.id,
              substituteMaterialId: substituteMat.id,
              substitutionType: (sub.substitutionType || "equivalent") as SubstitutionType,
              notes: sub.notes || "Discovered by v2 pipeline",
            },
          });
        }
      }
    }

    // Create variations
    for (const variation of consensus.variations) {
      const createdVariation = await tx.variation.create({
        data: {
          flyPatternId: flyPattern.id,
          name: variation.name,
          description: variation.description,
        },
      });

      for (const change of variation.materialChanges) {
        const originalMat = await findOrCreateMaterial(tx, change.original);
        const replacementMat = await findOrCreateMaterial(tx, change.replacement);

        if (originalMat && replacementMat) {
          await tx.variationOverride.create({
            data: {
              variationId: createdVariation.id,
              originalMaterialId: originalMat.id,
              replacementMaterialId: replacementMat.id,
            },
          });
        }
      }
    }

    // Create tying steps
    if (consensus.tyingSteps.length > 0) {
      await tx.tyingStep.createMany({
        data: consensus.tyingSteps.map((step) => ({
          flyPatternId: flyPattern.id,
          position: step.position,
          title: step.title,
          instruction: step.instruction,
          tip: step.tip,
        })),
      });
    }

    // Add source resources
    await addNewResources(tx, flyPattern.id, sources);

    // Add validated images
    await addNewImages(tx, flyPattern.id, images);

    log.success("Pattern ingested", {
      pattern: consensus.patternName,
      id: flyPattern.id,
      materials: String(consensus.materials.length),
      steps: String(consensus.tyingSteps.length),
      images: String(images.length),
    });

    return flyPattern.id;
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function addNewResources(
  tx: TxClient,
  flyPatternId: string,
  sources: ScrapedSource[]
): Promise<void> {
  for (const source of sources) {
    const existing = await tx.resource.findFirst({
      where: { flyPatternId, url: source.url },
    });

    if (!existing) {
      let resourceType: ResourceType = "blog";
      if (source.sourceType === "youtube") resourceType = "video";

      await tx.resource.create({
        data: {
          flyPatternId,
          type: resourceType,
          title: source.title,
          creatorName: source.creator || "Unknown",
          platform: source.platform,
          url: source.url,
          qualityScore: source.lowConfidence ? 2 : 4,
        },
      });
    }
  }
}

async function addNewImages(
  tx: TxClient,
  flyPatternId: string,
  images: ValidatedImage[]
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const img = images[i]!;
    const existing = await tx.patternImage.findFirst({
      where: { flyPatternId, url: img.url },
    });

    if (!existing) {
      await tx.patternImage.create({
        data: {
          flyPatternId,
          url: img.url,
          caption: img.caption || null,
          isPrimary: i === 0, // First image is primary
        },
      });
    }
  }
}

async function findOrCreateMaterial(
  tx: TxClient,
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!name || name.trim() === "") return null;

  const exact = await tx.material.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (exact) return exact;

  const partial = await tx.material.findFirst({
    where: { name: { contains: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (partial) return partial;

  const type = guessMaterialType(name);
  const created = await tx.material.create({
    data: { name, type: type as MaterialType },
    select: { id: true, name: true },
  });

  return created;
}

function guessMaterialType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("hook")) return "hook";
  if (lower.includes("thread")) return "thread";
  if (lower.includes("tail") || lower.includes("fiber")) return "tail";
  if (lower.includes("dubbing") || lower.includes("chenille") || lower.includes("herl") || lower.includes("body")) return "body";
  if (lower.includes("rib") || lower.includes("wire") || lower.includes("tinsel")) return "rib";
  if (lower.includes("thorax")) return "thorax";
  if (lower.includes("wing") || lower.includes("elk") || lower.includes("cdc") || lower.includes("deer")) return "wing";
  if (lower.includes("hackle")) return "hackle";
  if (lower.includes("bead")) return "bead";
  if (lower.includes("lead") || lower.includes("weight")) return "weight";
  return "other";
}
