/**
 * Pattern completeness checker.
 * Reads validation_dump.json and produces a report of what each pattern is missing.
 *
 * Usage: npm run check-incomplete
 *        npx tsx scripts/check-incomplete-patterns.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DumpMaterial {
  materialName: string;
  materialType: string;
  position: number;
  required: boolean;
  customColor: string | null;
  customSize: string | null;
}

interface DumpResource {
  type: "video" | "blog" | "pdf";
  title: string;
  url: string;
  creatorName: string;
  qualityScore: number;
}

interface DumpPattern {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty: string;
  waterType: string;
  descriptionLength: number;
  descriptionPreview: string | null;
  origin: boolean;
  materialCount: number;
  materials: DumpMaterial[];
  variationCount: number;
  variations: { name: string; hasDescription: boolean; overrideCount: number }[];
  resourceCount: number;
  resources: DumpResource[];
  tyingStepCount: number;
  imageCount: number;
}

interface SeedPattern {
  name: string;
  category: string;
}

interface ValidationDump {
  exportedAt: string;
  seedPatterns: SeedPattern[];
  patterns: DumpPattern[];
  materials: { id: string; name: string; type: string }[];
  substitutions: unknown[];
  stagedSources: { id: string; status: string; patternQuery: string; sourceType: string }[];
  stagedExtractions: { id: string; patternName: string; normalizedSlug: string; confidence: number; status: string }[];
  canonicalMaterials: unknown[];
  counts: Record<string, number>;
}

interface PatternReport {
  name: string;
  slug: string;
  category: string;
  missing: string[];
  missingCount: number;
  hasImages: boolean;
  hasTyingSteps: boolean;
  hasAdequateMaterials: boolean;
  hasHook: boolean;
  hasThread: boolean;
  hasVideo: boolean;
  hasBlog: boolean;
  hasOrigin: boolean;
  materialCount: number;
  tyingStepCount: number;
  imageCount: number;
  videoCount: number;
  blogCount: number;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dumpPath = join(__dirname, "validation_dump.json");
  let raw: string | undefined;
  try {
    raw = readFileSync(dumpPath, "utf-8");
  } catch {
    console.error(`Error: Could not read ${dumpPath}`);
    console.error("Run 'npx tsx scripts/dump-validation-data.ts' first to generate the dump.");
    process.exit(1);
  }

  const data: ValidationDump = JSON.parse(raw!);

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       FlyPatternDB — Pattern Completeness Report            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`  Data exported: ${data.exportedAt}`);
  console.log(`  Patterns in DB: ${data.patterns.length}`);
  console.log(`  Seed patterns: ${data.seedPatterns.length}\n`);

  // ── Analyze each pattern ─────────────────────────────────────────────────

  const reports: PatternReport[] = data.patterns.map((p) => {
    const hasImages = p.imageCount > 0;
    const hasTyingSteps = p.tyingStepCount > 0;
    const hasAdequateMaterials = p.materialCount >= 3;
    const hasHook = p.materials.some((m) => m.materialType === "hook");
    const hasThread = p.materials.some((m) => m.materialType === "thread");
    const hasVideo = p.resources.some((r) => r.type === "video");
    const hasBlog = p.resources.some((r) => r.type === "blog");
    const hasOrigin = p.origin;

    const missing: string[] = [];
    if (!hasImages) missing.push("images");
    if (!hasTyingSteps) missing.push("tyingSteps");
    if (!hasAdequateMaterials) missing.push("materials(<3)");
    if (!hasHook) missing.push("hook");
    if (!hasThread) missing.push("thread");
    if (!hasVideo) missing.push("video");
    if (!hasBlog) missing.push("blog");
    if (!hasOrigin) missing.push("origin");

    return {
      name: p.name,
      slug: p.slug,
      category: p.category,
      missing,
      missingCount: missing.length,
      hasImages,
      hasTyingSteps,
      hasAdequateMaterials,
      hasHook,
      hasThread,
      hasVideo,
      hasBlog,
      hasOrigin,
      materialCount: p.materialCount,
      tyingStepCount: p.tyingStepCount,
      imageCount: p.imageCount,
      videoCount: p.resources.filter((r) => r.type === "video").length,
      blogCount: p.resources.filter((r) => r.type === "blog").length,
    };
  });

  // ── Summary statistics ───────────────────────────────────────────────────

  const total = reports.length;
  const withImages = reports.filter((r) => r.hasImages).length;
  const withSteps = reports.filter((r) => r.hasTyingSteps).length;
  const withMaterials = reports.filter((r) => r.hasAdequateMaterials).length;
  const withHook = reports.filter((r) => r.hasHook).length;
  const withThread = reports.filter((r) => r.hasThread).length;
  const withVideo = reports.filter((r) => r.hasVideo).length;
  const withBlog = reports.filter((r) => r.hasBlog).length;
  const withOrigin = reports.filter((r) => r.hasOrigin).length;

  console.log("── Completeness Summary ───────────────────────────────────────\n");

  const dims: [string, number][] = [
    ["Images", withImages],
    ["Tying Steps", withSteps],
    ["Materials >= 3", withMaterials],
    ["Has Hook", withHook],
    ["Has Thread", withThread],
    ["Video Resource", withVideo],
    ["Blog Resource", withBlog],
    ["Origin/History", withOrigin],
  ];

  for (const [label, count] of dims) {
    const pct = Math.round((count / total) * 100);
    const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
    console.log(
      `  ${label.padEnd(18)} ${bar} ${String(pct).padStart(3)}%  (${count}/${total})`
    );
  }

  // ── Category breakdown ───────────────────────────────────────────────────

  console.log("\n── By Category ────────────────────────────────────────────────\n");

  const categories = [...new Set(reports.map((r) => r.category))].sort();
  for (const cat of categories) {
    const catReports = reports.filter((r) => r.category === cat);
    const catSteps = catReports.filter((r) => r.hasTyingSteps).length;
    const catVideos = catReports.filter((r) => r.hasVideo).length;
    const catBlogs = catReports.filter((r) => r.hasBlog).length;
    const catMats = catReports.filter((r) => r.hasAdequateMaterials).length;

    console.log(`  ${cat.padEnd(12)} (${catReports.length} patterns)`);
    console.log(`    Steps: ${catSteps}/${catReports.length}  Videos: ${catVideos}/${catReports.length}  Blogs: ${catBlogs}/${catReports.length}  Mats>=3: ${catMats}/${catReports.length}`);
  }

  // ── Missing seed patterns ────────────────────────────────────────────────

  console.log("\n── Missing Seed Patterns ──────────────────────────────────────\n");

  const dbNames = new Set(data.patterns.map((p) => p.name.toLowerCase().trim()));
  const missingSeed = data.seedPatterns.filter(
    (sp) => !dbNames.has(sp.name.toLowerCase().trim())
  );

  if (missingSeed.length === 0) {
    console.log("  All seed patterns are present in the DB.");
  } else {
    console.log(`  ${missingSeed.length} of ${data.seedPatterns.length} seed patterns NOT in DB:\n`);
    const byCat = new Map<string, string[]>();
    for (const sp of missingSeed) {
      const list = byCat.get(sp.category) ?? [];
      list.push(sp.name);
      byCat.set(sp.category, list);
    }
    for (const [cat, names] of [...byCat.entries()].sort()) {
      console.log(`  [${cat}] (${names.length})`);
      for (const name of names) {
        console.log(`    - ${name}`);
      }
    }
  }

  // ── Worst-off patterns (most missing dimensions) ─────────────────────────

  console.log("\n── Patterns Missing Most Data (4+ gaps) ───────────────────────\n");

  const worstOff = reports
    .filter((r) => r.missingCount >= 4)
    .sort((a, b) => b.missingCount - a.missingCount);

  if (worstOff.length === 0) {
    console.log("  No patterns missing 4+ dimensions.");
  } else {
    for (const r of worstOff) {
      console.log(`  ${r.name} [${r.category}] — missing ${r.missingCount}: ${r.missing.join(", ")}`);
    }
  }

  // ── Patterns with tying steps (the "best" ones) ──────────────────────────

  console.log("\n── Patterns WITH Tying Steps (${withSteps}) ──────────────────────────\n");

  for (const r of reports.filter((r) => r.hasTyingSteps)) {
    console.log(`  ${r.name} (${r.tyingStepCount} steps, ${r.videoCount} videos, ${r.blogCount} blogs)`);
  }

  // ── Patterns missing tying steps ─────────────────────────────────────────

  console.log(`\n── Patterns MISSING Tying Steps (${total - withSteps}) ──────────────────────\n`);

  const noSteps = reports.filter((r) => !r.hasTyingSteps);
  for (const r of noSteps) {
    console.log(`  ${r.name} [${r.category}]`);
  }

  // ── Sparse materials ─────────────────────────────────────────────────────

  console.log("\n── Patterns with < 3 Materials ────────────────────────────────\n");

  const sparse = reports.filter((r) => !r.hasAdequateMaterials);
  if (sparse.length === 0) {
    console.log("  None.");
  } else {
    for (const r of sparse) {
      console.log(`  ${r.name} (${r.materialCount} materials)`);
    }
  }

  // ── Write machine-readable report ────────────────────────────────────────

  const outputReport = {
    generatedAt: new Date().toISOString(),
    sourceFile: dumpPath,
    summary: {
      totalPatterns: total,
      totalSeedPatterns: data.seedPatterns.length,
      missingSeedPatterns: missingSeed.length,
      withImages,
      withTyingSteps: withSteps,
      withAdequateMaterials: withMaterials,
      withVideo,
      withBlog,
      withOrigin,
    },
    patternsNeedingEnrichment: reports
      .filter((r) => r.missingCount > 1) // More than just images (since all are missing images)
      .sort((a, b) => b.missingCount - a.missingCount)
      .map((r) => ({
        name: r.name,
        slug: r.slug,
        category: r.category,
        missing: r.missing,
        missingCount: r.missingCount,
      })),
    missingSeedPatterns: missingSeed,
    allPatterns: reports,
  };

  const reportPath = join(__dirname, "incomplete-report.json");
  writeFileSync(reportPath, JSON.stringify(outputReport, null, 2));
  console.log(`\n── Report saved to: ${reportPath} ────────────────────────────\n`);

  // ── Final summary ────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  PRIORITY ACTIONS:");
  console.log(`  1. Run 'npm run pipeline:images' to source images (0/${total} have any)`);
  console.log(`  2. Run 'npm run pipeline:enrich' to add tying steps (${total - withSteps}/${total} missing)`);
  console.log(`  3. Run 'npm run pipeline:enrich' to add video resources (${total - withVideo}/${total} missing)`);
  console.log(`  4. Run 'npm run pipeline:run' to import ${missingSeed.length} missing seed patterns`);
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main();
