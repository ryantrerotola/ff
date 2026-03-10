/**
 * V2 Recipe Sanity Check Prompt (Haiku)
 *
 * A cheap final validation pass that reviews the assembled consensus recipe
 * holistically. Catches errors that the algorithmic consensus can't detect:
 * incompatible materials, missing obvious materials, wrong material types, etc.
 */

import type { V2ConsensusMaterial } from "../types";

export const RECIPE_CHECK_SYSTEM_PROMPT = `You are an expert fly tyer validating a consensus recipe that was assembled from multiple sources. Your job is to check whether the material list is correct and complete for this specific pattern. Be practical and concise.`;

export function buildRecipeCheckPrompt(
  patternName: string,
  category: string,
  materials: V2ConsensusMaterial[]
): string {
  const materialList = materials
    .map((m) => {
      const color = m.color ? ` (${m.color})` : "";
      const opt = m.optional ? " [optional]" : "";
      return `- ${m.type}: ${m.name}${color}${opt} — ${m.sourceCount} of ${Math.round(m.sourceCount / m.sourceAgreement)} sources`;
    })
    .join("\n");

  return `Validate this consensus recipe for the "${patternName}" (${category} fly).

MATERIALS:
${materialList}

Using the validate_recipe tool, answer:
1. Are there any materials that clearly DO NOT belong in this pattern? (e.g., wrong material for this fly, likely a different pattern's material that leaked in)
2. Are there any ESSENTIAL materials obviously missing? (Only flag truly critical omissions — hook, thread, and the defining materials of this specific pattern.)
3. Are any material types miscategorized? (e.g., a "body" material that should be "thorax", or an "other" that should be "wing")

Only flag issues you are CONFIDENT about. Do not flag style preferences or minor variations.`;
}

export const RECIPE_CHECK_TOOL = {
  name: "validate_recipe" as const,
  description: "Validate a consensus fly pattern recipe.",
  input_schema: {
    type: "object" as const,
    properties: {
      isValid: {
        type: "boolean" as const,
        description: "True if the recipe looks correct overall (minor issues are OK)",
      },
      issues: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            severity: {
              type: "string" as const,
              enum: ["error", "warning"],
              description: "error = clearly wrong/missing, warning = suspicious but possibly OK",
            },
            issue: {
              type: "string" as const,
              description: "What is wrong",
            },
            materialName: {
              type: ["string", "null"] as const,
              description: "The material involved (null if about a missing material)",
            },
            suggestion: {
              type: "string" as const,
              description: "What should be done (remove, add, retype, etc.)",
            },
          },
          required: ["severity", "issue", "materialName", "suggestion"],
        },
      },
    },
    required: ["isValid", "issues"],
  },
};
