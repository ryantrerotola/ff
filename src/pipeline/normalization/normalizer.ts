import { prisma } from "@/lib/prisma";
import { findBestMatch, clusterSimilarStrings } from "./matcher";
import { normalizePatternName, normalizeMaterialName } from "../utils/slug";
import { createLogger } from "../utils/logger";
import { PIPELINE_CONFIG } from "../config";
import type { ExtractedPattern, NormalizedMaterial } from "../types";

const log = createLogger("normalizer");

/**
 * Normalize an extracted material name against the canonical materials table.
 *
 * If a match is found in canonical_materials, returns the canonical name.
 * If no match is found, creates a new canonical entry.
 */
export async function normalizeMaterial(
  rawName: string,
  rawType: string
): Promise<NormalizedMaterial> {
  const normalizedName = normalizeMaterialName(rawName);

  // Step 1: Check canonical materials for exact match or alias
  const canonicals = await prisma.canonicalMaterial.findMany({
    where: { materialType: rawType as never },
  });

  // Check exact canonical name
  for (const canonical of canonicals) {
    if (normalizeMaterialName(canonical.canonicalName) === normalizedName) {
      return {
        canonicalName: canonical.canonicalName,
        type: canonical.materialType,
        aliases: canonical.aliases,
        confidence: 1.0,
      };
    }
  }

  // Check aliases
  for (const canonical of canonicals) {
    for (const alias of canonical.aliases) {
      if (normalizeMaterialName(alias) === normalizedName) {
        return {
          canonicalName: canonical.canonicalName,
          type: canonical.materialType,
          aliases: canonical.aliases,
          confidence: 0.95,
        };
      }
    }
  }

  // Step 2: Fuzzy match against canonical names and aliases
  const allNames: { canonical: typeof canonicals[number]; name: string }[] = [];
  for (const c of canonicals) {
    allNames.push({ canonical: c, name: c.canonicalName });
    for (const alias of c.aliases) {
      allNames.push({ canonical: c, name: alias });
    }
  }

  const candidateNames = allNames.map((n) => n.name);
  const bestMatch = findBestMatch(rawName, candidateNames);

  if (
    bestMatch &&
    bestMatch.score >= PIPELINE_CONFIG.normalization.fuzzyMatchThreshold
  ) {
    const matched = allNames.find((n) => n.name === bestMatch.match);
    if (matched) {
      // Add the raw name as a new alias
      if (
        !matched.canonical.aliases.includes(rawName) &&
        matched.canonical.canonicalName !== rawName
      ) {
        await prisma.canonicalMaterial.update({
          where: { id: matched.canonical.id },
          data: {
            aliases: { push: rawName },
          },
        });
      }

      return {
        canonicalName: matched.canonical.canonicalName,
        type: matched.canonical.materialType,
        aliases: [...matched.canonical.aliases, rawName],
        confidence: bestMatch.score,
      };
    }
  }

  // Step 3: Also check existing production Materials table
  const existingMaterials = await prisma.material.findMany({
    where: { type: rawType as never },
    select: { name: true, type: true },
  });

  const prodMatch = findBestMatch(
    rawName,
    existingMaterials.map((m) => m.name)
  );

  if (
    prodMatch &&
    prodMatch.score >= PIPELINE_CONFIG.normalization.fuzzyMatchThreshold
  ) {
    // Create canonical entry from production material
    await prisma.canonicalMaterial.upsert({
      where: { canonicalName: prodMatch.match },
      update: {
        aliases: { push: rawName },
      },
      create: {
        canonicalName: prodMatch.match,
        materialType: rawType as never,
        aliases: rawName !== prodMatch.match ? [rawName] : [],
      },
    });

    return {
      canonicalName: prodMatch.match,
      type: rawType,
      aliases: [rawName],
      confidence: prodMatch.score,
    };
  }

  // Step 4: No match found — create new canonical entry
  log.info("New canonical material", {
    name: rawName,
    type: rawType,
  });

  await prisma.canonicalMaterial.upsert({
    where: { canonicalName: rawName },
    update: {},
    create: {
      canonicalName: rawName,
      materialType: rawType as never,
      aliases: [],
    },
  });

  return {
    canonicalName: rawName,
    type: rawType,
    aliases: [],
    confidence: 0.5,
  };
}

/**
 * Normalize all materials in an extracted pattern.
 */
export async function normalizePatternMaterials(
  extracted: ExtractedPattern
): Promise<ExtractedPattern> {
  const normalizedMaterials = await Promise.all(
    extracted.materials.map(async (mat) => {
      const normalized = await normalizeMaterial(mat.name, mat.type);
      return {
        ...mat,
        name: normalized.canonicalName,
      };
    })
  );

  return {
    ...extracted,
    materials: normalizedMaterials,
  };
}

/**
 * Determine if two extracted patterns refer to the same fly pattern.
 */
export function isSamePattern(a: ExtractedPattern, b: ExtractedPattern): boolean {
  const nameA = normalizePatternName(a.patternName);
  const nameB = normalizePatternName(b.patternName);

  // Exact match
  if (nameA === nameB) return true;

  // Check alternate names
  const allNamesA = [
    nameA,
    ...a.alternateNames.map(normalizePatternName),
  ];
  const allNamesB = [
    nameB,
    ...b.alternateNames.map(normalizePatternName),
  ];

  for (const na of allNamesA) {
    for (const nb of allNamesB) {
      if (na === nb) return true;
    }
  }

  return false;
}

/**
 * Group extracted patterns by identity (same pattern from different sources).
 */
export function groupExtractedPatterns(
  patterns: ExtractedPattern[]
): ExtractedPattern[][] {
  const names = patterns.map((p) => normalizePatternName(p.patternName));
  const clusters = clusterSimilarStrings(
    names,
    PIPELINE_CONFIG.normalization.fuzzyMatchThreshold
  );

  return clusters.map((cluster) => {
    return cluster
      .map((name) => {
        const idx = names.indexOf(name);
        return idx >= 0 ? patterns[idx] : undefined;
      })
      .filter((p): p is ExtractedPattern => p !== undefined);
  });
}
