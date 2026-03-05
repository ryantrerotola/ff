/**
 * V2 Enrichment Prompts (Sonnet Pass)
 *
 * Sonnet reviews and enriches each Haiku extraction.
 * Validates materials, enriches steps, generates substitutions.
 */

export const V2_ENRICHMENT_SYSTEM_PROMPT = `You are a master fly tyer reviewing extracted pattern data for completeness and accuracy. You have deep knowledge of thousands of fly patterns, their materials, tying techniques, and common substitutions.

Your job is to:
1. VALIDATE the materials list — flag missing or incorrect materials
2. ENRICH tying steps — add detail, fix ordering, add tips for common mistakes
3. VALIDATE and ENRICH variations — ensure variations are correctly categorized, add well-known common variations the source may have missed
4. SCORE completeness — rate how complete the extraction is
5. FLAG issues — specific problems with the extraction
6. SUGGEST substitutions — common material substitutions fly tyers use

VARIATION VALIDATION RULES:
- Verify each variation's category is correct:
  - "color" — only color changes, same materials (e.g., black vs olive Woolly Bugger)
  - "weight" — beadhead, cone head, lead wraps, or unweighted (primarily nymph patterns)
  - "wing_style" — parachute vs upright wings (DRY FLIES ONLY — flag if applied to non-dry patterns)
  - "hackle" — soft hackle vs standard (NYMPH and WET patterns only)
  - "size" — significantly different hook sizes
  - "regional" — geographic adaptations
  - "material" — fundamentally different material choices
- The DEFAULT pattern should be the most commonly tied version. If the extracted default looks like a less common variation, flag it.
- Add well-known variations if the source missed obvious ones (e.g., most Adams patterns should include a Parachute Adams variation; most nymphs should note beadhead vs unweighted if applicable).
- Each variation must have specific materialChanges showing what differs from the default.

Be specific and practical. Only suggest changes you are confident about based on fly tying knowledge.`;

export function buildEnrichmentPrompt(
  patternName: string,
  extractedJson: string,
  sourceContent: string
): string {
  return `Review this extracted fly pattern data for "${patternName}". Validate the materials, improve the tying steps, and suggest substitutions.

EXTRACTED DATA:
${extractedJson}

ORIGINAL SOURCE CONTENT (first 8000 chars):
${sourceContent.slice(0, 8000)}

Using the review_extraction tool, provide:
1. The enriched extraction with any corrections (fix material types, add missing materials, improve step instructions)
2. Validated and enriched variations — correct categories, add well-known variations if missing
3. Quality flags for any issues found
4. Common substitutions for each material
5. Completeness scores`;
}

export const V2_ENRICHMENT_TOOL = {
  name: "review_extraction" as const,
  description: "Review and enrich an extracted fly pattern. Validate materials, improve steps, suggest substitutions.",
  input_schema: {
    type: "object" as const,
    properties: {
      enrichedPattern: {
        type: "object" as const,
        description: "The corrected/enriched pattern data",
        properties: {
          patternName: { type: "string" as const },
          alternateNames: { type: "array" as const, items: { type: "string" as const } },
          category: { type: "string" as const, enum: ["dry", "nymph", "streamer", "emerger", "saltwater", "other"] },
          difficulty: { type: "string" as const, enum: ["beginner", "intermediate", "advanced"] },
          waterType: { type: "string" as const, enum: ["freshwater", "saltwater", "both"] },
          description: { type: "string" as const },
          origin: { type: ["string", "null"] as const },
          materials: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                name: { type: "string" as const },
                type: { type: "string" as const },
                color: { type: ["string", "null"] as const },
                size: { type: ["string", "null"] as const },
                required: { type: "boolean" as const },
                position: { type: "number" as const },
                brand: { type: ["string", "null"] as const },
                productCode: { type: ["string", "null"] as const },
              },
              required: ["name", "type", "color", "size", "required", "position"],
            },
          },
          variations: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                name: { type: "string" as const },
                description: { type: "string" as const },
                category: {
                  type: "string" as const,
                  enum: ["color", "weight", "wing_style", "hackle", "size", "regional", "material"],
                  description: "The axis of variation",
                },
                materialChanges: {
                  type: "array" as const,
                  items: {
                    type: "object" as const,
                    properties: {
                      original: { type: "string" as const },
                      replacement: { type: "string" as const },
                    },
                    required: ["original", "replacement"],
                  },
                },
              },
              required: ["name", "description", "category", "materialChanges"],
            },
          },
          substitutions: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                originalMaterial: { type: "string" as const },
                substituteMaterial: { type: "string" as const },
                substitutionType: { type: "string" as const, enum: ["equivalent", "budget", "aesthetic", "availability"] },
                notes: { type: "string" as const },
              },
              required: ["originalMaterial", "substituteMaterial", "substitutionType", "notes"],
            },
          },
          tyingSteps: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                position: { type: "number" as const },
                title: { type: "string" as const },
                instruction: { type: "string" as const },
                tip: { type: ["string", "null"] as const },
              },
              required: ["position", "title", "instruction"],
            },
          },
        },
        required: ["patternName", "materials", "tyingSteps", "category", "difficulty", "waterType", "description"],
      },
      qualityFlags: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            severity: { type: "string" as const, enum: ["error", "warning", "info"] },
            message: { type: "string" as const },
            field: { type: "string" as const },
          },
          required: ["severity", "message", "field"],
        },
        description: "Quality issues found during review",
      },
      suggestedSubstitutions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            originalMaterial: { type: "string" as const },
            substituteMaterial: { type: "string" as const },
            substitutionType: { type: "string" as const, enum: ["equivalent", "budget", "aesthetic", "availability"] },
            notes: { type: "string" as const },
          },
          required: ["originalMaterial", "substituteMaterial", "substitutionType", "notes"],
        },
        description: "Common substitutions for materials in this pattern (1-2 per material)",
      },
      scores: {
        type: "object" as const,
        properties: {
          materials: { type: "number" as const, description: "0-1 completeness of materials list" },
          steps: { type: "number" as const, description: "0-1 quality of tying steps" },
          description: { type: "number" as const, description: "0-1 quality of description" },
          overall: { type: "number" as const, description: "0-1 overall extraction quality" },
        },
        required: ["materials", "steps", "description", "overall"],
      },
    },
    required: ["enrichedPattern", "qualityFlags", "suggestedSubstitutions", "scores"],
  },
};
