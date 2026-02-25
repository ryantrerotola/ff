import { prisma } from "@/lib/prisma";
import { createLogger } from "../utils/logger";
import type { ConsensusPattern } from "../types";
import type {
  FlyCategory,
  Difficulty,
  WaterType,
  MaterialType,
  SubstitutionType,
  ResourceType,
} from "@prisma/client";

const log = createLogger("ingest");

/**
 * Ingest a consensus pattern into the production database.
 *
 * Creates or updates the FlyPattern and all related entities.
 * This is the final stage of the pipeline — only approved patterns
 * should reach this point.
 */
export async function ingestConsensusPattern(
  consensus: ConsensusPattern,
  sourceUrls: { url: string; type: string; title: string; creator: string; platform: string }[]
): Promise<string> {
  log.info("Ingesting pattern", {
    pattern: consensus.patternName,
    materials: String(consensus.materials.length),
  });

  return prisma.$transaction(async (tx) => {
    // Step 1: Upsert the FlyPattern
    const flyPattern = await tx.flyPattern.upsert({
      where: { slug: consensus.slug },
      update: {
        name: consensus.patternName,
        category: consensus.category.value as FlyCategory,
        difficulty: consensus.difficulty.value as Difficulty,
        waterType: consensus.waterType.value as WaterType,
        description: consensus.description,
        origin: consensus.origin,
      },
      create: {
        name: consensus.patternName,
        slug: consensus.slug,
        category: consensus.category.value as FlyCategory,
        difficulty: consensus.difficulty.value as Difficulty,
        waterType: consensus.waterType.value as WaterType,
        description: consensus.description,
        origin: consensus.origin,
      },
    });

    // Step 2: Clear existing related data for clean re-import
    await tx.flyPatternMaterial.deleteMany({
      where: { flyPatternId: flyPattern.id },
    });
    await tx.variation.deleteMany({
      where: { flyPatternId: flyPattern.id },
    });
    await tx.tyingStep.deleteMany({
      where: { flyPatternId: flyPattern.id },
    });
    // Keep existing resources; add new ones only
    // Keep existing feedback

    // Step 3: Upsert materials and link them to the pattern
    for (const mat of consensus.materials) {
      const material = await tx.material.upsert({
        where: {
          name_type: {
            name: mat.name,
            type: mat.type as MaterialType,
          },
        },
        update: {},
        create: {
          name: mat.name,
          type: mat.type as MaterialType,
        },
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
    }

    // Step 4: Create substitutions
    for (const sub of consensus.substitutions) {
      // Find or create both materials
      const originalMat = await findOrCreateMaterial(
        tx,
        sub.originalMaterial
      );
      const substituteMat = await findOrCreateMaterial(
        tx,
        sub.substituteMaterial
      );

      if (originalMat && substituteMat) {
        // Check if this substitution already exists
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
              notes: sub.notes || "Discovered by pipeline",
            },
          });
        }
      }
    }

    // Step 5: Create variations
    for (const variation of consensus.variations) {
      const createdVariation = await tx.variation.create({
        data: {
          flyPatternId: flyPattern.id,
          name: variation.name,
          description: variation.description,
        },
      });

      // Create variation overrides
      for (const change of variation.materialChanges) {
        const originalMat = await findOrCreateMaterial(tx, change.original);
        const replacementMat = await findOrCreateMaterial(
          tx,
          change.replacement
        );

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

    // Step 6: Add source URLs as resources (if not already present)
    for (const source of sourceUrls) {
      const existing = await tx.resource.findFirst({
        where: {
          flyPatternId: flyPattern.id,
          url: source.url,
        },
      });

      if (!existing) {
        let resourceType: ResourceType = "blog";
        if (source.type === "youtube") resourceType = "video";
        else if (source.url.endsWith(".pdf")) resourceType = "pdf";

        await tx.resource.create({
          data: {
            flyPatternId: flyPattern.id,
            type: resourceType,
            title: source.title,
            creatorName: source.creator || "Unknown",
            platform: source.platform || "Unknown",
            url: source.url,
            qualityScore: 3,
          },
        });
      }
    }

    // Step 7: Create tying steps
    if (consensus.tyingSteps && consensus.tyingSteps.length > 0) {
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

    log.success("Pattern ingested", {
      pattern: consensus.patternName,
      id: flyPattern.id,
      tyingSteps: String(consensus.tyingSteps?.length ?? 0),
    });

    return flyPattern.id;
  });
}

/**
 * Find a material by name (fuzzy) or create a new one.
 * Used for substitutions and variation overrides where we may
 * reference materials not in the current pattern.
 */
async function findOrCreateMaterial(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!name || name.trim() === "") return null;

  // Try exact match first
  const exact = await tx.material.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (exact) return exact;

  // Try contains match
  const partial = await tx.material.findFirst({
    where: { name: { contains: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (partial) return partial;

  // Create with best-guess type
  const type = guessMaterialType(name);
  const created = await tx.material.create({
    data: {
      name,
      type: type as MaterialType,
    },
    select: { id: true, name: true },
  });

  return created;
}

/**
 * Guess material type from name.
 */
function guessMaterialType(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("hook")) return "hook";
  if (lower.includes("thread")) return "thread";
  if (lower.includes("tail") || lower.includes("fiber")) return "tail";
  if (
    lower.includes("dubbing") ||
    lower.includes("chenille") ||
    lower.includes("herl") ||
    lower.includes("body")
  )
    return "body";
  if (lower.includes("rib") || lower.includes("wire") || lower.includes("tinsel"))
    return "rib";
  if (lower.includes("thorax")) return "thorax";
  if (
    lower.includes("wing") ||
    lower.includes("elk") ||
    lower.includes("cdc") ||
    lower.includes("deer")
  )
    return "wing";
  if (lower.includes("hackle")) return "hackle";
  if (lower.includes("bead")) return "bead";
  if (lower.includes("lead") || lower.includes("weight")) return "weight";

  return "other";
}

/**
 * Mark staged extractions as ingested after successful ingestion.
 */
export async function markAsIngested(extractionIds: string[]): Promise<void> {
  await prisma.stagedExtraction.updateMany({
    where: { id: { in: extractionIds } },
    data: { status: "ingested" },
  });
}
