/**
 * Generate a URL-safe slug from a pattern name.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalize a pattern name for comparison.
 * Strips common suffixes, lowercases, removes extra whitespace.
 */
export function normalizePatternName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+(fly\s+)?pattern$/i, "")
    .replace(/\s+(fly)?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a material name for fuzzy matching.
 */
export function normalizeMaterialName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/\b(size|sz\.?|#)\s*\d+[/-]?\d*/gi, "")
    .trim();
}
