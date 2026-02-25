import { slugify, normalizePatternName } from "../utils/slug";
import { combinedSimilarity } from "./matcher";
import { createLogger } from "../utils/logger";
import type {
  ExtractedPattern,
  ExtractedStep,
  ExtractedSubstitution,
  ExtractedVariation,
  ConsensusPattern,
  ConsensusMaterial,
  ConsensusEntry,
} from "../types";

const log = createLogger("consensus");

/**
 * Build a consensus pattern from multiple extracted patterns
 * (multiple sources describing the same fly pattern).
 *
 * Uses voting-style aggregation: if N out of M sources agree on
 * a material, the confidence is N/M.
 */
export function buildConsensus(
  extractions: ExtractedPattern[]
): ConsensusPattern {
  if (extractions.length === 0) {
    throw new Error("Cannot build consensus from empty extractions");
  }

  const sourceCount = extractions.length;

  // Pattern name: use the most common name
  const patternName = pickMostCommon(
    extractions.map((e) => e.patternName)
  );

  log.info("Building consensus", {
    pattern: patternName,
    sources: String(sourceCount),
  });

  // Category consensus
  const category = buildFieldConsensus(
    "category",
    extractions.map((e) => e.category),
    sourceCount
  );

  // Difficulty consensus
  const difficulty = buildFieldConsensus(
    "difficulty",
    extractions.map((e) => e.difficulty),
    sourceCount
  );

  // Water type consensus
  const waterType = buildFieldConsensus(
    "waterType",
    extractions.map((e) => e.waterType),
    sourceCount
  );

  // Description: pick the longest, most detailed one
  const description = pickBestDescription(
    extractions.map((e) => e.description)
  );

  // Origin: pick first non-null
  const origin =
    extractions.find((e) => e.origin)?.origin ?? null;

  // Materials: aggregate and score by consensus
  const materials = buildMaterialConsensus(extractions);

  // Variations: merge unique variations
  const variations = mergeVariations(extractions);

  // Substitutions: merge unique substitutions
  const substitutions = mergeSubstitutions(extractions);

  // Tying steps: pick the best set from the source with the most detailed steps
  const tyingSteps = pickBestTyingSteps(extractions);

  // Overall confidence
  const overallConfidence = calculateOverallConfidence(
    category,
    difficulty,
    waterType,
    materials,
    sourceCount
  );

  return {
    patternName,
    slug: slugify(patternName),
    category,
    difficulty,
    waterType,
    description,
    origin,
    materials,
    variations,
    substitutions,
    tyingSteps,
    overallConfidence,
    sourceCount,
  };
}

/**
 * Build consensus for a single categorical field.
 */
function buildFieldConsensus(
  field: string,
  values: string[],
  totalSources: number
): ConsensusEntry {
  const counts = new Map<string, number>();

  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  let bestValue = "";
  let bestCount = 0;

  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestValue = value;
    }
  }

  return {
    field,
    value: bestValue,
    sourceCount: bestCount,
    totalSources,
    confidence: bestCount / totalSources,
  };
}

/**
 * Build material consensus across multiple sources.
 *
 * Strategy:
 * 1. Group materials by type across all sources
 * 2. Determine how many entries per type a single source typically has
 * 3. Cluster similar names within each type
 * 4. Keep only the top N clusters (N = typical per-source count)
 * 5. Excess clusters become substitution candidates, not duplicates
 */
