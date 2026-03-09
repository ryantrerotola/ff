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
  V2ConsensusVariation,
  V2ExtractedVariation,
  V2ExtractedStep,
  EnrichmentResult,
  ScrapedSource,
} from "./types";
import type { ConsensusEntry, ExtractedSubstitution } from "../types";

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

  // Variations: merge explicit + detect from source disagreements
  const variations = buildVariationConsensus(extractions, category.value);

  // Substitutions: merge source-mentioned + LLM-generated
  const substitutions = mergeAllSubstitutions(extractions, enrichments);

  // Tying steps: Sonnet-merged from agreeing sources only
  // Filter out outlier sources whose materials diverge significantly from consensus
  const consensusMaterialNames = new Set(
    materials.map((m) => m.name.toLowerCase())
  );
  const agreementBySource = enrichments.map((e) => {
    const srcMats = e.enriched.materials.map((m) => m.name.toLowerCase());
    if (srcMats.length === 0) return 0;
    const overlap = srcMats.filter((name) =>
      [...consensusMaterialNames].some(
        (cm) => combinedSimilarity(name, cm) > 0.7
      )
    ).length;
    return overlap / srcMats.length;
  });

  const filteredEnrichments = enrichments.filter((_, i) => agreementBySource[i]! >= 0.4);
  const filteredSources = sources.filter((_, i) => agreementBySource[i]! >= 0.4);

  if (filteredEnrichments.length === 0) {
    // Fallback: use all if filtering removed everything
    log.warn("All sources filtered for step merge, using all", { pattern: patternName });
  }

  const stepEnrichments = filteredEnrichments.length > 0 ? filteredEnrichments : enrichments;
  const stepSources = filteredEnrichments.length > 0 ? filteredSources : sources;
  const tyingSteps = await mergeStepsWithSonnet(patternName, stepEnrichments, stepSources);

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

      // For materials beyond the typical slot count, require both a minimum
      // source count AND a minimum agreement ratio to prevent outlier pollution.
      // e.g., 2/8 sources = 25% agreement — too low to include as even optional.
      if (i >= slotsPerSource) {
        if (freq < V2_CONFIG.consensus.optionalMinSources) continue;
        if (agreement < V2_CONFIG.consensus.optionalMinAgreement) continue;
      }

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

/**
 * Common color and modifier words that should be ignored when clustering
 * materials by base name. Without this, "White Bucktail" and "Olive Bucktail"
 * become separate entries instead of one "Bucktail" slot with color options.
 */
const COLOR_MODIFIERS = new Set([
  // Colors
  "white", "black", "brown", "tan", "olive", "chartreuse", "yellow", "red",
  "orange", "pink", "purple", "blue", "green", "grey", "gray", "cream",
  "natural", "dark", "light", "medium", "pale", "bright", "fluorescent",
  "fl", "hot",
  // Metal/material modifiers
  "lead", "brass", "tungsten", "nickel", "gold", "silver", "copper",
  "chrome", "painted", "plated",
  // Size modifiers
  "large", "small", "mini", "extra", "xl", "xs",
]);

/**
 * Strip color and modifier words from a material name to get the base name
 * for clustering. "White Bucktail" → "bucktail", "Lead Dumbbell Eyes" → "dumbbell eyes"
 */
function baseMaterialName(name: string): string {
  const tokens = name.toLowerCase().split(/\s+/);
  const filtered = tokens.filter((t) => !COLOR_MODIFIERS.has(t));
  // If stripping removes everything, keep original
  return filtered.length > 0 ? filtered.join(" ") : name.toLowerCase();
}

