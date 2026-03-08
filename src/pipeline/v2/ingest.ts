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

  // Material lookup cache — avoids redundant DB queries within the transaction.
  // Same material names appear across substitutions and variation overrides.
  const materialCache = new Map<string, { id: string; name: string }>();

  return prisma.$transaction(async (tx) => {
    // Check if pattern already exists
    const existing = await tx.flyPattern.findUnique({
      where: { slug: consensus.slug },
      select: { id: true },
    });

    let flyPatternId: string;

    if (existing) {
      log.info("Pattern already exists, replacing with V2 data", {
        pattern: consensus.patternName,
      });

      // Delete pipeline-generated child records (preserve user data: comments, likes, ratings, saved patterns)
      await tx.tyingStep.deleteMany({ where: { flyPatternId: existing.id } });
      await tx.variationOverride.deleteMany({
        where: { variation: { flyPatternId: existing.id } },
      });
      await tx.variation.deleteMany({ where: { flyPatternId: existing.id } });
      await tx.flyPatternMaterial.deleteMany({ where: { flyPatternId: existing.id } });
      await tx.resource.deleteMany({ where: { flyPatternId: existing.id } });
      await tx.patternImage.deleteMany({ where: { flyPatternId: existing.id } });

      // Update the pattern itself with V2 consensus data
      await tx.flyPattern.update({
        where: { id: existing.id },
        data: {
          name: consensus.patternName,
          category: sanitizeCategory(consensus.category.value),
          difficulty: sanitizeDifficulty(consensus.difficulty.value),
          waterType: sanitizeWaterType(consensus.waterType.value),
          description: consensus.description,
          origin: consensus.origin,
        },
      });

      flyPatternId = existing.id;
    } else {
      // Create new FlyPattern
      const flyPattern = await tx.flyPattern.create({
        data: {
          name: consensus.patternName,
          slug: consensus.slug,
          category: sanitizeCategory(consensus.category.value),
          difficulty: sanitizeDifficulty(consensus.difficulty.value),
          waterType: sanitizeWaterType(consensus.waterType.value),
          description: consensus.description,
          origin: consensus.origin,
        },
      });

      flyPatternId = flyPattern.id;
    }

    // Create materials and seed cache
    for (const mat of consensus.materials) {
      const safeType = sanitizeMaterialType(mat.type) as MaterialType;
      const material = await tx.material.upsert({
        where: { name_type: { name: mat.name, type: safeType } },
        update: {},
        create: { name: mat.name, type: safeType },
      });

      // Cache for later lookups by substitutions/variations
      materialCache.set(mat.name.toLowerCase(), { id: material.id, name: material.name });

      await tx.flyPatternMaterial.create({
        data: {
          flyPatternId,
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
      const originalMat = await cachedFindOrCreateMaterial(tx, materialCache, sub.originalMaterial);
      const substituteMat = await cachedFindOrCreateMaterial(tx, materialCache, sub.substituteMaterial);

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
              substitutionType: sanitizeSubstitutionType(sub.substitutionType),
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
          flyPatternId,
          name: variation.name,
          description: variation.description,
        },
      });

      for (const change of variation.materialChanges) {
        const originalMat = await cachedFindOrCreateMaterial(tx, materialCache, change.original);
        const replacementMat = await cachedFindOrCreateMaterial(tx, materialCache, change.replacement);

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

    // Create tying steps (filter out steps with empty instructions)
    const validSteps = consensus.tyingSteps.filter(
      (step) => step.instruction && step.instruction.trim().length > 0
    );
    if (validSteps.length > 0) {
      await tx.tyingStep.createMany({
        data: validSteps.map((step, i) => ({
          flyPatternId,
          position: step.position ?? i + 1,
          title: step.title || `Step ${step.position ?? i + 1}`,
          instruction: step.instruction,
          tip: step.tip || null,
        })),
      });
    }

    // Add source resources
    await addNewResources(tx, flyPatternId, sources);

    // Add validated images
    await addNewImages(tx, flyPatternId, images);

    log.success("Pattern ingested", {
      pattern: consensus.patternName,
      id: flyPatternId,
      materials: String(consensus.materials.length),
      steps: String(consensus.tyingSteps.length),
      images: String(images.length),
      replaced: String(!!existing),
    });

    return flyPatternId;
  }, { timeout: 60000 }); // 60s — ingestion creates 100+ DB records per pattern
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

/**
 * Find or create a material, using an in-memory cache to avoid
 * redundant DB queries within the same transaction.
 */
async function cachedFindOrCreateMaterial(
  tx: TxClient,
  cache: Map<string, { id: string; name: string }>,
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!name || name.trim() === "") return null;

  const key = name.toLowerCase().trim();

  // Check cache first
  const cached = cache.get(key);
  if (cached) return cached;

  // Check cache for partial matches, but only when both strings are long enough
  // to avoid false matches (e.g., "bead" matching "beadhead", "wire" matching "wire ribbing")
  const MIN_PARTIAL_MATCH_LEN = 8;
  if (key.length >= MIN_PARTIAL_MATCH_LEN) {
    for (const [cachedKey, cachedVal] of cache) {
      if (cachedKey.length >= MIN_PARTIAL_MATCH_LEN) {
        if (cachedKey.includes(key) || key.includes(cachedKey)) {
          cache.set(key, cachedVal);
          return cachedVal;
        }
      }
    }
  }

  // DB lookup: exact match
  const exact = await tx.material.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (exact) {
    cache.set(key, exact);
    return exact;
  }

  // DB lookup: partial match (only for longer names to avoid false matches)
  if (name.trim().length >= MIN_PARTIAL_MATCH_LEN) {
    const partial = await tx.material.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (partial) {
      cache.set(key, partial);
      return partial;
    }
  }

  // Create new material
  const type = guessMaterialType(name);
  const created = await tx.material.create({
    data: { name, type: type as MaterialType },
    select: { id: true, name: true },
  });

  cache.set(key, created);
  return created;
}

const VALID_SUBSTITUTION_TYPES = new Set(["equivalent", "budget", "aesthetic", "availability"]);

function sanitizeSubstitutionType(raw: string | undefined): SubstitutionType {
  if (raw && VALID_SUBSTITUTION_TYPES.has(raw)) return raw as SubstitutionType;
  return "equivalent";
}

// ─── Enum Sanitizers ──────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(["dry", "nymph", "streamer", "emerger", "saltwater", "other"]);
const CATEGORY_ALIASES: Record<string, string> = {
  "dry fly": "dry",
  "wet fly": "nymph",
  wet: "nymph",
  "wet/nymph": "nymph",
  terrestrial: "dry",
  bass: "streamer",
  baitfish: "streamer",
  minnow: "streamer",
  shrimp: "saltwater",
  crab: "saltwater",
  buzzer: "emerger",
  midge: "emerger",
};

function sanitizeCategory(raw: string): FlyCategory {
  const lower = raw.toLowerCase().trim();
  if (VALID_CATEGORIES.has(lower)) return lower as FlyCategory;
  if (lower in CATEGORY_ALIASES) return CATEGORY_ALIASES[lower]! as FlyCategory;
  log.warn("Unknown category, defaulting to 'other'", { raw });
  return "other" as FlyCategory;
}

const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

function sanitizeDifficulty(raw: string): Difficulty {
  const lower = raw.toLowerCase().trim();
  if (VALID_DIFFICULTIES.has(lower)) return lower as Difficulty;
  if (lower === "easy") return "beginner" as Difficulty;
  if (lower === "moderate" || lower === "medium") return "intermediate" as Difficulty;
  if (lower === "hard" || lower === "expert") return "advanced" as Difficulty;
  log.warn("Unknown difficulty, defaulting to 'intermediate'", { raw });
  return "intermediate" as Difficulty;
}

const VALID_WATER_TYPES = new Set(["freshwater", "saltwater", "both"]);

function sanitizeWaterType(raw: string): WaterType {
  const lower = raw.toLowerCase().trim();
  if (VALID_WATER_TYPES.has(lower)) return lower as WaterType;
  if (lower === "fresh") return "freshwater" as WaterType;
  if (lower === "salt") return "saltwater" as WaterType;
  if (lower === "all" || lower === "any") return "both" as WaterType;
  log.warn("Unknown waterType, defaulting to 'freshwater'", { raw });
  return "freshwater" as WaterType;
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
