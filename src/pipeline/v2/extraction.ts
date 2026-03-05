/**
 * V2 Extraction Stage (Pass 1: Haiku)
 *
 * Extracts structured pattern data using Claude Haiku.
 * Key differences from v1:
 *   - NO material type deduplication
 *   - 24K char content cap (up from 12K)
 *   - Brand/product code extraction
 */

import Anthropic from "@anthropic-ai/sdk";
import { V2_CONFIG } from "./config";
import {
  V2_EXTRACTION_SYSTEM_PROMPT,
  V2_EXTRACTION_TOOL,
  buildV2ExtractionPrompt,
} from "./prompts/extraction";
import { createLogger } from "../utils/logger";
import { sanitizeMaterialType } from "../normalization/normalizer";
import type { ScrapedSource, V2ExtractedPattern } from "./types";

const log = createLogger("v2:extraction");

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return client;
}

/**
 * Extract structured pattern data from a scraped source.
 */
export async function extractFromSource(
  source: ScrapedSource,
  patternQuery: string
): Promise<V2ExtractedPattern | null> {
  const anthropic = getClient();
  const sourceType = source.sourceType === "youtube" ? "youtube" : "web";

  const userMessage = buildV2ExtractionPrompt(
    patternQuery,
    source.content,
    sourceType
  );

  log.info("Extracting pattern", {
    query: patternQuery,
    sourceType,
    contentLength: String(source.content.length),
    url: source.url,
  });

  try {
    const response = await anthropic.messages.create({
      model: V2_CONFIG.models.extraction,
      max_tokens: V2_CONFIG.models.maxTokens.extraction,
      system: V2_EXTRACTION_SYSTEM_PROMPT,
      tools: [V2_EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "extract_pattern" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUseBlock = response.content.find(
      (block: { type: string }) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      log.error("No tool_use block in response");
      return null;
    }

    const data = toolUseBlock.input as V2ExtractedPattern;

    // ── Basic validation ─────────────────────────────────────────────
    if (!data.patternName || data.patternName.trim() === "") {
      log.warn("No pattern found in content", { query: patternQuery });
      return null;
    }

    if (data.materials.length === 0) {
      log.warn("No materials extracted", { pattern: data.patternName });
      return null;
    }

    // ── Name length limits ───────────────────────────────────────────
    data.patternName = data.patternName.slice(0, 100);
    for (const m of data.materials) {
      m.name = m.name.slice(0, 150);
    }

    // ── Must have a hook ─────────────────────────────────────────────
    if (!data.materials.some((m) => m.type === "hook")) {
      log.warn("No hook in extracted materials", { pattern: data.patternName });
      return null;
    }

    // ── Force hook and thread to required ────────────────────────────
    for (const m of data.materials) {
      if ((m.type === "hook" || m.type === "thread") && !m.required) {
        m.required = true;
      }
    }

    // ── NO type deduplication — this is the key v2 fix ──────────────
    // v1 removed duplicate types here. v2 keeps all materials.

    // ── Sanitize material types ──────────────────────────────────────
    for (const m of data.materials) {
      m.type = sanitizeMaterialType(m.type);
    }

    // ── Normalize positions ──────────────────────────────────────────
    data.materials.forEach((m, i) => {
      m.position = i + 1;
    });

    // ── Ensure brand/productCode fields exist ────────────────────────
    for (const m of data.materials) {
      if (!m.brand) m.brand = null;
      if (!m.productCode) m.productCode = null;
    }

    // ── Normalize tying steps ────────────────────────────────────────
    if (!data.tyingSteps) data.tyingSteps = [];
    data.tyingSteps.forEach((step, i) => {
      step.position = i + 1;
      step.title = step.title?.slice(0, 200) ?? `Step ${i + 1}`;
      step.instruction = step.instruction?.slice(0, 2000) ?? "";
      if (step.tip) step.tip = step.tip.slice(0, 500);
    });
    data.tyingSteps = data.tyingSteps.filter(
      (s) => s.instruction && s.instruction.trim().length > 0
    );

    log.success("Pattern extracted", {
      pattern: data.patternName,
      materials: String(data.materials.length),
      steps: String(data.tyingSteps.length),
      variations: String(data.variations.length),
      substitutions: String(data.substitutions.length),
    });

    return data;
  } catch (err) {
    log.error("Extraction failed", { query: patternQuery, error: String(err) });
    return null;
  }
}

/**
 * Extract patterns from all scraped sources.
 */
export async function extractAll(
  sources: ScrapedSource[],
  patternQuery: string
): Promise<{ extraction: V2ExtractedPattern; source: ScrapedSource }[]> {
  const results: { extraction: V2ExtractedPattern; source: ScrapedSource }[] = [];

  for (const source of sources) {
    const extraction = await extractFromSource(source, patternQuery);
    if (extraction) {
      results.push({ extraction, source });
    }
  }

  log.info("Extraction batch complete", {
    attempted: String(sources.length),
    extracted: String(results.length),
  });

  return results;
}

/**
 * Calculate confidence score for a v2 extraction (0-1).
 */
export function calculateV2Confidence(
  extracted: V2ExtractedPattern,
  source: ScrapedSource
): number {
  let score = 0;
  let maxScore = 0;

  // Pattern name
  maxScore += 10;
  if (extracted.patternName.length > 2 && extracted.patternName.length < 100) score += 10;

  // Description
  maxScore += 10;
  if (extracted.description.length > 50) score += 10;
  else if (extracted.description.length > 20) score += 5;

  // Materials count
  maxScore += 20;
  if (extracted.materials.length >= 5) score += 20;
  else if (extracted.materials.length >= 4) score += 15;
  else if (extracted.materials.length >= 2) score += 8;

  // Has hook + thread
  maxScore += 10;
  if (extracted.materials.some((m) => m.type === "hook")) score += 5;
  if (extracted.materials.some((m) => m.type === "thread")) score += 5;

  // Material types coverage
  maxScore += 10;
  const types = new Set(extracted.materials.map((m) => m.type));
  if (types.size >= 5) score += 10;
  else if (types.size >= 4) score += 7;
  else if (types.size >= 3) score += 4;

  // Source quality
  maxScore += 15;
  if (source.hasTranscript) score += 10;
  else if (!source.lowConfidence) score += 7;
  else score += 2;
  if (source.content.length > 2000) score += 5;

  // Tying steps
  maxScore += 15;
  if (extracted.tyingSteps.length >= 5) score += 15;
  else if (extracted.tyingSteps.length >= 3) score += 10;
  else if (extracted.tyingSteps.length >= 1) score += 5;

  // Brand info extracted
  maxScore += 5;
  if (extracted.materials.some((m) => m.brand)) score += 5;

  // Category is specific
  maxScore += 5;
  if (extracted.category !== "other") score += 5;

  return Math.round((score / maxScore) * 100) / 100;
}