function clusterMaterials(mats: MaterialWithSource[]): { name: string; members: MaterialWithSource[] }[] {
  const groups: { name: string; members: MaterialWithSource[] }[] = [];
  const uniqueNames = [...new Set(mats.map((m) => m.name))];

  for (const name of uniqueNames) {
    const members = mats.filter((m) => m.name === name);
    let merged = false;

    const baseName = baseMaterialName(name);

    for (const group of groups) {
      const groupBase = baseMaterialName(group.name);

      // Compare base names (color-stripped) for clustering
      if (
        combinedSimilarity(baseName, groupBase) > V2_CONFIG.consensus.fuzzyMatchThreshold ||
        combinedSimilarity(name, group.name) > V2_CONFIG.consensus.fuzzyMatchThreshold
      ) {
        group.members.push(...members);
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push({ name, members });
    }
  }

  // Post-processing: split clusters that contain multiple entries from the
  // same source into separate positional slots. E.g., a Clouser Minnow source
  // lists both "White Bucktail" (pos 4) and "Olive Bucktail" (pos 6) as wing
  // materials — they cluster together by base name, but are actually separate
  // slots. Split by median position within each source to recover the slots.
  return groups.flatMap((group) => splitByPosition(group));
}

/**
 * If a cluster has multiple entries from the same source at different
 * positions, split it into positional sub-clusters (slot 1, slot 2, etc.).
 */
function splitByPosition(
  group: { name: string; members: MaterialWithSource[] }
): { name: string; members: MaterialWithSource[] }[] {
  // Count how many members each source contributed
  const perSource = new Map<number, MaterialWithSource[]>();
  for (const m of group.members) {
    const existing = perSource.get(m.sourceIndex) ?? [];
    existing.push(m);
    perSource.set(m.sourceIndex, existing);
  }

  // Find the most common count per source — that's how many real slots there are
  const countFreq = new Map<number, number>();
  for (const members of perSource.values()) {
    const c = members.length;
    countFreq.set(c, (countFreq.get(c) ?? 0) + 1);
  }

  let typicalCount = 1;
  let bestFreq = 0;
  for (const [count, freq] of countFreq) {
    if (freq > bestFreq || (freq === bestFreq && count > typicalCount)) {
      bestFreq = freq;
      typicalCount = count;
    }
  }

  // If most sources only contribute 1 entry, no split needed.
  // Sources that list a single entry with a combined color (e.g.,
  // "Olive and Brown Bucktail") are fine — they stay in one slot and
  // their full name is preserved as-is.
  if (typicalCount <= 1) return [group];

  // Split into positional sub-clusters.
  // For each source with multiple entries, sort by position and assign to slots.
  // Sources with fewer entries than typicalCount go into the first slot
  // (they may describe a mixed-color wing as a single entry).
  const slots: MaterialWithSource[][] = Array.from({ length: typicalCount }, () => []);

  for (const [, members] of perSource) {
    const sorted = [...members].sort((a, b) => a.position - b.position);
    if (sorted.length === 1 && typicalCount > 1) {
      // This source combined multiple slots into one entry (e.g., "Olive and Brown Bucktail").
      // Put it in the slot whose average position is closest.
      const pos = sorted[0]!.position;
      const slotPositions = slots.map((slot) =>
        slot.length > 0
          ? slot.reduce((sum, m) => sum + m.position, 0) / slot.length
          : Infinity
      );
      // Find the closest slot, or the first empty one
      let bestSlot = 0;
      let bestDist = Infinity;
      for (let s = 0; s < typicalCount; s++) {
        const dist = slotPositions[s] === Infinity ? 0 : Math.abs(slotPositions[s]! - pos);
        if (dist < bestDist) {
          bestDist = dist;
          bestSlot = s;
        }
      }
      slots[bestSlot]!.push(sorted[0]!);
    } else {
      for (let i = 0; i < sorted.length; i++) {
        const slotIndex = Math.min(i, typicalCount - 1);
        slots[slotIndex]!.push(sorted[i]!);
      }
    }
  }

  return slots
    .filter((s) => s.length > 0)
    .map((members) => ({
      // Use the full original name (with colors) — don't strip to base name
      name: pickMostCommon(members.map((m) => m.name)),
      members,
    }));
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

/**
 * Build variation consensus from two signals:
 * 1. Explicit variations mentioned by sources (merged + deduped)
 * 2. Implicit variations detected from material disagreements between sources
 *
 * The default pattern represents what the majority of sources agree on.
 * Minority material choices become detected variations.
 */
function buildVariationConsensus(
  extractions: V2ExtractedPattern[],
  patternCategory: string
): V2ConsensusVariation[] {
  const variations: V2ConsensusVariation[] = [];

  // 1. Merge explicitly mentioned variations
  const explicit = mergeExplicitVariations(extractions);
  variations.push(...explicit);

  // 2. Detect variations from source disagreements
  const detected = detectVariationsFromDisagreements(extractions, patternCategory);

  // Only add detected variations that don't duplicate explicit ones
  for (const d of detected) {
    const isDuplicate = variations.some(
      (v) => combinedSimilarity(v.name.toLowerCase(), d.name.toLowerCase()) > 0.7
    );
    if (!isDuplicate) {
      variations.push(d);
    }
  }

  // Cap at 8 variations — too many creates excessive DB work during ingestion
  // and degrades UX. Prefer explicit (source-mentioned) over detected.
  const capped = variations.slice(0, 8);

  log.info("Variation consensus", {
    explicit: String(explicit.length),
    detected: String(detected.length),
    final: String(capped.length),
  });

  return capped;
}

/**
 * Merge explicitly mentioned variations across sources.
 * Dedup by name similarity, keep the best description, track source count.
 */
function mergeExplicitVariations(extractions: V2ExtractedPattern[]): V2ConsensusVariation[] {
  const groups = new Map<string, {
    variations: V2ExtractedVariation[];
    sourceIndices: Set<number>;
  }>();

  for (let i = 0; i < extractions.length; i++) {
    for (const variation of extractions[i]!.variations) {
      const key = variation.name.toLowerCase().trim();

      // Try to find an existing group by fuzzy match
      let matched = false;
      for (const [existingKey, group] of groups) {
        if (combinedSimilarity(key, existingKey) > 0.7) {
          group.variations.push(variation);
          group.sourceIndices.add(i);
          matched = true;
          break;
        }
      }

      if (!matched) {
        groups.set(key, {
          variations: [variation],
          sourceIndices: new Set([i]),
        });
      }
    }
  }

  return [...groups.values()].map((group) => {
    // Pick the variation with the best (longest) description
    const best = group.variations.sort((a, b) => b.description.length - a.description.length)[0]!;

    // Merge all material changes from all sources for this variation
    const allChanges = new Map<string, { original: string; replacement: string }>();
    for (const v of group.variations) {
      for (const change of v.materialChanges) {
        const changeKey = `${change.original.toLowerCase()}→${change.replacement.toLowerCase()}`;
        if (!allChanges.has(changeKey)) {
          allChanges.set(changeKey, change);
        }
      }
    }

    return {
      name: best.name,
      description: best.description,
      category: best.category,
      materialChanges: [...allChanges.values()],
      sourceCount: group.sourceIndices.size,
      detectedFromDisagreement: false,
    };
  });
}

/**
 * Detect implicit variations by analyzing where sources disagree on materials.
 *
 * If the majority of sources use material A for a slot but a minority uses material B,
 * the minority choice becomes a detected variation.
 *
 * Detects: color disagreements, weight (bead/no bead), wing style, hackle style.
 */
function detectVariationsFromDisagreements(
  extractions: V2ExtractedPattern[],
  patternCategory: string
): V2ConsensusVariation[] {
  if (extractions.length < 2) return [];

  const detected: V2ConsensusVariation[] = [];

  // Detect weight variations (bead vs no bead)
  detectWeightVariations(extractions, detected);

  // Detect color variations per material type
  detectColorVariations(extractions, detected);

  // Detect wing style variations (dry flies only)
  if (patternCategory === "dry") {
    detectWingStyleVariations(extractions, detected);
  }

  // Detect hackle variations (nymph/emerger)
  if (patternCategory === "nymph" || patternCategory === "emerger") {
    detectHackleVariations(extractions, detected);
  }

  return detected;
}

/**
 * Detect weight variations: beadhead vs unweighted vs lead-wrapped.
 * If some sources include a bead/weight and others don't, that's a variation.
 */
function detectWeightVariations(
  extractions: V2ExtractedPattern[],
  out: V2ConsensusVariation[]
): void {
  const sourceCount = extractions.length;
  const withBead: number[] = [];
  const withLeadWeight: number[] = [];
  const unweighted: number[] = [];

  for (let i = 0; i < extractions.length; i++) {
    const mats = extractions[i]!.materials;
    const hasBead = mats.some((m) => m.type === "bead");
    const hasWeight = mats.some((m) => m.type === "weight");

    if (hasBead) withBead.push(i);
    else if (hasWeight) withLeadWeight.push(i);
    else unweighted.push(i);
  }

  // Only create variations if there's actual disagreement (not all sources agree)
  const groups = [withBead, withLeadWeight, unweighted].filter((g) => g.length > 0);
  if (groups.length < 2) return;

  // Majority is the default; minority groups become variations
  const majorityIsBeaded = withBead.length >= sourceCount / 2;
  const majorityIsWeighted = withLeadWeight.length >= sourceCount / 2;

  if (majorityIsBeaded && unweighted.length > 0) {
    out.push({
      name: "Unweighted",
      description: "Tied without a bead head for a lighter presentation or use with split shot",
      category: "weight",
      materialChanges: [{ original: "Bead", replacement: "None (unweighted)" }],
      sourceCount: unweighted.length,
      detectedFromDisagreement: true,
    });
  }

  if (!majorityIsBeaded && !majorityIsWeighted && withBead.length > 0) {
    // Find the bead name from a source that has one
    const beadSource = extractions[withBead[0]!]!;
    const beadMat = beadSource.materials.find((m) => m.type === "bead");
    const beadName = beadMat
      ? `${beadMat.color ? beadMat.color + " " : ""}${beadMat.name}`
      : "Bead Head";

    out.push({
      name: "Beadhead",
      description: "Tied with a bead head for added weight and flash to get the fly deeper",
      category: "weight",
      materialChanges: [{ original: "None (unweighted)", replacement: beadName }],
      sourceCount: withBead.length,
      detectedFromDisagreement: true,
    });
  }

  if (withLeadWeight.length > 0 && withLeadWeight.length < sourceCount) {
    const isMinority = withLeadWeight.length < sourceCount / 2;
    if (isMinority) {
      out.push({
        name: "Lead-Wrapped",
        description: "Tied with lead or lead-free wire wraps under the body for extra weight",
        category: "weight",
        materialChanges: [{ original: "None", replacement: "Lead wire wraps" }],
        sourceCount: withLeadWeight.length,
        detectedFromDisagreement: true,
      });
    }
  }
}

/**
 * Detect color variations by analyzing disagreements in material colors per type.
 * If sources disagree on the color of a key material (body, tail, hackle, wing),
 * minority color combos become a detected color variation.
 */
function detectColorVariations(
  extractions: V2ExtractedPattern[],
  out: V2ConsensusVariation[]
): void {
  const sourceCount = extractions.length;
  if (sourceCount < 3) return; // Need at least 3 sources for meaningful color disagreement

  // Track color schemes: concatenate colors of key material types to form a "color signature"
  const colorTypes = ["body", "tail", "hackle", "wing"] as const;
  const signatures = new Map<string, { indices: number[]; colors: Map<string, string> }>();

  for (let i = 0; i < extractions.length; i++) {
    const mats = extractions[i]!.materials;
    const sig: string[] = [];
    const colors = new Map<string, string>();

    for (const type of colorTypes) {
      const mat = mats.find((m) => m.type === type && m.color);
      if (mat?.color) {
        sig.push(`${type}:${mat.color.toLowerCase()}`);
        colors.set(type, mat.color);
      }
    }

    const sigKey = sig.sort().join("|");
    if (sigKey === "") continue; // No color info

    const existing = signatures.get(sigKey);
    if (existing) {
      existing.indices.push(i);
    } else {
      signatures.set(sigKey, { indices: [i], colors });
    }
  }

  if (signatures.size < 2) return; // All sources agree on colors

  // Find the majority color signature
  let majorityKey = "";
  let majorityCount = 0;
  for (const [key, group] of signatures) {
    if (group.indices.length > majorityCount) {
      majorityCount = group.indices.length;
      majorityKey = key;
    }
  }

  const majorityColors = signatures.get(majorityKey)!.colors;

  // Create variations for minority color schemes
  for (const [key, group] of signatures) {
    if (key === majorityKey) continue;
    if (group.indices.length < 2) continue; // Need at least 2 sources to be a real variation

    const materialChanges: { original: string; replacement: string }[] = [];
    const colorDiffs: string[] = [];

    for (const [type, color] of group.colors) {
      const majorColor = majorityColors.get(type);
      if (majorColor && majorColor.toLowerCase() !== color.toLowerCase()) {
        materialChanges.push({
          original: `${capitalizeFirst(type)} (${majorColor})`,
          replacement: `${capitalizeFirst(type)} (${color})`,
        });
        colorDiffs.push(color);
      }
    }

    if (materialChanges.length > 0) {
      const colorName = colorDiffs.join(" & ");
      out.push({
        name: `${capitalizeFirst(colorName)} Version`,
        description: `Tied with ${colorDiffs.join(" and ")} instead of the standard color scheme`,
        category: "color",
        materialChanges,
        sourceCount: group.indices.length,
        detectedFromDisagreement: true,
      });
    }
  }
}

/**
 * Detect wing style variations for dry flies.
 * If some sources describe a parachute post and others describe upright wings,
 * the minority style becomes a variation.
 */
function detectWingStyleVariations(
  extractions: V2ExtractedPattern[],
  out: V2ConsensusVariation[]
): void {
  const parachute: number[] = [];
  const upright: number[] = [];

  for (let i = 0; i < extractions.length; i++) {
    const mats = extractions[i]!.materials;
    const wings = mats.filter((m) => m.type === "wing");
    const name = extractions[i]!.patternName.toLowerCase();

    const isParachute = name.includes("parachute") ||
      wings.some((w) =>
        w.name.toLowerCase().includes("parachute") ||
        w.name.toLowerCase().includes("post")
      );

    if (isParachute) parachute.push(i);
    else if (wings.length > 0) upright.push(i);
  }

  if (parachute.length === 0 || upright.length === 0) return;

  const majorityIsParachute = parachute.length > upright.length;

  if (majorityIsParachute && upright.length > 0) {
    out.push({
      name: "Traditional Upright Wing",
      description: "Tied with traditional upright wings instead of a parachute post",
      category: "wing_style",
      materialChanges: [{ original: "Parachute post", replacement: "Upright wing" }],
      sourceCount: upright.length,
      detectedFromDisagreement: true,
    });
  } else if (!majorityIsParachute && parachute.length > 0) {
    out.push({
      name: "Parachute",
      description: "Tied with a parachute-style post and horizontal hackle for improved visibility and presentation",
      category: "wing_style",
      materialChanges: [{ original: "Upright wing", replacement: "Parachute post" }],
      sourceCount: parachute.length,
      detectedFromDisagreement: true,
    });
  }
}

/**
 * Detect hackle variations for nymph/wet patterns.
 * If some sources include a soft hackle collar and others don't,
 * the minority becomes a variation.
 */
function detectHackleVariations(
  extractions: V2ExtractedPattern[],
  out: V2ConsensusVariation[]
): void {
  const withSoftHackle: number[] = [];
  const withoutHackle: number[] = [];

  for (let i = 0; i < extractions.length; i++) {
    const mats = extractions[i]!.materials;
    const hackles = mats.filter((m) => m.type === "hackle");

    const hasSoftHackle = hackles.some(
      (h) =>
        h.name.toLowerCase().includes("soft hackle") ||
        h.name.toLowerCase().includes("hen hackle") ||
        h.name.toLowerCase().includes("partridge") ||
        h.name.toLowerCase().includes("starling")
    );

    if (hasSoftHackle) withSoftHackle.push(i);
    else withoutHackle.push(i);
  }

  if (withSoftHackle.length === 0 || withoutHackle.length === 0) return;
  // Need meaningful disagreement
  if (withSoftHackle.length < 2 && withoutHackle.length < 2) return;

  const majorityHasSoftHackle = withSoftHackle.length > withoutHackle.length;

  if (majorityHasSoftHackle) {
    out.push({
      name: "Without Soft Hackle",
      description: "Tied without the soft hackle collar for a slimmer profile",
      category: "hackle",
      materialChanges: [{ original: "Soft hackle collar", replacement: "None" }],
      sourceCount: withoutHackle.length,
      detectedFromDisagreement: true,
    });
  } else {
    // Find the hackle name from a source that has one
    const hackleSource = extractions[withSoftHackle[0]!]!;
    const hackleMat = hackleSource.materials.find(
      (m) => m.type === "hackle" &&
        (m.name.toLowerCase().includes("soft") ||
         m.name.toLowerCase().includes("hen") ||
         m.name.toLowerCase().includes("partridge"))
    );
    const hackleName = hackleMat?.name ?? "Soft Hackle Collar";

    out.push({
      name: "Soft Hackle",
      description: "Tied with a soft hackle collar for added movement in the water",
      category: "hackle",
      materialChanges: [{ original: "None", replacement: hackleName }],
      sourceCount: withSoftHackle.length,
      detectedFromDisagreement: true,
    });
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
