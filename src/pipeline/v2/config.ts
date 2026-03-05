/**
 * V2 Pipeline Configuration
 *
 * Inherits base config from v1 and adds v2-specific settings.
 */

export const V2_CONFIG = {
  models: {
    /** Fast model for initial extraction */
    extraction: "claude-haiku-4-5-20251001" as const,
    /** Powerful model for enrichment, step merging, and substitutions */
    enrichment: "claude-sonnet-4-6" as const,
    /** Vision model for image validation */
    vision: "claude-haiku-4-5-20251001" as const,
    maxTokens: {
      extraction: 4096,
      enrichment: 8192,
      stepMerge: 8192,
      vision: 100,
    },
  },

  discovery: {
    youtubeQueries: [
      "site:youtube.com {pattern} fly tying tutorial",
      "site:youtube.com how to tie {pattern}",
    ],
    webQueries: [
      "{pattern} fly tying recipe materials",
      "{pattern} fly pattern step by step instructions hook thread",
    ],
    /** Max results per query from Brave */
    maxResultsPerQuery: 10,
    /** Max YouTube videos to keep per pattern (after scoring) */
    maxYouTubePerPattern: 4,
    /** Max web results to keep per pattern (after scoring) */
    maxWebPerPattern: 5,
  },

  scraping: {
    /** Max content length sent to extraction (chars) */
    contentCap: 12000,
    /** User agent for web requests */
    userAgent: "FlyArchive/2.0 (fly pattern database; educational use)",
    /** Request delay between scrapes (ms) */
    requestDelayMs: 300,
    /** Request timeout (ms) */
    timeoutMs: 15000,
    concurrency: 5,
  },

  extraction: {
    /** Minimum content length to attempt extraction */
    minContentLength: 100,
  },

  consensus: {
    /** Minimum source agreement to include a material (0-1) */
    materialThreshold: 0.5,
    /** Minimum sources for a material to be marked optional (when below threshold) */
    optionalMinSources: 2,
    /** Fuzzy match threshold for clustering material names */
    fuzzyMatchThreshold: 0.8,
  },

  productLinks: {
    retailers: [
      {
        name: "j_stockard" as const,
        displayName: "J. Stockard",
        domain: "jsflies.com",
        searchTemplate: "site:jsflies.com {material}",
      },
      {
        name: "trident" as const,
        displayName: "Trident Fly Fishing",
        domain: "tridentflyfishing.com",
        searchTemplate: "site:tridentflyfishing.com {material}",
      },
    ],
    /** Delay between product link searches (ms) */
    requestDelayMs: 500,
  },

  qualityGate: {
    /** Minimum materials (including hook + thread) */
    minMaterials: 4,
    /** Minimum tying steps */
    minSteps: 3,
    /** Minimum validated photos */
    minPhotos: 1,
    /** Minimum description length */
    minDescriptionLength: 100,
    /** Minimum overall confidence */
    minConfidence: 0.6,
    /** Minimum source count */
    minSources: 2,
  },

  images: {
    /** Max images to discover per pattern */
    maxImagesPerPattern: 10,
    /** Max images to validate with vision per pattern */
    maxVisionValidations: 3,
  },
};

export function validateV2Config(): string[] {
  const errors: string[] = [];

  if (!process.env.BRAVE_SEARCH_API_KEY) {
    errors.push("BRAVE_SEARCH_API_KEY environment variable is required");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push("ANTHROPIC_API_KEY environment variable is required");
  }

  return errors;
}
