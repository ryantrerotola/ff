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
import { mapConcurrent, retry } from "../utils/rate-limit";
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
    const response = await retry(
      () => anthropic.messages.create({
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
      }),
      { maxRetries: 2, backoffMs: 2000, label: `enrichment:${extraction.patternName}` }
    );

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

/** Max extractions to send through Sonnet enrichment (cost control) */
const MAX_ENRICHMENTS = 5;

/** Min materials for an extraction to be worth enriching */
const MIN_MATERIALS_FOR_ENRICHMENT = 3;

/**
 * Enrich the best extractions. Skips low-quality ones and caps total
 * Sonnet calls to control cost. Remaining extractions get fallback scores.
 */
export async function enrichAll(
  extractions: { extraction: V2ExtractedPattern; source: ScrapedSource }[]
): Promise<EnrichmentResult[]> {
  // Score and rank extractions — only enrich the best ones with Sonnet
  const scored = extractions.map((e) => ({
    ...e,
    quality: quickQualityScore(e.extraction, e.source),
  }));
  scored.sort((a, b) => b.quality - a.quality);

  const toEnrich = scored.filter((e) => e.extraction.materials.length >= MIN_MATERIALS_FOR_ENRICHMENT).slice(0, MAX_ENRICHMENTS);
  const toSkip = scored.filter((e) => !toEnrich.includes(e));

  log.info("Enrichment plan", {
    total: String(scored.length),
    enriching: String(toEnrich.length),
    skipping: String(toSkip.length),
  });

  const enriched = await mapConcurrent(
    toEnrich,
    3,
    async ({ extraction, source }) => enrichExtraction(extraction, source)
  );

  // Use fallback for skipped extractions (no Sonnet cost)
  const skipped = toSkip.map(({ extraction }) => fallbackResult(extraction));

  const results = [...enriched, ...skipped];

  log.info("Enrichment batch complete", {
    count: String(results.length),
    sonnetCalls: String(toEnrich.length),
    avgOverall: String(
      Math.round(
        (results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length) * 100
      ) / 100
    ),
  });

  return results;
}

/** Quick quality score to rank extractions without an API call */
function quickQualityScore(ext: V2ExtractedPattern, source: ScrapedSource): number {
  let score = 0;
  score += Math.min(ext.materials.length, 8) * 3; // up to 24
  score += Math.min(ext.tyingSteps.length, 8) * 2; // up to 16
  score += ext.description.length > 100 ? 5 : 0;
  score += source.hasTranscript ? 10 : 0;
  score += source.lowConfidence ? -5 : 0;
  score += ext.materials.some((m) => m.brand) ? 3 : 0;
  return score;
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
