/**
 * Database Completeness Validation Script
 * Checks Supabase data against expected seed patterns and reports gaps.
 */
import { PrismaClient } from "@prisma/client";
import { SEED_PATTERNS } from "../src/pipeline/seed-patterns";

const prisma = new PrismaClient();

interface ValidationResult {
  table: string;
  total: number;
  issues: string[];
}

async function main() {
  console.log("=== FlyPatternDB Data Completeness Validation ===\n");

  const results: ValidationResult[] = [];

  // ─── 1. Fly Patterns ──────────────────────────────────────────────────────
  console.log("1. Checking FlyPattern table...");
  const patterns = await prisma.flyPattern.findMany({
    include: {
      materials: { include: { material: true } },
      variations: { include: { overrides: true } },
      resources: true,
      steps: true,
    },
  });

  const patternResult: ValidationResult = {
    table: "FlyPattern",
    total: patterns.length,
    issues: [],
  };

  // Check against seed patterns
  const patternNames = patterns.map((p) => p.name.toLowerCase());
  const patternSlugs = patterns.map((p) => p.slug);
  const missingSeedPatterns: string[] = [];
  for (const seed of SEED_PATTERNS) {
    const found = patterns.some(
      (p) =>
        p.name.toLowerCase() === seed.name.toLowerCase() ||
        p.name.toLowerCase().includes(seed.name.toLowerCase()) ||
        seed.name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (!found) {
      missingSeedPatterns.push(`${seed.name} (${seed.category})`);
    }
  }
  if (missingSeedPatterns.length > 0) {
    patternResult.issues.push(
      `Missing ${missingSeedPatterns.length}/${SEED_PATTERNS.length} seed patterns:\n    - ${missingSeedPatterns.join("\n    - ")}`
    );
  }

  // Check pattern completeness
  const patternsWithoutMaterials = patterns.filter(
    (p) => p.materials.length === 0
  );
  const patternsWithoutResources = patterns.filter(
    (p) => p.resources.length === 0
  );
  const patternsWithoutSteps = patterns.filter((p) => p.steps.length === 0);
  const patternsWithoutDescription = patterns.filter(
    (p) => !p.description || p.description.trim() === ""
  );
  const patternsWithoutCategory = patterns.filter((p) => !p.category);
  const patternsWithoutDifficulty = patterns.filter((p) => !p.difficulty);

  if (patternsWithoutMaterials.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutMaterials.length} patterns have NO materials:\n    - ${patternsWithoutMaterials.map((p) => p.name).join("\n    - ")}`
    );
  }
  if (patternsWithoutResources.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutResources.length} patterns have NO resources:\n    - ${patternsWithoutResources.map((p) => p.name).join("\n    - ")}`
    );
  }
  if (patternsWithoutSteps.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutSteps.length} patterns have NO tying steps:\n    - ${patternsWithoutSteps.map((p) => p.name).join("\n    - ")}`
    );
  }
  if (patternsWithoutDescription.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutDescription.length} patterns have NO description:\n    - ${patternsWithoutDescription.map((p) => p.name).join("\n    - ")}`
    );
  }
  if (patternsWithoutCategory.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutCategory.length} patterns have NO category`
    );
  }
  if (patternsWithoutDifficulty.length > 0) {
    patternResult.issues.push(
      `${patternsWithoutDifficulty.length} patterns have NO difficulty`
    );
  }

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const p of patterns) {
    const cat = p.category || "uncategorized";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  }

  results.push(patternResult);

  // ─── 2. Materials ─────────────────────────────────────────────────────────
  console.log("2. Checking Material table...");
  const materials = await prisma.material.findMany();
  const materialResult: ValidationResult = {
    table: "Material",
    total: materials.length,
    issues: [],
  };

  const materialsWithoutType = materials.filter((m) => !m.type);
  if (materialsWithoutType.length > 0) {
    materialResult.issues.push(
      `${materialsWithoutType.length} materials have NO type`
    );
  }

  // Check material type distribution
  const materialTypeBreakdown: Record<string, number> = {};
  for (const m of materials) {
    const t = m.type || "untyped";
    materialTypeBreakdown[t] = (materialTypeBreakdown[t] || 0) + 1;
  }

  results.push(materialResult);

  // ─── 3. FlyPatternMaterial (join) ─────────────────────────────────────────
  console.log("3. Checking FlyPatternMaterial linkage...");
  const fpm = await prisma.flyPatternMaterial.findMany();
  const fpmResult: ValidationResult = {
    table: "FlyPatternMaterial",
    total: fpm.length,
    issues: [],
  };

  // Check for patterns with very few materials (suspicious)
  const materialCountByPattern: Record<string, number> = {};
  for (const link of fpm) {
    materialCountByPattern[link.flyPatternId] =
      (materialCountByPattern[link.flyPatternId] || 0) + 1;
  }
  const sparsePatterns = patterns.filter(
    (p) => (materialCountByPattern[p.id] || 0) > 0 && (materialCountByPattern[p.id] || 0) < 3
  );
  if (sparsePatterns.length > 0) {
    fpmResult.issues.push(
      `${sparsePatterns.length} patterns have fewer than 3 materials (suspiciously low):\n    - ${sparsePatterns.map((p) => `${p.name} (${materialCountByPattern[p.id] || 0} materials)`).join("\n    - ")}`
    );
  }

  results.push(fpmResult);

  // ─── 4. Variations ────────────────────────────────────────────────────────
  console.log("4. Checking Variation table...");
  const variations = await prisma.variation.findMany({
    include: { overrides: true },
  });
  const varResult: ValidationResult = {
    table: "Variation",
    total: variations.length,
    issues: [],
  };

  const variationsWithoutDescription = variations.filter(
    (v) => !v.description || v.description.trim() === ""
  );
  if (variationsWithoutDescription.length > 0) {
    varResult.issues.push(
      `${variationsWithoutDescription.length} variations have NO description`
    );
  }

  results.push(varResult);

  // ─── 5. Resources ─────────────────────────────────────────────────────────
  console.log("5. Checking Resource table...");
  const resources = await prisma.resource.findMany();
  const resResult: ValidationResult = {
    table: "Resource",
    total: resources.length,
    issues: [],
  };

  const resourceTypeBreakdown: Record<string, number> = {};
  for (const r of resources) {
    resourceTypeBreakdown[r.type] = (resourceTypeBreakdown[r.type] || 0) + 1;
  }

  const resourcesWithoutUrl = resources.filter(
    (r) => !r.url || r.url.trim() === ""
  );
  const resourcesWithoutTitle = resources.filter(
    (r) => !r.title || r.title.trim() === ""
  );
  if (resourcesWithoutUrl.length > 0) {
    resResult.issues.push(
      `${resourcesWithoutUrl.length} resources have NO url`
    );
  }
  if (resourcesWithoutTitle.length > 0) {
    resResult.issues.push(
      `${resourcesWithoutTitle.length} resources have NO title`
    );
  }

  results.push(resResult);

  // ─── 6. TyingSteps ────────────────────────────────────────────────────────
  console.log("6. Checking TyingStep table...");
  const steps = await prisma.tyingStep.findMany();
  const stepResult: ValidationResult = {
    table: "TyingStep",
    total: steps.length,
    issues: [],
  };

  const stepsWithoutInstruction = steps.filter(
    (s) => !s.instruction || s.instruction.trim() === ""
  );
  if (stepsWithoutInstruction.length > 0) {
    stepResult.issues.push(
      `${stepsWithoutInstruction.length} steps have NO instruction`
    );
  }

  results.push(stepResult);

  // ─── 7. MaterialSubstitution ──────────────────────────────────────────────
  console.log("7. Checking MaterialSubstitution table...");
  const substitutions = await prisma.materialSubstitution.findMany();
  const subResult: ValidationResult = {
    table: "MaterialSubstitution",
    total: substitutions.length,
    issues: [],
  };
  results.push(subResult);

  // ─── 8. Pipeline staging tables ───────────────────────────────────────────
  console.log("8. Checking pipeline staging tables...");
  const stagedSources = await prisma.stagedSource.findMany();
  const stagedExtractions = await prisma.stagedExtraction.findMany();

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

  // ─── 9. Techniques ────────────────────────────────────────────────────────
  console.log("9. Checking TyingTechnique table...");
  let techniqueCount = 0;
  try {
    const techniques = await prisma.tyingTechnique.findMany();
    techniqueCount = techniques.length;
  } catch {
    console.log("   (TyingTechnique table may not exist)");
  }

  // ─── 10. Water Bodies ─────────────────────────────────────────────────────
  console.log("10. Checking WaterBody table...");
  let waterBodyCount = 0;
  try {
    const waterBodies = await prisma.waterBody.findMany();
    waterBodyCount = waterBodies.length;
  } catch {
    console.log("   (WaterBody table may not exist)");
  }

  // ─── 11. Hatch Charts ────────────────────────────────────────────────────
  console.log("11. Checking HatchChart table...");
  let hatchChartCount = 0;
  try {
    const hatches = await prisma.hatchChart.findMany();
    hatchChartCount = hatches.length;
  } catch {
    console.log("   (HatchChart table may not exist)");
  }

  // ─── 12. News ─────────────────────────────────────────────────────────────
  console.log("12. Checking NewsArticle table...");
  let newsCount = 0;
  try {
    const news = await prisma.newsArticle.findMany();
    newsCount = news.length;
  } catch {
    console.log("   (NewsArticle table may not exist)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           DATABASE COMPLETENESS REPORT                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Summary table
  console.log("── Record Counts ──────────────────────────────────────────────");
  console.log(`  FlyPattern:            ${patterns.length} (expected: ~${SEED_PATTERNS.length})`);
  console.log(`  Material:              ${materials.length}`);
  console.log(`  FlyPatternMaterial:    ${fpm.length}`);
  console.log(`  Variation:             ${variations.length}`);
  console.log(`  MaterialSubstitution:  ${substitutions.length}`);
  console.log(`  Resource:              ${resources.length}`);
  console.log(`  TyingStep:             ${steps.length}`);
  console.log(`  TyingTechnique:        ${techniqueCount}`);
  console.log(`  WaterBody:             ${waterBodyCount}`);
  console.log(`  HatchChart:            ${hatchChartCount}`);
  console.log(`  NewsArticle:           ${newsCount}`);
  console.log(`  StagedSource:          ${stagedSources.length}`);
  console.log(`  StagedExtraction:      ${stagedExtractions.length}`);

  // Category breakdown
  console.log("\n── Pattern Category Breakdown ──────────────────────────────────");
  const expectedCategories: Record<string, number> = {};
  for (const s of SEED_PATTERNS) {
    expectedCategories[s.category] = (expectedCategories[s.category] || 0) + 1;
  }
  for (const [cat, expected] of Object.entries(expectedCategories)) {
    const actual = categoryBreakdown[cat] || 0;
    const status = actual >= expected ? "OK" : `MISSING ${expected - actual}`;
    console.log(`  ${cat.padEnd(12)} ${String(actual).padStart(3)} / ${expected}  ${status}`);
  }

  // Material type breakdown
  console.log("\n── Material Type Breakdown ─────────────────────────────────────");
  for (const [type, count] of Object.entries(materialTypeBreakdown).sort()) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }

  // Resource type breakdown
  console.log("\n── Resource Type Breakdown ─────────────────────────────────────");
  for (const [type, count] of Object.entries(resourceTypeBreakdown).sort()) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }

  // Pipeline status
  console.log("\n── Pipeline Source Status ──────────────────────────────────────");
  for (const [status, count] of Object.entries(sourceStatusBreakdown).sort()) {
    console.log(`  ${status.padEnd(16)} ${count}`);
  }

  console.log("\n── Pipeline Extraction Status ──────────────────────────────────");
  for (const [status, count] of Object.entries(extractionStatusBreakdown).sort()) {
    console.log(`  ${status.padEnd(16)} ${count}`);
  }

  // Issues
  console.log("\n── Issues Found ───────────────────────────────────────────────");
  let totalIssues = 0;
  for (const r of results) {
    if (r.issues.length > 0) {
      console.log(`\n  [${r.table}]`);
      for (const issue of r.issues) {
        console.log(`  ⚠ ${issue}`);
        totalIssues++;
      }
    }
  }

  if (totalIssues === 0) {
    console.log("  ✓ No issues found - data looks complete!");
  } else {
    console.log(`\n  Total issues: ${totalIssues}`);
  }

  // Quick completeness score
  console.log("\n── Completeness Score ─────────────────────────────────────────");
  const patternCoverage = Math.min(100, Math.round((patterns.length / SEED_PATTERNS.length) * 100));
  const withMaterials = Math.round(((patterns.length - patternsWithoutMaterials.length) / Math.max(1, patterns.length)) * 100);
  const withResources = Math.round(((patterns.length - patternsWithoutResources.length) / Math.max(1, patterns.length)) * 100);
  const withSteps = Math.round(((patterns.length - patternsWithoutSteps.length) / Math.max(1, patterns.length)) * 100);
  const withDescription = Math.round(((patterns.length - patternsWithoutDescription.length) / Math.max(1, patterns.length)) * 100);

  console.log(`  Pattern coverage:      ${patternCoverage}% (${patterns.length}/${SEED_PATTERNS.length})`);
  console.log(`  Have materials:        ${withMaterials}% (${patterns.length - patternsWithoutMaterials.length}/${patterns.length})`);
  console.log(`  Have resources:        ${withResources}% (${patterns.length - patternsWithoutResources.length}/${patterns.length})`);
  console.log(`  Have tying steps:      ${withSteps}% (${patterns.length - patternsWithoutSteps.length}/${patterns.length})`);
  console.log(`  Have description:      ${withDescription}% (${patterns.length - patternsWithoutDescription.length}/${patterns.length})`);

  console.log("\n═══════════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Validation failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
