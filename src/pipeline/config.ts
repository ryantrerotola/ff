export const PIPELINE_CONFIG = {
  youtube: {
    maxResultsPerQuery: 10,
    searchQueries: [
      "site:youtube.com {pattern} fly tying tutorial how to tie",
    ],
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: "claude-haiku-4-5-20251001" as const,
    maxTokens: 4096,
  },
  scraping: {
    concurrency: parseInt(process.env.PIPELINE_CONCURRENCY ?? "5", 10),
    requestDelayMs: 1000,
    userAgent:
      "FlyArchive/1.0 (fly pattern database; educational use)",
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

  if (!process.env.BRAVE_SEARCH_API_KEY) {
    errors.push("BRAVE_SEARCH_API_KEY environment variable is required");
  }
  if (!PIPELINE_CONFIG.anthropic.apiKey) {
    errors.push("ANTHROPIC_API_KEY environment variable is required");
  }

  return errors;
}
