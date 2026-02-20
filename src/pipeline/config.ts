export const PIPELINE_CONFIG = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY ?? "",
    maxResultsPerQuery: 10,
    searchQueries: [
      "how to tie {pattern} fly",
      "{pattern} fly tying tutorial",
      "{pattern} fly pattern recipe",
    ],
    quotaCostPerSearch: 100,
    dailyQuotaLimit: 10000,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: "claude-sonnet-4-20250514" as const,
    maxTokens: 4096,
  },
  scraping: {
    concurrency: parseInt(process.env.PIPELINE_CONCURRENCY ?? "5", 10),
    requestDelayMs: 1000,
    userAgent:
      "FlyPatternDB/1.0 (fly pattern database; educational use)",
    timeoutMs: 15000,
  },
  normalization: {
    confidenceThreshold: parseFloat(
      process.env.PIPELINE_CONFIDENCE_THRESHOLD ?? "0.7"
    ),
    fuzzyMatchThreshold: 0.85,
  },
};

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!PIPELINE_CONFIG.youtube.apiKey) {
    errors.push("YOUTUBE_API_KEY environment variable is required");
  }
  if (!PIPELINE_CONFIG.anthropic.apiKey) {
    errors.push("ANTHROPIC_API_KEY environment variable is required");
  }

  return errors;
}
