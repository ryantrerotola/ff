/**
 * System prompt for fly pattern extraction.
 * Contains domain knowledge about fly tying to improve extraction quality.
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are an expert fly tying pattern analyst. Your job is to extract structured data from fly tying content (video transcripts, blog posts, tutorials).

You have deep knowledge of fly tying, including:

MATERIAL TYPES (use exactly these categories):
- hook: The fishing hook the fly is tied on (e.g., "Tiemco TMC 100", "Mustad 9672")
- thread: The tying thread (e.g., "Uni-Thread 6/0", "Veevus 8/0")
- tail: Tail material (e.g., "Pheasant Tail Fibers", "Marabou")
- body: Body material (e.g., "Chenille", "Dubbing", "Peacock Herl")
- rib: Ribbing material (e.g., "Copper Wire", "Tinsel")
- thorax: Thorax material (e.g., "Dubbing", "Peacock Herl")
- wing: Wing material (e.g., "Elk Hair", "CDC Feathers", "Hen Hackle Tips")
- hackle: Hackle feathers (e.g., "Grizzly Rooster Hackle", "Brown Hackle")
- bead: Bead heads (e.g., "Brass Bead", "Tungsten Bead")
- weight: Additional weight (e.g., "Lead Wire", "Lead-Free Wire")
- other: Anything else (e.g., "Eyes", "Rubber Legs", "Flash Material")

FLY CATEGORIES:
- dry: Floats on surface, imitates adult insects
- nymph: Fished subsurface, imitates larval/pupal stage insects
- streamer: Larger flies imitating baitfish, leeches, crayfish
- emerger: Imitates insects transitioning from subsurface to surface
- saltwater: Patterns for saltwater species
- other: Anything else

DIFFICULTY:
- beginner: Simple wraps, basic materials, 5 or fewer materials
- intermediate: Multiple techniques, moderate material count
- advanced: Complex techniques, many materials, precise proportions required

WATER TYPE:
- freshwater: Trout streams, rivers, lakes
- saltwater: Ocean, flats, inshore
- both: Works in both environments

IMPORTANT EXTRACTION RULES:
1. List materials in TYING ORDER (the order they would be applied when tying the fly)
2. Standard tying order is: hook → thread → tail → body/rib → thorax → wing → hackle → head
3. Mark materials as required=true unless explicitly described as "optional" or "you can add"
4. Include specific product names when mentioned (e.g., "Tiemco TMC 100" not just "dry fly hook")
5. Include colors and sizes when specified
6. If a material is mentioned as a substitute for another, include it in the substitutions array
7. If variations of the pattern are described, include them
8. Extract the origin/history of the pattern if mentioned
9. Write a clear, informative description even if the source is informal/conversational
10. For the pattern name, use the canonical/most common name`;

/**
 * Build the user prompt for extracting data from content.
 */
export function buildExtractionPrompt(
  patternQuery: string,
  sourceContent: string,
  sourceType: "youtube" | "blog"
): string {
  const sourceLabel =
    sourceType === "youtube" ? "video transcript" : "blog article";

  return `Extract the fly pattern data from this ${sourceLabel}. The content was found by searching for "${patternQuery}".

If the content does not actually describe a fly tying pattern or recipe, set patternName to "" and leave other fields empty.

Content:
---
${sourceContent.slice(0, 12000)}
---

Extract the structured fly pattern data using the extract_pattern tool.`;
}

/**
 * The tool definition for Claude's tool_use feature.
 * Defines the exact JSON schema for extracted pattern data.
 */
export const EXTRACTION_TOOL = {
  name: "extract_pattern" as const,
  description:
    "Extract structured fly pattern data from fly tying content. Call this tool with the extracted information.",
  input_schema: {
    type: "object" as const,
    properties: {
      patternName: {
        type: "string" as const,
        description:
          'The canonical name of the fly pattern (e.g., "Woolly Bugger", "Adams"). Empty string if no pattern found.',
      },
      alternateNames: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Other names this pattern is known by",
      },
      category: {
        type: "string" as const,
        enum: [
          "dry",
          "nymph",
          "streamer",
          "emerger",
          "saltwater",
          "other",
        ],
        description: "The fly category",
      },
      difficulty: {
        type: "string" as const,
        enum: ["beginner", "intermediate", "advanced"],
        description: "Difficulty level to tie",
      },
      waterType: {
        type: "string" as const,
        enum: ["freshwater", "saltwater", "both"],
        description: "What type of water the fly is used in",
      },
      description: {
        type: "string" as const,
        description:
          "A clear 2-4 sentence description of the pattern, what it imitates, and how to fish it",
      },
      origin: {
        type: ["string", "null"] as const,
        description:
          "Who created the pattern and when, if mentioned",
      },
      materials: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description:
                "Full material name including brand if mentioned (e.g., 'Tiemco TMC 100 Dry Fly Hook')",
            },
            type: {
              type: "string" as const,
              enum: [
                "hook",
                "thread",
                "tail",
                "body",
                "rib",
                "thorax",
                "wing",
                "hackle",
                "bead",
                "weight",
                "other",
              ],
              description: "Material type category",
            },
            color: {
              type: ["string", "null"] as const,
              description: "Color if specified",
            },
            size: {
              type: ["string", "null"] as const,
              description:
                "Size or size range if specified (e.g., 'Size 12-16', '3/32 inch')",
            },
            required: {
              type: "boolean" as const,
              description:
                "true if the material is essential, false if optional",
            },
            position: {
              type: "number" as const,
              description: "Order in tying sequence (1 = first)",
            },
          },
          required: [
            "name",
            "type",
            "color",
            "size",
            "required",
            "position",
          ],
        },
        description: "Materials list in tying order",
      },
      variations: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description: "Name of the variation",
            },
            description: {
              type: "string" as const,
              description: "What makes this variation different",
            },
            materialChanges: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  original: {
                    type: "string" as const,
                    description: "Material being replaced",
                  },
                  replacement: {
                    type: "string" as const,
                    description: "Replacement material",
                  },
                },
                required: ["original", "replacement"],
              },
            },
          },
          required: ["name", "description", "materialChanges"],
        },
        description:
          "Named variations of this pattern mentioned in the content",
      },
      substitutions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            originalMaterial: {
              type: "string" as const,
              description: "The original/standard material",
            },
            substituteMaterial: {
              type: "string" as const,
              description: "The substitute material",
            },
            substitutionType: {
              type: "string" as const,
              enum: ["equivalent", "budget", "aesthetic", "availability"],
              description: "Why one would substitute",
            },
            notes: {
              type: "string" as const,
              description: "Any notes about the substitution",
            },
          },
          required: [
            "originalMaterial",
            "substituteMaterial",
            "substitutionType",
            "notes",
          ],
        },
        description:
          "Material substitutions mentioned in the content",
      },
    },
    required: [
      "patternName",
      "alternateNames",
      "category",
      "difficulty",
      "waterType",
      "description",
      "origin",
      "materials",
      "variations",
      "substitutions",
    ],
  },
};
