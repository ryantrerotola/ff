/**
 * V2 Consensus Building
 *
 * Key differences from v1:
 *   - No single-slot-per-type restriction on materials
 *   - Materials use ≥50% threshold (majority rule) with optional marking
 *   - Tying steps merged by Sonnet instead of picking best source
 *   - Substitutions include LLM-generated suggestions
 */

import Anthropic from "@anthropic-ai/sdk";
import { V2_CONFIG } from "./config";
import { slugify } from "../utils/slug";
import { combinedSimilarity } from "../normalization/matcher";
import { createLogger } from "../utils/logger";
import {
  STEP_MERGE_SYSTEM_PROMPT,
  STEP_MERGE_TOOL,
  buildStepMergePrompt,
} from "./prompts/consensus-steps";
import type {
  V2ExtractedPattern,
  V2ConsensusMaterial,
  V2ConsensusPattern,
  V2ExtractedStep,
  EnrichmentResult,
  ScrapedSource,
} from "./types";
import type { ConsensusEntry, ExtractedSubstitution, ExtractedVariation } from "../types";

const log = createLogger("v2:consensus");

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return client;
}

/**
 * Build consensus from multiple enriched extractions.
 */
export async function buildV2Consensus(
  enrichments: EnrichmentResult[],
  sources: ScrapedSource[]
): Promise<V2ConsensusPattern> {
  if (enrichments.length === 0) {
    throw new Error("Cannot build consensus from empty enrichments");
  }

  const extractions = enrichments.map((e) => e.enriched);
  const sourceCount = extractions.length;

  // Pattern name: most common
  const patternName = pickMostCommon(extractions.map((e) => e.patternName));

  log.info("Building consensus", { pattern: patternName, sources: String(sourceCount) });

  // Category, difficulty, waterType: majority voting
  const category = buildFieldConsensus("category", extractions.map((e) => e.category), sourceCount);
  const difficulty = buildFieldConsensus("difficulty", extractions.map((e) => e.difficulty), sourceCount);
  const waterType = buildFieldConsensus("waterType", extractions.map((e) => e.waterType), sourceCount);

  // Description: best quality
  const description = pickBestDescription(extractions.map((e) => e.description));

  // Origin: first non-null
  const origin = extractions.find((e) => e.origin)?.origin ?? null;

  // Materials: enhanced consensus with optional marking
  const materials = buildMaterialConsensus(extractions);

  // Variations: merge and dedup
  const variations = mergeVariations(extractions);

  // Substitutions: merge source-mentioned + LLM-generated
  const substitutions = mergeAllSubstitutions(extractions, enrichments);

  // Tying steps: Sonnet-merged from all sources
  const tyingSteps = await mergeStepsWithSonnet(patternName, enrichments, sources);

  // Overall confidence
  const overallConfidence = calculateOverallConfidence(
    category, difficulty, waterType, materials, sourceCount
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

// ─── Material Consensus (Enhanced) ─────────────────────────────────────────

interface MaterialWithSource {
  name: string;
  type: string;
  color: string | null;
  size: string | null;
  brand: string | null;
  productCode: string | null;
  required: boolean;
  position: number;
  sourceIndex: number;
}

function buildMaterialConsensus(extractions: V2ExtractedPattern[]): V2ConsensusMaterial[] {
  const sourceCount = extractions.length;
  const allMaterials: MaterialWithSource[] = [];

  for (let i = 0; i < extractions.length; i++) {
    for (const mat of extractions[i]!.materials) {
      allMaterials.push({ ...mat, sourceIndex: i });
    }
  }

  // Group by type
  const byType = new Map<string, MaterialWithSource[]>();
  for (const mat of allMaterials) {
    const existing = byType.get(mat.type) ?? [];
    existing.push(mat);
    byType.set(mat.type, existing);
  }

  const consensusMaterials: V2ConsensusMaterial[] = [];

  for (const [type, mats] of byType) {
    // Determine how many entries of this type a single source typically has
    const countsPerSource = new Map<number, number>();
    for (let s = 0; s < sourceCount; s++) {
      const countForSource = mats.filter((m) => m.sourceIndex === s).length;
      if (countForSource > 0) {
        countsPerSource.set(countForSource, (countsPerSource.get(countForSource) ?? 0) + 1);
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
    const groups = clusterMaterials(mats);

    // Rank by unique source count
    const rankedGroups = groups
      .map((group) => ({
        ...group,
        uniqueSources: new Set(group.members.map((m) => m.sourceIndex)).size,
      }))
      .sort((a, b) => b.uniqueSources - a.uniqueSources);

    // Keep top N clusters (N = typical slots per source)
    // But also keep additional clusters that appear in ≥2 sources (marked optional)
    for (let i = 0; i < rankedGroups.length; i++) {
      const group = rankedGroups[i]!;
      const freq = group.uniqueSources;
      const agreement = freq / sourceCount;

      // Skip if only in 1 source and beyond the typical slot count
      if (i >= slotsPerSource && freq < V2_CONFIG.consensus.optionalMinSources) continue;

      const isOptional = agreement < V2_CONFIG.consensus.materialThreshold && i >= slotsPerSource;

      const allGroupNames = group.members.map((m) => m.name);
      const bestName = pickMostCommon(allGroupNames);

      const colors = group.members.map((m) => m.color).filter((c): c is string => c !== null);
      const color = colors.length > 0 ? pickMostCommon(colors) : null;

      const sizes = group.members.map((m) => m.size).filter((s): s is string => s !== null);
      const size = sizes.length > 0 ? pickMostCommon(sizes) : null;

      const brands = group.members.map((m) => m.brand).filter((b): b is string => b !== null);
      const brand = brands.length > 0 ? pickMostCommon(brands) : null;

      const productCodes = group.members.map((m) => m.productCode).filter((p): p is string => p !== null);
      const productCode = productCodes.length > 0 ? pickMostCommon(productCodes) : null;

      const requiredCount = group.members.filter((m) => m.required).length;
      const required = !isOptional && requiredCount >= group.members.length / 2;

      const avgPosition = group.members.reduce((sum, m) => sum + m.position, 0) / group.members.length;

      consensusMaterials.push({
        name: bestName,
        type,
        color,
        size,
        brand,
        productCode,
        required,
        optional: isOptional,
        position: Math.round(avgPosition),
        confidence: agreement,
        sourceCount: freq,
        sourceAgreement: Math.round(agreement * 100) / 100,
      });
    }
  }

  // Sort by position and re-number
  consensusMaterials.sort((a, b) => a.position - b.position);
  consensusMaterials.forEach((m, i) => { m.position = i + 1; });

  return consensusMaterials;
}

function clusterMaterials(mats: MaterialWithSource[]): { name: string; members: MaterialWithSource[] }[] {
  const groups: { name: string; members: MaterialWithSource[] }[] = [];
  const uniqueNames = [...new Set(mats.map((m) => m.name))];

  for (const name of uniqueNames) {
    const members = mats.filter((m) => m.name === name);
    let merged = false;

    for (const group of groups) {
      if (combinedSimilarity(name, group.name) > V2_CONFIG.consensus.fuzzyMatchThreshold) {
        group.members.push(...members);
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push({ name, members });
    }
  }

  return groups;
}

// ─── Tying Steps: Sonnet Merge ─────────────────────────────────────────────

async function mergeStepsWithSonnet(
  patternName: string,
  enrichments: EnrichmentResult[],
  sources: ScrapedSource[]
): Promise<V2ExtractedStep[]> {
  // Collect step sequences from enrichments that have steps
  const stepSources: { sourceName: string; steps: V2ExtractedStep[] }[] = [];

  for (let i = 0; i < enrichments.length; i++) {
    const steps = enrichments[i]!.enriched.tyingSteps;
    if (steps && steps.length > 0) {
      const sourceName = sources[i]?.platform ?? `Source ${i + 1}`;
      stepSources.push({ sourceName, steps });
    }
  }

  if (stepSources.length === 0) {
    log.warn("No tying steps available for Sonnet merge", { pattern: patternName });
    return [];
  }

  log.info("Merging tying steps with Sonnet", {
    pattern: patternName,
    sources: String(stepSources.length),
  });

  try {
    const anthropic = getClient();

    const response = await anthropic.messages.create({
      model: V2_CONFIG.models.enrichment,
      max_tokens: V2_CONFIG.models.maxTokens.stepMerge,
      system: STEP_MERGE_SYSTEM_PROMPT,
      tools: [STEP_MERGE_TOOL],
      tool_choice: { type: "tool", name: "merge_steps" },
      messages: [
        {
          role: "user",
          content: buildStepMergePrompt(patternName, stepSources),
        },
      ],
    });

    const toolUseBlock = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      log.warn("No tool_use from Sonnet step merge, using best source");
      return pickBestSteps(stepSources);
    }

    const data = toolUseBlock.input as { steps: V2ExtractedStep[] };

    // Normalize positions
    data.steps.forEach((s, i) => { s.position = i + 1; });

    log.success("Steps merged", {
      pattern: patternName,
      inputSources: String(stepSources.length),
      outputSteps: String(data.steps.length),
    });

    return data.steps;
  } catch (err) {
    log.error("Step merge failed, using best source", { error: String(err) });
    return pickBestSteps(stepSources);
  }
}

function pickBestSteps(
  stepSources: { sourceName: string; steps: V2ExtractedStep[] }[]
): V2ExtractedStep[] {
  let best = stepSources[0]!.steps;
  let bestScore = 0;

  for (const source of stepSources) {
    const score = source.steps.length * 10 +
      source.steps.reduce((sum, s) => sum + (s.instruction?.length ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = source.steps;
    }
  }

  return best.map((s, i) => ({ ...s, position: i + 1 }));
}

// ─── Substitutions: Merge All ──────────────────────────────────────────────

function mergeAllSubstitutions(
  extractions: V2ExtractedPattern[],
  enrichments: EnrichmentResult[]
): ExtractedSubstitution[] {
  const seen = new Map<string, ExtractedSubstitution>();

  // Source-mentioned substitutions
  for (const ext of extractions) {
    for (const sub of ext.substitutions) {
      const key = `${sub.originalMaterial}→${sub.substituteMaterial}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, sub);
    }
  }

  // LLM-generated substitutions from enrichment
  for (const enrichment of enrichments) {
    for (const sub of enrichment.suggestedSubstitutions) {
      const key = `${sub.originalMaterial}→${sub.substituteMaterial}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, sub);
    }
  }

  return [...seen.values()];
}

// ─── Field Consensus ───────────────────────────────────────────────────────

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

// ─── Description ───────────────────────────────────────────────────────────

function pickBestDescription(descriptions: string[]): string {
  return descriptions
    .filter((d) => d.length > 0)
    .sort((a, b) => descriptionScore(b) - descriptionScore(a))[0] ?? "";
}

function descriptionScore(text: string): number {
  let score = 0;
  const lower = text.toLowerCase();

  if (text.length > 100 && text.length < 500) score += 10;
  else if (text.length >= 50) score += 5;

  if (lower.includes("imitat")) score += 3;
  if (lower.includes("effective")) score += 2;
  if (lower.includes("fish")) score += 2;
  if (lower.includes("trout") || lower.includes("bass")) score += 2;
  if (lower.includes("created") || lower.includes("developed")) score += 2;
  if (!lower.startsWith("this is") && !lower.startsWith("here")) score += 2;

  return score;
}

// ─── Variations ────────────────────────────────────────────────────────────

function mergeVariations(extractions: V2ExtractedPattern[]): ExtractedVariation[] {
  const seen = new Map<string, ExtractedVariation>();
  for (const ext of extractions) {
    for (const variation of ext.variations) {
      const key = variation.name.toLowerCase().trim();
      if (!seen.has(key) || variation.description.length > seen.get(key)!.description.length) {
        seen.set(key, variation);
      }
    }
  }
  return [...seen.values()];
}

// ─── Overall Confidence ────────────────────────────────────────────────────

function calculateOverallConfidence(
  category: ConsensusEntry,
  difficulty: ConsensusEntry,
  waterType: ConsensusEntry,
  materials: V2ConsensusMaterial[],
  sourceCount: number
): number {
  const fieldConfidence = (category.confidence + difficulty.confidence + waterType.confidence) / 3;
  const materialConfidence = materials.length > 0
    ? materials.reduce((sum, m) => sum + m.confidence, 0) / materials.length
    : 0;
  const sourceBonus = Math.min(sourceCount / 5, 1) * 0.2;

  const overall =
    fieldConfidence * 0.25 +
    materialConfidence * 0.45 +
    sourceBonus +
    (materials.length >= 3 ? 0.1 : 0);

  return Math.round(Math.min(overall, 1) * 100) / 100;
}

// ─── Utility ───────────────────────────────────────────────────────────────

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
