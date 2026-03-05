/**
 * V2 Enrichment Stage (Pass 2: Sonnet)
 *
 * Sonnet reviews every Haiku extraction:
 *   - Validates materials
 *   - Enriches tying steps
 *   - Scores completeness
 *   - Generates substitutions
 */

import Anthropic from "@anthropic-ai/sdk";
import { V2_CONFIG } from "./config";
import {
  V2_ENRICHMENT_SYSTEM_PROMPT,
  V2_ENRICHMENT_TOOL,
  buildEnrichmentPrompt,
} from "./prompts/enrichment";
import { createLogger } from "../utils/logger";
import { mapConcurrent } from "../utils/rate-limit";
import { sanitizeMaterialType } from "../normalization/normalizer";
import type {
  V2ExtractedPattern,
  ScrapedSource,
  EnrichmentResult,
  QualityFlag,
} from "./types";
import { VARIATION_CATEGORIES } from "./types";
import type { VariationCategory } from "./types";
import type { ExtractedSubstitution } from "../types";

const log = createLogger("v2:enrichment");

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return client;
}

/**
 * Enrich a single extraction using Sonnet.
 */
export async function enrichExtraction(
  extraction: V2ExtractedPattern,
  source: ScrapedSource
): Promise<EnrichmentResult> {
  const anthropic = getClient();

  const extractedJson = JSON.stringify(extraction, null, 2);

  log.info("Enriching extraction with Sonnet", {
    pattern: extraction.patternName,
    materials: String(extraction.materials.length),
    steps: String(extraction.tyingSteps.length),
  });

  try {
    const response = await anthropic.messages.create({
      model: V2_CONFIG.models.enrichment,
      max_tokens: V2_CONFIG.models.maxTokens.enrichment,
      system: V2_ENRICHMENT_SYSTEM_PROMPT,
      tools: [V2_ENRICHMENT_TOOL],
      tool_choice: { type: "tool", name: "review_extraction" },
      messages: [
        {
          role: "user",
          content: buildEnrichmentPrompt(
            extraction.patternName,
            extractedJson,
            source.content
          ),
        },
      ],
    });

    const toolUseBlock = response.content.find(
      (block: { type: string }) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      log.warn("No tool_use block from Sonnet, returning original extraction");
      return fallbackResult(extraction);
    }

    const data = toolUseBlock.input as {
      enrichedPattern: V2ExtractedPattern;
      qualityFlags: QualityFlag[];
      suggestedSubstitutions: ExtractedSubstitution[];
      scores: { materials: number; steps: number; description: number; overall: number };
    };

    // Sanitize enriched material types
    const enriched = data.enrichedPattern;
    for (const m of enriched.materials) {
      m.type = sanitizeMaterialType(m.type);
      if (!m.brand) m.brand = null;
      if (!m.productCode) m.productCode = null;
    }

    // Re-number positions
    enriched.materials.forEach((m, i) => { m.position = i + 1; });
    if (enriched.tyingSteps) {
      enriched.tyingSteps.forEach((s, i) => { s.position = i + 1; });
    }

    // Ensure arrays exist
    if (!enriched.variations) enriched.variations = [];
    if (!enriched.substitutions) enriched.substitutions = [];
    if (!enriched.tyingSteps) enriched.tyingSteps = [];
    if (!enriched.alternateNames) enriched.alternateNames = [];

    // Validate variation categories
    for (const v of enriched.variations) {
      if (!v.category || !VARIATION_CATEGORIES.includes(v.category as VariationCategory)) {
        v.category = "material"; // fallback for unknown categories
      }
    }

    log.success("Enrichment complete", {
      pattern: extraction.patternName,
      materials: `${extraction.materials.length} → ${enriched.materials.length}`,
      steps: `${extraction.tyingSteps.length} → ${enriched.tyingSteps.length}`,
      flags: String(data.qualityFlags.length),
      subs: String(data.suggestedSubstitutions.length),
      overall: String(data.scores.overall),
    });

    return {
      enriched,
      qualityFlags: data.qualityFlags,
      suggestedSubstitutions: data.suggestedSubstitutions,
      scores: data.scores,
    };
  } catch (err) {
    log.error("Enrichment failed, returning original", {
      pattern: extraction.patternName,
      error: String(err),
    });
    return fallbackResult(extraction);
  }
}

/**
 * Enrich all extractions.
 */
export async function enrichAll(
  extractions: { extraction: V2ExtractedPattern; source: ScrapedSource }[]
): Promise<EnrichmentResult[]> {
  const results = await mapConcurrent(
    extractions,
    3, // Concurrency limit for Anthropic API
    async ({ extraction, source }) => enrichExtraction(extraction, source)
  );

  log.info("Enrichment batch complete", {
    count: String(results.length),
    avgOverall: String(
      Math.round(
        (results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length) * 100
      ) / 100
    ),
  });

  return results;
}

function fallbackResult(extraction: V2ExtractedPattern): EnrichmentResult {
  return {
    enriched: extraction,
    qualityFlags: [{ severity: "warning", message: "Sonnet enrichment failed, using raw extraction", field: "all" }],
    suggestedSubstitutions: [],
    scores: {
      materials: extraction.materials.length >= 4 ? 0.6 : 0.3,
      steps: extraction.tyingSteps.length >= 4 ? 0.6 : 0.3,
      description: extraction.description.length > 100 ? 0.6 : 0.3,
      overall: 0.4,
    },
  };
}
