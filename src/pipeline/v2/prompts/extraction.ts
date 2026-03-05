/**
 * V2 Extraction Prompts
 *
 * Enhanced system prompt and tool schema for pattern extraction.
 * Key difference from v1: NO material type deduplication.
 * Multiple materials of the same type are allowed.
 */

export const V2_EXTRACTION_SYSTEM_PROMPT = `You are an expert fly tying pattern analyst. Your job is to extract structured data from fly tying content (video transcripts, blog posts, tutorials).

You have deep knowledge of fly tying, including:

MATERIAL TYPES (use exactly these categories):
- hook: The fishing hook (e.g., "Tiemco TMC 100", "Mustad 9672")
- thread: The tying thread (e.g., "Uni-Thread 6/0", "Veevus 8/0")
- tail: Tail material (e.g., "Pheasant Tail Fibers", "Marabou")
- body: Body material (e.g., "Chenille", "Dubbing", "Peacock Herl"). A fly can have MULTIPLE body materials (underbody, overbody, abdomen).
- rib: Ribbing material (e.g., "Copper Wire", "Tinsel")
- thorax: Thorax material (e.g., "Dubbing", "Peacock Herl")
- wing: Wing material (e.g., "Elk Hair", "CDC Feathers"). A fly can have multiple wing materials (underwing, overwing).
- hackle: Hackle feathers (e.g., "Grizzly Rooster Hackle"). A fly can have multiple hackles.
- bead: Bead heads (e.g., "Brass Bead", "Tungsten Bead")
- weight: Additional weight (e.g., "Lead Wire", "Lead-Free Wire")
- other: Anything else (e.g., "Eyes", "Rubber Legs", "Flash Material", "Shellback", "Wingcase")

FLY CATEGORIES:
- dry: Floats on surface
- nymph: Fished subsurface
- streamer: Larger flies (baitfish, leeches)
- emerger: Transitioning from subsurface to surface
- saltwater: Saltwater patterns
- other: Anything else

DIFFICULTY:
- beginner: Simple wraps, basic materials
- intermediate: Multiple techniques, moderate materials
- advanced: Complex techniques, precise proportions

WATER TYPE:
- freshwater: Trout streams, rivers, lakes
- saltwater: Ocean, flats, inshore
- both: Works in both

VARIATION CATEGORIES:
Variations are distinct ways a pattern is commonly tied. Categorize each variation:
- color: Same materials, different color scheme (e.g., "Chartreuse & White Woolly Bugger" vs olive/black default)
- weight: Different weighting approaches — beadhead, cone head, lead wraps, or unweighted. Primarily relevant for nymph patterns.
- wing_style: Parachute post vs upright/traditional wings. Only applies to dry flies.
- hackle: Soft hackle collar vs standard hackle or no hackle. Primarily relevant for nymph and wet fly patterns.
- size: Tied on significantly different hook sizes for different species/conditions
- regional: Geographic adaptations of the pattern
- material: Fundamentally different material choices beyond just color swaps

IMPORTANT: The default pattern you extract should represent the MOST COMMON version of the pattern as described in the source. Variations are the ALTERNATIVES, not the default.

CRITICAL EXTRACTION RULES:
1. List ALL materials in TYING ORDER
2. A pattern CAN have multiple materials of the same type. For example: body + underbody, two different hackles, underwing + overwing. Extract EACH as a separate material entry.
3. Do NOT collapse multiple materials into one. If the source says "wrap lead wire for underbody, then dub body with hare's ear" — that's TWO materials: weight (lead wire) + body (hare's ear dubbing).
4. Include specific product names and brand names when mentioned
5. Include colors and sizes when specified
6. Mark materials as required=true unless explicitly optional
7. Extract variations with their category. The main pattern should be the most common version. Variations are the alternatives.
8. If substitutes are mentioned, include them in the substitutions array
9. Extract tying steps with detailed instructions when present
10. Write a clear, informative description
11. Use the canonical/most common name for the pattern`;

/**
 * Build the user prompt for extraction.
 * Content cap is handled by the caller.
 */