function buildMaterialConsensus(
  extractions: ExtractedPattern[]
): ConsensusMaterial[] {
  const sourceCount = extractions.length;

  // Collect all materials with source info
  interface MaterialWithSource {
    name: string;
    type: string;
    color: string | null;
    size: string | null;
    required: boolean;
    position: number;
    sourceIndex: number;
  }

  const allMaterials: MaterialWithSource[] = [];
  for (let i = 0; i < extractions.length; i++) {
    const extraction = extractions[i]!;
    for (const mat of extraction.materials) {
      allMaterials.push({
        ...mat,
        sourceIndex: i,
      });
    }
  }

  // Group by type first, then cluster by name within each type
  const byType = new Map<string, MaterialWithSource[]>();
  for (const mat of allMaterials) {
    const existing = byType.get(mat.type) ?? [];
    existing.push(mat);
    byType.set(mat.type, existing);
  }

  const consensusMaterials: ConsensusMaterial[] = [];

  for (const [type, mats] of byType) {
    // Determine how many entries of this type a single source typically has
    // (the mode of per-source counts). E.g., if 3 sources each list 1 hook → slotsPerSource = 1
    const countsPerSource = new Map<number, number>();
    for (let s = 0; s < sourceCount; s++) {
      const countForSource = mats.filter((m) => m.sourceIndex === s).length;
      if (countForSource > 0) {
        countsPerSource.set(
          countForSource,
          (countsPerSource.get(countForSource) ?? 0) + 1
        );
      }
    }

    let slotsPerSource = 1;
    let bestFreq = 0;
    for (const [count, freq] of countsPerSource) {
      if (freq > bestFreq) {
        bestFreq = freq;
        slotsPerSource = count;
      }
    }

    // Cluster by name similarity
    const names = mats.map((m) => m.name);
    const uniqueNames = [...new Set(names)];

    // Group similar names
    const groups: { name: string; members: MaterialWithSource[] }[] = [];

    for (const name of uniqueNames) {
      const members = mats.filter((m) => m.name === name);

      // Check if this name belongs to an existing group
      let merged = false;
      for (const group of groups) {
        if (combinedSimilarity(name, group.name) > 0.8) {
          group.members.push(...members);
          merged = true;
          break;
        }
      }

      if (!merged) {
        groups.push({ name, members });
      }
    }

    // Rank clusters by how many unique sources mention them (popularity)
    const rankedGroups = groups
      .map((group) => ({
        ...group,
        uniqueSources: new Set(group.members.map((m) => m.sourceIndex)).size,
      }))
      .sort((a, b) => b.uniqueSources - a.uniqueSources);

    // Keep only top N clusters where N = typical slots per source
    const keptGroups = rankedGroups.slice(0, slotsPerSource);

    // Build consensus entry for each kept group
    for (const group of keptGroups) {
      const freq = group.uniqueSources;

      // Pick the most common name (not just the first one)
      const allGroupNames = group.members.map((m) => m.name);
      const bestName = pickMostCommon(allGroupNames);

      // Pick the most common color
      const colors = group.members
        .map((m) => m.color)
        .filter((c): c is string => c !== null);
      const color = colors.length > 0 ? pickMostCommon(colors) : null;

      // Pick the most common size
      const sizes = group.members
        .map((m) => m.size)
        .filter((s): s is string => s !== null);
      const size = sizes.length > 0 ? pickMostCommon(sizes) : null;

      // Required if majority say required
      const requiredCount = group.members.filter((m) => m.required).length;
      const required = requiredCount >= group.members.length / 2;

      // Average position
      const avgPosition =
        group.members.reduce((sum, m) => sum + m.position, 0) /
        group.members.length;

      consensusMaterials.push({
        name: bestName,
        type,
        color,
        size,
        required,
        position: Math.round(avgPosition),
        confidence: freq / sourceCount,
        sourceCount: freq,
      });
    }
  }

  // Sort by position
  consensusMaterials.sort((a, b) => a.position - b.position);

  // Re-number positions
  for (let i = 0; i < consensusMaterials.length; i++) {
    consensusMaterials[i]!.position = i + 1;
  }

  return consensusMaterials;
}

/**
 * Merge variations from multiple sources, deduplicating by name.
 */
function mergeVariations(
  extractions: ExtractedPattern[]
): ExtractedVariation[] {
  const seen = new Map<string, ExtractedVariation>();

  for (const ext of extractions) {
    for (const variation of ext.variations) {
      const key = normalizePatternName(variation.name);
      if (!seen.has(key)) {
        seen.set(key, variation);
      } else {
        // Prefer the version with more detail
        const existing = seen.get(key)!;
        if (variation.description.length > existing.description.length) {
          seen.set(key, variation);
        }
      }
    }
  }

  return [...seen.values()];
}

