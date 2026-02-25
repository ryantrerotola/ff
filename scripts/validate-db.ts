/**
 * Comprehensive Supabase Data Validation Script
 *
 * Validates all production and pipeline data for completeness, quality,
 * and integrity. Run after `npm run pipeline:run` to verify ingested data.
 *
 * Usage: npm run validate-db
 */
import { PrismaClient } from "@prisma/client";
import { SEED_PATTERNS } from "../src/pipeline/seed-patterns";

const prisma = new PrismaClient();

// ─── Retry logic for Supabase cold starts ────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;

      const message = error instanceof Error ? error.message : "";
      const isRetryable =
        message.includes("connect") ||
        message.includes("timeout") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ECONNRESET") ||
        message.includes("prepared statement") ||
        message.includes("Connection pool") ||
        message.includes("Can't reach database");

      if (!isRetryable) throw error;

      const wait = delayMs * Math.pow(2, attempt);
      console.warn(
        `  ⏳ Attempt ${attempt + 1}/${retries + 1} failed, retrying in ${wait}ms...`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("withRetry: unreachable");
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Issue {
  severity: "error" | "warning" | "info";
  table: string;
  message: string;
  details?: string[];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     FlyPatternDB — Supabase Data Completeness Validator    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const issues: Issue[] = [];

  // Test connection first
  console.log("Connecting to Supabase...");
  await withRetry(() => prisma.$queryRaw`SELECT 1`);
  console.log("  ✓ Connected\n");

  // ─── 1. Fly Patterns ────────────────────────────────────────────────────
  console.log("1. Checking FlyPattern table...");
  const patterns = await withRetry(() =>
    prisma.flyPattern.findMany({
      include: {
        materials: { include: { material: true } },
        variations: { include: { overrides: true } },
        resources: true,
        tyingSteps: true,
        images: true,
      },
    }),
  );
  console.log(`   ${patterns.length} patterns found`);

  // 1a. Seed pattern coverage
  const matchedSeeds: string[] = [];
  const missedSeeds: string[] = [];
  for (const seed of SEED_PATTERNS) {
    const found = patterns.some(
      (p) =>
        p.name.toLowerCase() === seed.name.toLowerCase() ||
        p.name.toLowerCase().includes(seed.name.toLowerCase()) ||
        seed.name.toLowerCase().includes(p.name.toLowerCase()),
    );
    if (found) {
      matchedSeeds.push(seed.name);
    } else {
      missedSeeds.push(`${seed.name} (${seed.category})`);
    }
  }
  if (missedSeeds.length > 0) {
    issues.push({
      severity: "error",
      table: "FlyPattern",
      message: `Missing ${missedSeeds.length}/${SEED_PATTERNS.length} seed patterns`,
      details: missedSeeds,
    });
  }

  // 1b. Patterns without materials
  const noMaterials = patterns.filter((p) => p.materials.length === 0);
  if (noMaterials.length > 0) {
    issues.push({
      severity: "error",
      table: "FlyPattern",
      message: `${noMaterials.length} patterns have NO materials`,
      details: noMaterials.map((p) => p.name),
    });
  }

  // 1c. Patterns without description or very short description
  const noDescription = patterns.filter(
    (p) => !p.description || p.description.trim() === "",
  );
  const shortDescription = patterns.filter(
    (p) =>
      p.description &&
      p.description.trim().length > 0 &&
      p.description.trim().length < 50,
  );
  if (noDescription.length > 0) {
    issues.push({
      severity: "error",
      table: "FlyPattern",
      message: `${noDescription.length} patterns have NO description`,
      details: noDescription.map((p) => p.name),
    });
  }
  if (shortDescription.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPattern",
      message: `${shortDescription.length} patterns have very short descriptions (<50 chars)`,
      details: shortDescription.map(
        (p) => `${p.name}: "${p.description?.slice(0, 60)}..."`,
      ),
    });
  }

  // 1d. Patterns without resources (no source traceability)
  const noResources = patterns.filter((p) => p.resources.length === 0);
  if (noResources.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPattern",
      message: `${noResources.length} patterns have NO resources (no source traceability)`,
      details: noResources.map((p) => p.name),
    });
  }

  // 1e. Patterns without tying steps
  const noSteps = patterns.filter((p) => p.tyingSteps.length === 0);
  if (noSteps.length > 0) {
    issues.push({
      severity: "info",
      table: "FlyPattern",
      message: `${noSteps.length} patterns have NO tying steps`,
      details: noSteps.map((p) => p.name),
    });
  }

  // 1f. Duplicate pattern names (case-insensitive)
  const nameMap = new Map<string, string[]>();
  for (const p of patterns) {
    const key = p.name.toLowerCase().trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(p.name);
  }
  const dupeNames = [...nameMap.entries()].filter(([, v]) => v.length > 1);
  if (dupeNames.length > 0) {
    issues.push({
      severity: "error",
      table: "FlyPattern",
      message: `${dupeNames.length} duplicate pattern names (case-insensitive)`,
      details: dupeNames.map(([, names]) => names.join(" / ")),
    });
  }

  // 1g. Slug format validation
  const badSlugs = patterns.filter(
    (p) => !p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug),
  );
  if (badSlugs.length > 0) {
    issues.push({
      severity: "error",
      table: "FlyPattern",
      message: `${badSlugs.length} patterns have malformed slugs`,
      details: badSlugs.map((p) => `${p.name} → "${p.slug}"`),
    });
  }

  // 1h. Patterns missing a hook material
  const noHook = patterns.filter(
    (p) =>
      p.materials.length > 0 &&
      !p.materials.some((m) => m.material.type === "hook"),
  );
  if (noHook.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPattern",
      message: `${noHook.length} patterns have materials but NO hook`,
      details: noHook.map((p) => p.name),
    });
  }

  // 1i. Patterns missing a thread material
  const noThread = patterns.filter(
    (p) =>
      p.materials.length > 0 &&
      !p.materials.some((m) => m.material.type === "thread"),
  );
  if (noThread.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPattern",
      message: `${noThread.length} patterns have materials but NO thread`,
      details: noThread.map((p) => p.name),
    });
  }

  // 1j. Patterns with suspiciously few materials (< 3)
  const sparse = patterns.filter(
    (p) => p.materials.length > 0 && p.materials.length < 3,
  );
  if (sparse.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPattern",
      message: `${sparse.length} patterns have fewer than 3 materials`,
      details: sparse.map(
        (p) => `${p.name} (${p.materials.length} materials)`,
      ),
    });
  }

  // 1k. Material position gaps (should be sequential 1..N)
  const positionGaps: string[] = [];
  for (const p of patterns) {
    if (p.materials.length === 0) continue;
    const positions = p.materials.map((m) => m.position).sort((a, b) => a - b);
    const expected = positions.map((_, i) => i + 1);
    const hasGap = positions.some((pos, i) => pos !== expected[i]);
    if (hasGap) {
      positionGaps.push(
        `${p.name}: positions [${positions.join(",")}]`,
      );
    }
  }
  if (positionGaps.length > 0) {
    issues.push({
      severity: "warning",
      table: "FlyPatternMaterial",
      message: `${positionGaps.length} patterns have non-sequential material positions`,
      details: positionGaps.slice(0, 20),
    });
  }

  // 1l. Patterns without images
  const noImages = patterns.filter((p) => p.images.length === 0);
  if (noImages.length > 0) {
    issues.push({
      severity: "info",
      table: "PatternImage",
      message: `${noImages.length}/${patterns.length} patterns have NO images`,
    });
  }

  // ─── 2. Materials ───────────────────────────────────────────────────────
  console.log("2. Checking Material table...");
  const materials = await withRetry(() => prisma.material.findMany());
  console.log(`   ${materials.length} materials found`);

  // 2a. Materials with missing type
  const noType = materials.filter((m) => !m.type);
  if (noType.length > 0) {
    issues.push({
      severity: "error",
      table: "Material",
      message: `${noType.length} materials have NO type`,
    });
  }

  // 2b. Orphaned materials (not linked to any pattern)
  const linkedMaterialIds = new Set(
    patterns.flatMap((p) => p.materials.map((m) => m.materialId)),
  );
  const orphaned = materials.filter((m) => !linkedMaterialIds.has(m.id));
  // Also check substitutions and variation overrides
  const substitutions = await withRetry(() =>
    prisma.materialSubstitution.findMany(),
  );
  const variationOverrides = await withRetry(() =>
    prisma.variationOverride.findMany(),
  );
  const subMaterialIds = new Set([
    ...substitutions.map((s) => s.materialId),
    ...substitutions.map((s) => s.substituteMaterialId),
    ...variationOverrides.map((v) => v.originalMaterialId),
    ...variationOverrides.map((v) => v.replacementMaterialId),
  ]);
  const trueOrphans = orphaned.filter((m) => !subMaterialIds.has(m.id));
  if (trueOrphans.length > 0) {
    issues.push({
      severity: "info",
      table: "Material",
      message: `${trueOrphans.length} materials are orphaned (not linked to any pattern, substitution, or variation)`,
      details: trueOrphans.slice(0, 20).map((m) => `${m.name} (${m.type})`),
    });
  }

  // 2c. Duplicate material names within same type
  const matNameMap = new Map<string, number>();
  for (const m of materials) {
    const key = `${m.name.toLowerCase().trim()}::${m.type}`;
    matNameMap.set(key, (matNameMap.get(key) || 0) + 1);
  }
  const dupeMats = [...matNameMap.entries()].filter(([, count]) => count > 1);
  if (dupeMats.length > 0) {
    issues.push({
      severity: "warning",
      table: "Material",
      message: `${dupeMats.length} duplicate material name+type combinations`,
      details: dupeMats.map(([key, count]) => `${key} (${count}x)`),
    });
  }

  // ─── 3. FlyPatternMaterial ──────────────────────────────────────────────
  console.log("3. Checking FlyPatternMaterial linkage...");
  const fpm = await withRetry(() => prisma.flyPatternMaterial.findMany());
  console.log(`   ${fpm.length} pattern-material links found`);

  // ─── 4. Variations ─────────────────────────────────────────────────────
  console.log("4. Checking Variation table...");
  const variations = await withRetry(() =>
    prisma.variation.findMany({ include: { overrides: true } }),
  );
  console.log(`   ${variations.length} variations found`);

  const noVarDesc = variations.filter(
    (v) => !v.description || v.description.trim() === "",
  );
  if (noVarDesc.length > 0) {
    issues.push({
      severity: "warning",
      table: "Variation",
      message: `${noVarDesc.length} variations have NO description`,
    });
  }

  // ─── 5. Resources ──────────────────────────────────────────────────────
  console.log("5. Checking Resource table...");
  const resources = await withRetry(() => prisma.resource.findMany());
  console.log(`   ${resources.length} resources found`);

  const noUrl = resources.filter((r) => !r.url || r.url.trim() === "");
  const noTitle = resources.filter((r) => !r.title || r.title.trim() === "");
  if (noUrl.length > 0) {
    issues.push({
      severity: "error",
      table: "Resource",
      message: `${noUrl.length} resources have NO url`,
    });
  }
  if (noTitle.length > 0) {
    issues.push({
      severity: "warning",
      table: "Resource",
      message: `${noTitle.length} resources have NO title`,
    });
  }

  // 5a. Duplicate resource URLs per pattern
  const resourceUrlMap = new Map<string, number>();
  for (const r of resources) {
    const key = `${r.flyPatternId}::${r.url}`;
    resourceUrlMap.set(key, (resourceUrlMap.get(key) || 0) + 1);
  }
  const dupeResources = [...resourceUrlMap.entries()].filter(
    ([, count]) => count > 1,
  );
  if (dupeResources.length > 0) {
    issues.push({
      severity: "warning",
      table: "Resource",
      message: `${dupeResources.length} duplicate resource URLs within same pattern`,
    });
  }

  // 5b. Resources with quality score out of range
  const badQuality = resources.filter(
    (r) => r.qualityScore < 1 || r.qualityScore > 5,
  );
  if (badQuality.length > 0) {
    issues.push({
      severity: "warning",
      table: "Resource",
      message: `${badQuality.length} resources have quality score outside 1-5 range`,
    });
  }

  // ─── 6. TyingSteps ─────────────────────────────────────────────────────
  console.log("6. Checking TyingStep table...");
  const steps = await withRetry(() => prisma.tyingStep.findMany());
  console.log(`   ${steps.length} tying steps found`);

  const noInstruction = steps.filter(
    (s) => !s.instruction || s.instruction.trim() === "",
  );
  if (noInstruction.length > 0) {
    issues.push({
      severity: "error",
      table: "TyingStep",
      message: `${noInstruction.length} tying steps have NO instruction`,
    });
  }

  // ─── 7. MaterialSubstitution ────────────────────────────────────────────
  console.log("7. Checking MaterialSubstitution table...");
  console.log(`   ${substitutions.length} substitutions found`);

  // 7a. Self-substitutions (same material as original and substitute)
  const selfSubs = substitutions.filter(
    (s) => s.materialId === s.substituteMaterialId,
  );
  if (selfSubs.length > 0) {
    issues.push({
      severity: "error",
      table: "MaterialSubstitution",
      message: `${selfSubs.length} self-substitutions (material substituted with itself)`,
    });
  }

  // ─── 8. Pipeline Staging Tables ─────────────────────────────────────────
  console.log("8. Checking pipeline staging tables...");
  const stagedSources = await withRetry(() =>
    prisma.stagedSource.findMany(),
  );
  const stagedExtractions = await withRetry(() =>
    prisma.stagedExtraction.findMany(),
  );
  console.log(
    `   ${stagedSources.length} staged sources, ${stagedExtractions.length} staged extractions`,
  );

  const sourceStatusBreakdown: Record<string, number> = {};
  for (const s of stagedSources) {
    sourceStatusBreakdown[s.status] =
      (sourceStatusBreakdown[s.status] || 0) + 1;
  }

  const extractionStatusBreakdown: Record<string, number> = {};
  for (const e of stagedExtractions) {
    extractionStatusBreakdown[e.status] =
      (extractionStatusBreakdown[e.status] || 0) + 1;
  }

  // 8a. Stuck sources (discovered but never scraped)
  const stuckDiscovered = stagedSources.filter(
    (s) => s.status === "discovered",
  );
  if (stuckDiscovered.length > 0) {
    issues.push({
      severity: "info",
      table: "StagedSource",
      message: `${stuckDiscovered.length} sources stuck at 'discovered' (never scraped)`,
    });
  }

  // 8b. Sources scraped but never extracted
  const stuckScraped = stagedSources.filter((s) => s.status === "scraped");
  if (stuckScraped.length > 0) {
    issues.push({
      severity: "info",
      table: "StagedSource",
      message: `${stuckScraped.length} sources stuck at 'scraped' (never extracted)`,
    });
  }

  // 8c. Low-confidence extractions
  const lowConfidence = stagedExtractions.filter((e) => e.confidence < 0.5);
  if (lowConfidence.length > 0) {
    issues.push({
      severity: "warning",
      table: "StagedExtraction",
      message: `${lowConfidence.length} extractions have low confidence (<0.5)`,
      details: lowConfidence.slice(0, 10).map(
        (e) => `${e.patternName}: ${e.confidence.toFixed(2)}`,
      ),
    });
  }

  // 8d. Approved but not ingested extractions
  const approvedNotIngested = stagedExtractions.filter(
    (e) => e.status === "approved",
  );
  if (approvedNotIngested.length > 0) {
    issues.push({
      severity: "warning",
      table: "StagedExtraction",
      message: `${approvedNotIngested.length} extractions approved but NOT ingested`,
      details: approvedNotIngested.slice(0, 10).map((e) => e.patternName),
    });
  }

  // 8e. Extractions with no matching production pattern
  const productionSlugs = new Set(patterns.map((p) => p.slug));
  const ingestedNoMatch = stagedExtractions.filter(
    (e) => e.status === "ingested" && !productionSlugs.has(e.normalizedSlug),
  );
  if (ingestedNoMatch.length > 0) {
    issues.push({
      severity: "warning",
      table: "StagedExtraction",
      message: `${ingestedNoMatch.length} extractions marked 'ingested' but no matching production pattern by slug`,
      details: ingestedNoMatch.slice(0, 10).map(
        (e) => `${e.patternName} (slug: ${e.normalizedSlug})`,
      ),
    });
  }

  // ─── 9. Canonical Materials ─────────────────────────────────────────────
  console.log("9. Checking CanonicalMaterial table...");
  const canonicalMats = await withRetry(() =>
    prisma.canonicalMaterial.findMany(),
  );
  console.log(`   ${canonicalMats.length} canonical materials found`);

  // ─── 10. Techniques ─────────────────────────────────────────────────────
  console.log("10. Checking TyingTechnique table...");
  let techniques: { id: string; name: string; videos?: { id: string }[]; steps?: { id: string }[] }[] = [];
  try {
    techniques = await withRetry(() =>
      prisma.tyingTechnique.findMany({
        include: { videos: { select: { id: true } }, steps: { select: { id: true } } },
      }),
    );
  } catch {
    console.log("    (TyingTechnique table may not exist)");
  }
  console.log(`   ${techniques.length} techniques found`);

  // ─── 11. Water Bodies ───────────────────────────────────────────────────
  console.log("11. Checking WaterBody table...");
  let waterBodies: { id: string }[] = [];
  try {
    waterBodies = await withRetry(() => prisma.waterBody.findMany({ select: { id: true } }));
  } catch {
    console.log("    (WaterBody table may not exist)");
  }
  console.log(`   ${waterBodies.length} water bodies found`);

  // ─── 12. Hatch Charts ──────────────────────────────────────────────────
  console.log("12. Checking HatchEntry table...");
  let hatchEntries: { id: string; flyPatternId: string | null }[] = [];
  try {
    hatchEntries = await withRetry(() =>
      prisma.hatchEntry.findMany({ select: { id: true, flyPatternId: true } }),
    );
  } catch {
    console.log("    (HatchEntry table may not exist)");
  }
  console.log(`   ${hatchEntries.length} hatch entries found`);

  // 12a. Hatch entries with broken pattern links
  const patternIds = new Set(patterns.map((p) => p.id));
  const brokenHatchLinks = hatchEntries.filter(
    (h) => h.flyPatternId && !patternIds.has(h.flyPatternId),
  );
  if (brokenHatchLinks.length > 0) {
    issues.push({
      severity: "error",
      table: "HatchEntry",
      message: `${brokenHatchLinks.length} hatch entries reference non-existent fly patterns`,
    });
  }

  // ─── 13. News Articles ─────────────────────────────────────────────────
  console.log("13. Checking NewsArticle table...");
  let newsCount = 0;
  try {
    newsCount = await withRetry(() => prisma.newsArticle.count());
  } catch {
    console.log("    (NewsArticle table may not exist)");
  }
  console.log(`   ${newsCount} news articles found`);

  // ═════════════════════════════════════════════════════════════════════════
  // REPORT
  // ═════════════════════════════════════════════════════════════════════════
  console.log(
    "\n\n╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║              DATABASE COMPLETENESS REPORT                   ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n",
  );

  // ── Record Counts ─────────────────────────────────────────────────────
  console.log("── Record Counts ──────────────────────────────────────────────");
  const counts: [string, number, string?][] = [
    ["FlyPattern", patterns.length, `expected: ~${SEED_PATTERNS.length}`],
    ["Material", materials.length],
    ["FlyPatternMaterial", fpm.length],
    ["Variation", variations.length],
    ["VariationOverride", variationOverrides.length],
    ["MaterialSubstitution", substitutions.length],
    ["Resource", resources.length],
    ["TyingStep", steps.length],
    ["CanonicalMaterial", canonicalMats.length],
    ["TyingTechnique", techniques.length],
    ["WaterBody", waterBodies.length],
    ["HatchEntry", hatchEntries.length],
    ["NewsArticle", newsCount],
    ["StagedSource", stagedSources.length],
    ["StagedExtraction", stagedExtractions.length],
  ];
  for (const [name, count, note] of counts) {
    const suffix = note ? `  (${note})` : "";
    console.log(`  ${name.padEnd(22)} ${String(count).padStart(5)}${suffix}`);
  }

  // ── Category Breakdown ────────────────────────────────────────────────
  console.log("\n── Pattern Category Breakdown ──────────────────────────────────");
  const categoryBreakdown: Record<string, number> = {};
  for (const p of patterns) {
    const cat = p.category || "uncategorized";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  }
  const expectedCategories: Record<string, number> = {};
  for (const s of SEED_PATTERNS) {
    expectedCategories[s.category] = (expectedCategories[s.category] || 0) + 1;
  }
  for (const [cat, expected] of Object.entries(expectedCategories)) {
    const actual = categoryBreakdown[cat] || 0;
    const pct = Math.round((actual / expected) * 100);
    const status = actual >= expected ? "✓" : `${pct}%`;
    console.log(
      `  ${cat.padEnd(12)} ${String(actual).padStart(3)} / ${String(expected).padEnd(3)} ${status}`,
    );
  }

  // ── Material Type Breakdown ───────────────────────────────────────────
  console.log("\n── Material Type Breakdown ─────────────────────────────────────");
  const materialTypeBreakdown: Record<string, number> = {};
  for (const m of materials) {
    const t = m.type || "untyped";
    materialTypeBreakdown[t] = (materialTypeBreakdown[t] || 0) + 1;
  }
  for (const [type, count] of Object.entries(materialTypeBreakdown).sort()) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }

  // ── Resource Type Breakdown ───────────────────────────────────────────
  console.log("\n── Resource Type Breakdown ─────────────────────────────────────");
  const resourceTypeBreakdown: Record<string, number> = {};
  for (const r of resources) {
    resourceTypeBreakdown[r.type] = (resourceTypeBreakdown[r.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(resourceTypeBreakdown).sort()) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }

  // ── Average materials per pattern ─────────────────────────────────────
  console.log("\n── Material Density ────────────────────────────────────────────");
  const patternsWithMats = patterns.filter((p) => p.materials.length > 0);
  if (patternsWithMats.length > 0) {
    const avg =
      patternsWithMats.reduce((sum, p) => sum + p.materials.length, 0) /
      patternsWithMats.length;
    const min = Math.min(...patternsWithMats.map((p) => p.materials.length));
    const max = Math.max(...patternsWithMats.map((p) => p.materials.length));
    console.log(`  Average materials/pattern:  ${avg.toFixed(1)}`);
    console.log(`  Min materials:              ${min}`);
    console.log(`  Max materials:              ${max}`);
  }

  // ── Pipeline Status ───────────────────────────────────────────────────
  console.log("\n── Pipeline Source Status ──────────────────────────────────────");
  for (const [status, count] of Object.entries(sourceStatusBreakdown).sort()) {
    console.log(`  ${status.padEnd(16)} ${count}`);
  }

  console.log("\n── Pipeline Extraction Status ──────────────────────────────────");
  for (const [status, count] of Object.entries(
    extractionStatusBreakdown,
  ).sort()) {
    console.log(`  ${status.padEnd(16)} ${count}`);
  }

  // ── Confidence Distribution ───────────────────────────────────────────
  if (stagedExtractions.length > 0) {
    console.log("\n── Extraction Confidence Distribution ─────────────────────────");
    const buckets = [0, 0.3, 0.5, 0.7, 0.9, 1.01];
    const labels = ["< 0.3", "0.3–0.5", "0.5–0.7", "0.7–0.9", ">= 0.9"];
    for (let i = 0; i < labels.length; i++) {
      const count = stagedExtractions.filter(
        (e) => e.confidence >= buckets[i] && e.confidence < buckets[i + 1],
      ).length;
      const bar = "█".repeat(Math.round((count / stagedExtractions.length) * 40));
      console.log(
        `  ${labels[i].padEnd(10)} ${String(count).padStart(4)}  ${bar}`,
      );
    }
  }

  // ── Issues ────────────────────────────────────────────────────────────
  console.log("\n── Issues Found ───────────────────────────────────────────────");
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  function printIssues(list: Issue[], icon: string) {
    for (const issue of list) {
      console.log(`\n  ${icon} [${issue.table}] ${issue.message}`);
      if (issue.details && issue.details.length > 0) {
        const shown = issue.details.slice(0, 15);
        for (const d of shown) {
          console.log(`      - ${d}`);
        }
        if (issue.details.length > 15) {
          console.log(
            `      ... and ${issue.details.length - 15} more`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\n  ERRORS (${errors.length}):`);
    printIssues(errors, "✗");
  }
  if (warnings.length > 0) {
    console.log(`\n  WARNINGS (${warnings.length}):`);
    printIssues(warnings, "⚠");
  }
  if (infos.length > 0) {
    console.log(`\n  INFO (${infos.length}):`);
    printIssues(infos, "ℹ");
  }

  if (issues.length === 0) {
    console.log("  ✓ No issues found — data looks complete!");
  }

  // ── Completeness Score ────────────────────────────────────────────────
  console.log(
    "\n── Completeness Score ─────────────────────────────────────────",
  );
  const patternCoverage = Math.min(
    100,
    Math.round((patterns.length / SEED_PATTERNS.length) * 100),
  );
  const withMats = Math.round(
    ((patterns.length - noMaterials.length) / Math.max(1, patterns.length)) *
      100,
  );
  const withRes = Math.round(
    ((patterns.length - noResources.length) / Math.max(1, patterns.length)) *
      100,
  );
  const withSteps = Math.round(
    ((patterns.length - noSteps.length) / Math.max(1, patterns.length)) * 100,
  );
  const withDesc = Math.round(
    ((patterns.length - noDescription.length) / Math.max(1, patterns.length)) *
      100,
  );
  const withHook = Math.round(
    ((patternsWithMats.length - noHook.length) /
      Math.max(1, patternsWithMats.length)) *
      100,
  );
  const withImages = Math.round(
    ((patterns.length - noImages.length) / Math.max(1, patterns.length)) * 100,
  );

  const scores: [string, number, string][] = [
    [
      "Pattern coverage",
      patternCoverage,
      `${patterns.length}/${SEED_PATTERNS.length}`,
    ],
    [
      "Have materials",
      withMats,
      `${patterns.length - noMaterials.length}/${patterns.length}`,
    ],
    [
      "Have hook",
      withHook,
      `${patternsWithMats.length - noHook.length}/${patternsWithMats.length}`,
    ],
    [
      "Have resources",
      withRes,
      `${patterns.length - noResources.length}/${patterns.length}`,
    ],
    [
      "Have tying steps",
      withSteps,
      `${patterns.length - noSteps.length}/${patterns.length}`,
    ],
    [
      "Have description",
      withDesc,
      `${patterns.length - noDescription.length}/${patterns.length}`,
    ],
    [
      "Have images",
      withImages,
      `${patterns.length - noImages.length}/${patterns.length}`,
    ],
  ];

  for (const [label, pct, detail] of scores) {
    const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
    console.log(`  ${label.padEnd(20)} ${bar} ${String(pct).padStart(3)}%  (${detail})`);
  }

  // ── Overall Grade ─────────────────────────────────────────────────────
  const overall = Math.round(
    (patternCoverage + withMats + withDesc + withRes) / 4,
  );
  let grade: string;
  if (overall >= 90) grade = "A";
  else if (overall >= 80) grade = "B";
  else if (overall >= 70) grade = "C";
  else if (overall >= 60) grade = "D";
  else grade = "F";

  console.log(
    `\n  OVERALL: ${grade} (${overall}%)  [${errors.length} errors, ${warnings.length} warnings, ${infos.length} info]`,
  );

  console.log(
    "\n═══════════════════════════════════════════════════════════════\n",
  );

  // Exit with error code if there are errors
  if (errors.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Validation failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
