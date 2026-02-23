import Anthropic from "@anthropic-ai/sdk";
import { PIPELINE_CONFIG } from "../config";
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TOOL,
  buildExtractionPrompt,
} from "./prompts";
import { createLogger } from "../utils/logger";
import type { ExtractedPattern } from "../types";

const log = createLogger("extractor");

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: PIPELINE_CONFIG.anthropic.apiKey,
    });
  }
  return client;
}

/**
 * Extract structured pattern data from raw content using Claude.
 *
 * Uses tool_use to guarantee structured JSON output that matches
 * the ExtractedPattern schema exactly.
 */
export async function extractPattern(
  content: string,
  patternQuery: string,
  sourceType: "youtube" | "blog"
): Promise<ExtractedPattern | null> {
  const anthropic = getClient();

  const userMessage = buildExtractionPrompt(patternQuery, content, sourceType);

  log.info("Extracting pattern", {
    query: patternQuery,
    sourceType,
    contentLength: String(content.length),
  });

  try {
    const response = await anthropic.messages.create({
      model: PIPELINE_CONFIG.anthropic.model,
      max_tokens: PIPELINE_CONFIG.anthropic.maxTokens,
      system: EXTRACTION_SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "extract_pattern" },
      messages: [{ role: "user", content: userMessage }],
    });

    // Find the tool_use block in the response
    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      log.error("No tool_use block in response");
      return null;
    }

    const data = toolUseBlock.input as ExtractedPattern;

    // ── Basic presence checks ──────────────────────────────────────────
    if (!data.patternName || data.patternName.trim() === "") {
      log.warn("No pattern found in content", { query: patternQuery });
      return null;
    }

    if (data.materials.length === 0) {
      log.warn("No materials extracted", {
        pattern: data.patternName,
      });
      return null;
    }

    // ── Name length limits ─────────────────────────────────────────────
    data.patternName = data.patternName.slice(0, 100);
    for (const m of data.materials) {
      m.name = m.name.slice(0, 150);
    }

    // ── Must have a hook ───────────────────────────────────────────────
    if (!data.materials.some((m) => m.type === "hook")) {
      log.warn("No hook in extracted materials", {
        pattern: data.patternName,
      });
      return null;
    }

    // ── Force hook and thread to required ──────────────────────────────
    for (const m of data.materials) {
      if ((m.type === "hook" || m.type === "thread") && !m.required) {
        m.required = true;
      }
    }

    // ── Deduplicate material types (keep first occurrence) ─────────────
    const seenTypes = new Set<string>();
    const deduped = data.materials.filter((m) => {
      if (seenTypes.has(m.type)) {
        log.debug("Removing duplicate material type", {
          pattern: data.patternName,
          type: m.type,
        });
        return false;
      }
      seenTypes.add(m.type);
      return true;
    });
    data.materials = deduped;

    // ── Normalize positions to sequential 1..N ─────────────────────────
    data.materials.forEach((m, i) => {
      m.position = i + 1;
    });

    log.success("Pattern extracted", {
      pattern: data.patternName,
      materials: String(data.materials.length),
      variations: String(data.variations.length),
      substitutions: String(data.substitutions.length),
    });

    return data;
  } catch (err) {
    log.error("Extraction failed", {
      query: patternQuery,
      error: String(err),
    });
    return null;
  }
}

/**
 * Calculate a confidence score for an extracted pattern.
 *
 * Higher score means more likely to be accurate and complete.
 * Score is 0.0 to 1.0.
 */
export function calculateConfidence(
  extracted: ExtractedPattern,
  sourceType: "youtube" | "blog",
  contentLength: number
): number {
  let score = 0;
  let maxScore = 0;

  // Pattern name present and reasonable length
  maxScore += 10;
  if (extracted.patternName.length > 2 && extracted.patternName.length < 100) {
    score += 10;
  }

  // Has a meaningful description
  maxScore += 10;
  if (extracted.description.length > 50) score += 10;
  else if (extracted.description.length > 20) score += 5;

  // Has materials
  maxScore += 20;
  if (extracted.materials.length >= 4) score += 20;
  else if (extracted.materials.length >= 2) score += 10;
  else if (extracted.materials.length >= 1) score += 5;

  // Has a hook
  maxScore += 10;
  if (extracted.materials.some((m) => m.type === "hook")) score += 10;

  // Has thread
  maxScore += 5;
  if (extracted.materials.some((m) => m.type === "thread")) score += 5;

  // Materials have positions in order
  maxScore += 5;
  const positions = extracted.materials.map((m) => m.position);
  const isOrdered = positions.every((p, i) => i === 0 || p >= positions[i - 1]!);
  if (isOrdered) score += 5;

  // Materials have names (not empty)
  maxScore += 5;
  const allNamed = extracted.materials.every((m) => m.name.length > 0);
  if (allNamed) score += 5;

  // Category is specific (not "other")
  maxScore += 5;
  if (extracted.category !== "other") score += 5;

  // Content source quality
  maxScore += 10;
  if (sourceType === "blog" && contentLength > 1000) score += 10;
  else if (sourceType === "youtube" && contentLength > 500) score += 10;
  else if (contentLength > 200) score += 5;

  // Has origin info
  maxScore += 5;
  if (extracted.origin) score += 5;

  // Has substitutions (sign of detailed source)
  maxScore += 5;
  if (extracted.substitutions.length > 0) score += 5;

  // Has variations
  maxScore += 5;
  if (extracted.variations.length > 0) score += 5;

  // Bonus for complete material types coverage
  maxScore += 5;
  const materialTypes = new Set(extracted.materials.map((m) => m.type));
  if (materialTypes.size >= 4) score += 5;
  else if (materialTypes.size >= 3) score += 3;

  return Math.round((score / maxScore) * 100) / 100;
}
