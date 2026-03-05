/**
 * V2 Quality Gate
 *
 * Enforces hard requirements before ingestion.
 * Prevents incomplete patterns from reaching production.
 */

import { V2_CONFIG } from "./config";
import { createLogger } from "../utils/logger";
import type { V2ConsensusPattern, ValidatedImage, ProductLink, QualityGateResult } from "./types";

const log = createLogger("v2:quality-gate");

/**
 * Evaluate a consensus pattern against quality requirements.
 */
export function evaluateQuality(
  consensus: V2ConsensusPattern,
  images: ValidatedImage[],
  productLinks: ProductLink[]
): QualityGateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const gate = V2_CONFIG.qualityGate;

  // ── Hard Requirements ─────────────────────────────────────────────

  // Pattern name
  if (!consensus.patternName || consensus.patternName.trim() === "") {
    reasons.push("Missing pattern name");
  }

  // Materials count
  const requiredMaterials = consensus.materials.filter((m) => !m.optional);
  if (requiredMaterials.length < gate.minMaterials) {
    reasons.push(
      `Only ${requiredMaterials.length} required materials (need ≥${gate.minMaterials})`
    );
  }

  // Must have hook
  if (!consensus.materials.some((m) => m.type === "hook")) {
    reasons.push("Missing hook material");
  }

  // Must have thread
  if (!consensus.materials.some((m) => m.type === "thread")) {
    reasons.push("Missing thread material");
  }

  // Tying steps
  const validSteps = consensus.tyingSteps.filter(
    (s) => s.instruction && s.instruction.trim().length > 0
  );
  if (validSteps.length < gate.minSteps) {
    reasons.push(
      `Only ${validSteps.length} tying steps (need ≥${gate.minSteps})`
    );
  }

  // Photos
  if (images.length < gate.minPhotos) {
    reasons.push(
      `Only ${images.length} validated photos (need ≥${gate.minPhotos})`
    );
  }

  // Description
  if (consensus.description.length < gate.minDescriptionLength) {
    reasons.push(
      `Description too short: ${consensus.description.length} chars (need ≥${gate.minDescriptionLength})`
    );
  }

  // Category
  if (consensus.category.value === "other") {
    reasons.push("Category is 'other' — should be specific");
  }

  // Confidence
  if (consensus.overallConfidence < gate.minConfidence) {
    reasons.push(
      `Low confidence: ${consensus.overallConfidence} (need ≥${gate.minConfidence})`
    );
  }

  // Source count
  if (consensus.sourceCount < gate.minSources) {
    reasons.push(
      `Only ${consensus.sourceCount} sources (need ≥${gate.minSources})`
    );
  }

  // ── Warnings (don't block) ────────────────────────────────────────

  if (!consensus.origin) {
    warnings.push("No origin/history information");
  }

  if (consensus.substitutions.length === 0) {
    warnings.push("No substitutions available");
  }

  if (productLinks.length === 0) {
    warnings.push("No product purchase links found");
  }

  if (consensus.description.length < 200) {
    warnings.push(`Description could be longer (${consensus.description.length} chars)`);
  }

  if (consensus.sourceCount < 3) {
    warnings.push(`Only ${consensus.sourceCount} sources (3+ preferred)`);
  }

  // ── Scores ────────────────────────────────────────────────────────

  const materialScore = Math.min(requiredMaterials.length / 6, 1);
  const stepScore = Math.min(validSteps.length / 6, 1);
  const photoScore = Math.min(images.length / 2, 1);
  const sourceScore = Math.min(consensus.sourceCount / 4, 1);
  const overallScore = (materialScore + stepScore + photoScore + sourceScore) / 4;

  // ── Decision ──────────────────────────────────────────────────────

  let decision: "pass" | "fail" | "review";

  if (reasons.length > 0) {
    decision = "fail";
  } else if (warnings.length > 2) {
    decision = "review";
  } else {
    decision = "pass";
  }

  const result: QualityGateResult = {
    decision,
    reasons,
    warnings,
    scores: {
      materials: Math.round(materialScore * 100) / 100,
      steps: Math.round(stepScore * 100) / 100,
      photos: Math.round(photoScore * 100) / 100,
      sources: Math.round(sourceScore * 100) / 100,
      overall: Math.round(overallScore * 100) / 100,
    },
  };

  if (decision === "fail") {
    log.warn("Quality gate FAILED", {
      pattern: consensus.patternName,
      reasons: reasons.join("; "),
    });
  } else if (decision === "review") {
    log.info("Quality gate REVIEW", {
      pattern: consensus.patternName,
      warnings: warnings.join("; "),
    });
  } else {
    log.success("Quality gate PASSED", {
      pattern: consensus.patternName,
      overall: String(result.scores.overall),
    });
  }

  return result;
}