export function buildV2ExtractionPrompt(
  patternQuery: string,
  sourceContent: string,
  sourceType: "youtube" | "web"
): string {
  const sourceLabel = sourceType === "youtube" ? "video transcript/description" : "web article";

  return `Extract the fly pattern data from this ${sourceLabel}. The content was found by searching for "${patternQuery}".

If the content does not actually describe a fly tying pattern or recipe, set patternName to "" and leave other fields empty.

REMEMBER: Extract ALL materials even if multiple share the same type. A fly can have two body materials, two hackles, etc.

Content:
---
${sourceContent}
---

Extract the structured fly pattern data using the extract_pattern tool.`;
}

/**
 * V2 extraction tool definition.
 * Same schema as v1 but with brand/productCode on materials.
 */
export const V2_EXTRACTION_TOOL = {
  name: "extract_pattern" as const,
  description:
    "Extract structured fly pattern data from fly tying content. Call this tool with the extracted information.",
  input_schema: {
    type: "object" as const,
    properties: {
      patternName: {
        type: "string" as const,
        description: 'The canonical name of the fly pattern. Empty string if no pattern found.',
      },
      alternateNames: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "Other names this pattern is known by",
      },
      category: {
        type: "string" as const,
        enum: ["dry", "nymph", "streamer", "emerger", "saltwater", "other"],
      },
      difficulty: {
        type: "string" as const,
        enum: ["beginner", "intermediate", "advanced"],
      },
      waterType: {
        type: "string" as const,
        enum: ["freshwater", "saltwater", "both"],
      },
      description: {
        type: "string" as const,
        description: "A clear 2-4 sentence description of the pattern",
      },
      origin: {
        type: ["string", "null"] as const,
        description: "Who created the pattern and when, if mentioned",
      },
      materials: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description: "Full material name including brand if mentioned",
            },
            type: {
              type: "string" as const,
              enum: ["hook", "thread", "tail", "body", "rib", "thorax", "wing", "hackle", "bead", "weight", "other"],
            },
            color: { type: ["string", "null"] as const },
            size: { type: ["string", "null"] as const },
            required: { type: "boolean" as const },
            position: { type: "number" as const },
            brand: {
              type: ["string", "null"] as const,
              description: "Brand name if mentioned (e.g., 'Tiemco', 'Whiting Farms')",
            },
            productCode: {
              type: ["string", "null"] as const,
              description: "Product number if mentioned (e.g., 'TMC 100', '9672')",
            },
          },
          required: ["name", "type", "color", "size", "required", "position", "brand", "productCode"],
        },
        description: "ALL materials in tying order. Multiple materials of the same type are allowed.",
      },
      variations: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description: "Name of the variation (e.g., 'Parachute Adams', 'Beadhead Prince Nymph')",
            },
            description: {
              type: "string" as const,
              description: "Brief description of what makes this variation different",
            },
            category: {
              type: "string" as const,
              enum: ["color", "weight", "wing_style", "hackle", "size", "regional", "material"],
              description: "The axis of variation: color, weight (bead/cone/lead/unweighted), wing_style (parachute/upright, dry flies only), hackle (soft hackle, nymph/wet only), size, regional, or material",
            },
            materialChanges: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  original: { type: "string" as const, description: "Material in the default pattern being changed" },
                  replacement: { type: "string" as const, description: "Replacement material in this variation" },
                },
                required: ["original", "replacement"],
              },
            },
          },
          required: ["name", "description", "category", "materialChanges"],
        },
        description: "Known variations of this pattern. The main extraction should be the MOST COMMON version.",
      },
      substitutions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            originalMaterial: { type: "string" as const },
            substituteMaterial: { type: "string" as const },
            substitutionType: {
              type: "string" as const,
              enum: ["equivalent", "budget", "aesthetic", "availability"],
            },
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
          required: ["position", "title", "instruction", "tip"],
        },
        description: "Step-by-step tying instructions if described in the source.",
      },
    },
    required: [
      "patternName", "alternateNames", "category", "difficulty",
      "waterType", "description", "origin", "materials",
      "variations", "substitutions", "tyingSteps",
    ],
  },
};
