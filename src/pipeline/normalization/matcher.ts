/**
 * Fuzzy string matching utilities for material and pattern name normalization.
 */

/**
 * Calculate Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }

  return dp[m]![n]!;
}

/**
 * Calculate normalized similarity score between two strings (0 to 1).
 * 1 = identical, 0 = completely different.
 */
export function stringSimilarity(a: string, b: string): number {
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();

  if (al === bl) return 1;
  if (al.length === 0 || bl.length === 0) return 0;

  const maxLen = Math.max(al.length, bl.length);
  const distance = levenshteinDistance(al, bl);

  return 1 - distance / maxLen;
}

/**
 * Check if two strings match using token-based comparison.
 * More forgiving than pure Levenshtein for multi-word strings.
 *
 * Examples:
 *   "Uni Thread 6/0" vs "6/0 UNI-Thread" → high match
 *   "Tiemco TMC 100" vs "TMC 100" → high match
 */
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  let matchedA = 0;
  let matchedB = 0;

  // For each token in A, find best match in B
  for (const ta of tokensA) {
    let bestScore = 0;
    for (const tb of tokensB) {
      const sim = stringSimilarity(ta, tb);
      if (sim > bestScore) bestScore = sim;
    }
    if (bestScore > 0.8) matchedA++;
  }

  // For each token in B, find best match in A
  for (const tb of tokensB) {
    let bestScore = 0;
    for (const ta of tokensA) {
      const sim = stringSimilarity(ta, tb);
      if (sim > bestScore) bestScore = sim;
    }
    if (bestScore > 0.8) matchedB++;
  }

  const precisionA = matchedA / tokensA.length;
  const precisionB = matchedB / tokensB.length;

  // Harmonic mean of both directions
  if (precisionA + precisionB === 0) return 0;
  return (2 * precisionA * precisionB) / (precisionA + precisionB);
}

/**
 * Combined similarity score using both Levenshtein and token matching.
 */
export function combinedSimilarity(a: string, b: string): number {
  const stringScore = stringSimilarity(a, b);
  const tokenScore = tokenSimilarity(a, b);

  // Use the higher of the two approaches
  return Math.max(stringScore, tokenScore);
}

/**
 * Tokenize a string into meaningful words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9'/.-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Find the best match for a name in a list of candidates.
 * Returns the match and its similarity score.
 */
export function findBestMatch(
  needle: string,
  candidates: string[]
): { match: string; score: number } | null {
  if (candidates.length === 0) return null;

  let bestMatch = "";
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = combinedSimilarity(needle, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestScore === 0) return null;

  return { match: bestMatch, score: bestScore };
}

/**
 * Group similar strings together using clustering.
 * Returns groups where each group contains similar strings.
 */
export function clusterSimilarStrings(
  strings: string[],
  threshold: number
): string[][] {
  const groups: string[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < strings.length; i++) {
    if (assigned.has(i)) continue;

    const group = [strings[i]!];
    assigned.add(i);

    for (let j = i + 1; j < strings.length; j++) {
      if (assigned.has(j)) continue;

      if (combinedSimilarity(strings[i]!, strings[j]!) >= threshold) {
        group.push(strings[j]!);
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}