/**
 * Merge substitutions from multiple sources, deduplicating.
 */
function mergeSubstitutions(
  extractions: ExtractedPattern[]
): ExtractedSubstitution[] {
  const seen = new Map<string, ExtractedSubstitution>();

  for (const ext of extractions) {
    for (const sub of ext.substitutions) {
      const key = `${sub.originalMaterial}→${sub.substituteMaterial}`.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, sub);
      }
    }
  }

  return [...seen.values()];
}

/**
 * Pick the best tying steps from multiple sources.
 *
 * Strategy: step-by-step merging across sources is unreliable since
 * different sources describe steps differently. Instead, pick the source
 * with the most detailed steps (highest total instruction text length).
 */
function pickBestTyingSteps(
  extractions: ExtractedPattern[]
): ExtractedStep[] {
  let bestSteps: ExtractedStep[] = [];
  let bestScore = 0;

  for (const ext of extractions) {
    const steps = ext.tyingSteps ?? [];
    if (steps.length === 0) continue;

    // Score by: number of steps * average instruction detail
    const totalLength = steps.reduce(
      (sum, s) => sum + (s.instruction?.length ?? 0),
      0
    );
    const score = steps.length * 10 + totalLength;

    if (score > bestScore) {
      bestScore = score;
      bestSteps = steps;
    }
  }

  // Re-number positions sequentially
  return bestSteps.map((step, i) => ({
    ...step,
    position: i + 1,
  }));
}

/**
 * Pick the most common value from an array of strings.
 */
function pickMostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  let best = values[0] ?? "";
  let bestCount = 0;

  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = value;
    }
  }

  return best;
}

/**
 * Pick the best description from multiple sources.
 * Prefers longer, more informative descriptions.
 */
function pickBestDescription(descriptions: string[]): string {
  return descriptions
    .filter((d) => d.length > 0)
    .sort((a, b) => {
      // Prefer descriptions that mention fishing/imitation context
      const aScore = descriptionQualityScore(a);
      const bScore = descriptionQualityScore(b);
      return bScore - aScore;
    })[0] ?? "";
}

function descriptionQualityScore(text: string): number {
  let score = 0;
  const lower = text.toLowerCase();

  // Length bonus (but not too long)
  if (text.length > 100 && text.length < 500) score += 10;
  else if (text.length >= 50) score += 5;

  // Contains useful keywords
  if (lower.includes("imitat")) score += 3;
  if (lower.includes("effective")) score += 2;
  if (lower.includes("fish")) score += 2;
  if (lower.includes("trout") || lower.includes("bass")) score += 2;
  if (lower.includes("drift") || lower.includes("swing") || lower.includes("strip"))
    score += 2;
  if (lower.includes("created") || lower.includes("developed"))
    score += 2;

  // Doesn't start with "this is" or "here" (sign of conversational text)
  if (!lower.startsWith("this is") && !lower.startsWith("here")) score += 2;

  return score;
}

/**
 * Calculate overall confidence for a consensus pattern.
 */
function calculateOverallConfidence(
  category: ConsensusEntry,
  difficulty: ConsensusEntry,
  waterType: ConsensusEntry,
  materials: ConsensusMaterial[],
  sourceCount: number
): number {
  const fieldConfidence =
    (category.confidence + difficulty.confidence + waterType.confidence) / 3;

  // Average material confidence
  const materialConfidence =
    materials.length > 0
      ? materials.reduce((sum, m) => sum + m.confidence, 0) / materials.length
      : 0;

  // More sources = higher base confidence
  const sourceBonus = Math.min(sourceCount / 5, 1) * 0.2;

  // Weighted average
  const overall =
    fieldConfidence * 0.25 +
    materialConfidence * 0.45 +
    sourceBonus +
    (materials.length >= 3 ? 0.1 : 0);

  return Math.round(Math.min(overall, 1) * 100) / 100;
}
