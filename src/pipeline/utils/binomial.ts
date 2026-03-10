/**
 * Binomial hypothesis testing for material consensus.
 *
 * Instead of arbitrary agreement thresholds (e.g. ≥75% = mandatory),
 * we ask: "Is this material appearing significantly more often than noise?"
 *
 * Null hypothesis: a noise material appears with base rate `noiseRate`
 * (extraction errors, variant-specific ingredients, etc.).
 *
 * We compute the binomial survival function P(X ≥ k | n, noiseRate)
 * and compare against significance levels to decide:
 *   - p < mandatoryAlpha  → mandatory (very confident it's real)
 *   - p < optionalAlpha   → optional  (likely real, not certain)
 *   - p ≥ optionalAlpha   → exclude   (could be noise)
 *
 * This naturally adapts to sample size:
 *   3 sources: need ~2/3 (67%) to be significant
 *   5 sources: need ~3/5 (60%)
 *   7 sources: need ~3/7 (43%)
 *  10 sources: need ~4/10 (40%)
 */

/**
 * Binomial coefficient C(n, k) for small n (≤20).
 */
function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  // Use symmetry to minimize multiplications
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Binomial survival function: P(X ≥ k | n, p)
 *
 * Probability of observing k or more successes in n independent
 * Bernoulli trials with success probability p.
 */
export function binomialSurvival(k: number, n: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;

  let pValue = 0;
  for (let i = k; i <= n; i++) {
    pValue += binomCoeff(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
  }
  return pValue;
}

export interface MaterialSignificance {
  /** Whether the material should be included at all */
  include: boolean;
  /** Whether it's mandatory (high confidence) or optional */
  mandatory: boolean;
  /** The raw p-value from the binomial test */
  pValue: number;
}

/**
 * Test whether a material's appearance frequency is significant.
 *
 * @param observed  Number of sources that include this material
 * @param total     Total number of sources
 * @param noiseRate Expected rate of a noise/error material (default 0.15)
 * @param mandatoryAlpha  Significance level for mandatory inclusion (default 0.01)
 * @param optionalAlpha   Significance level for optional inclusion (default 0.10)
 */
export function testMaterialSignificance(
  observed: number,
  total: number,
  noiseRate: number,
  mandatoryAlpha: number,
  optionalAlpha: number
): MaterialSignificance {
  const pValue = binomialSurvival(observed, total, noiseRate);

  return {
    include: pValue < optionalAlpha,
    mandatory: pValue < mandatoryAlpha,
    pValue,
  };
}
