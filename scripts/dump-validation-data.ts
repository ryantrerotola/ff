/**
 * Data dump script for remote validation.
 * Run locally: npx tsx scripts/dump-validation-data.ts
 * Then share the output file with Claude for analysis.
 */
import { PrismaClient } from "@prisma/client";
import { SEED_PATTERNS } from "../src/pipeline/seed-patterns";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Dumping validation data from Supabase...\n");

  // 1. Fly Patterns with all relations
  console.log("1. Fetching fly patterns...");
  const patterns = await prisma.flyPattern.findMany({
    include: {
      materials: { include: { material: { select: { id: true, name: true, type: true } } } },
      variations: { include: { overrides: true } },
      resources: true,
      tyingSteps: true,
      images: { select: { id: true, url: true, isPrimary: true } },
    },
  });
  console.log(`   ${patterns.length} patterns`);

  // 2. All materials
  console.log("2. Fetching materials...");
  const materials = await prisma.material.findMany();
  console.log(`   ${materials.length} materials`);

  // 3. Substitutions
  console.log("3. Fetching substitutions...");
  const substitutions = await prisma.materialSubstitution.findMany();
  console.log(`   ${substitutions.length} substitutions`);

  // 4. Staged sources
  console.log("4. Fetching staged sources...");
  const stagedSources = await prisma.stagedSource.findMany({
    select: { id: true, status: true, patternQuery: true, url: true, title: true, sourceType: true },
  });
  console.log(`   ${stagedSources.length} staged sources`);

  // 5. Staged extractions
  console.log("5. Fetching staged extractions...");
  const stagedExtractions = await prisma.stagedExtraction.findMany({
    select: { id: true, patternName: true, normalizedSlug: true, confidence: true, status: true },
  });
  console.log(`   ${stagedExtractions.length} staged extractions`);

  // 6. Canonical materials
  console.log("6. Fetching canonical materials...");
  const canonicalMaterials = await prisma.canonicalMaterial.findMany();
  console.log(`   ${canonicalMaterials.length} canonical materials`);

  // 7. Reference tables
  console.log("7. Fetching reference tables...");
  let techniques: unknown[] = [];
  let waterBodies: unknown[] = [];
  let hatchEntries: unknown[] = [];
  let newsCount = 0;
  try { techniques = await prisma.tyingTechnique.findMany({ select: { id: true, name: true, slug: true, category: true } }); } catch { /* */ }
  try { waterBodies = await prisma.waterBody.findMany({ select: { id: true, name: true, region: true, slug: true } }); } catch { /* */ }
  try { hatchEntries = await prisma.hatchEntry.findMany({ select: { id: true, flyPatternId: true, waterBody: true, species: true, month: true } }); } catch { /* */ }
  try { newsCount = await prisma.newsArticle.count(); } catch { /* */ }

  // 8. Variation overrides
  console.log("8. Fetching variation overrides...");
  const variationOverrides = await prisma.variationOverride.findMany();

  // Build the dump
  const dump = {
    exportedAt: new Date().toISOString(),
    seedPatterns: SEED_PATTERNS,
    patterns: patterns.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      difficulty: p.difficulty,
      waterType: p.waterType,
      descriptionLength: p.description?.length || 0,
      descriptionPreview: p.description?.slice(0, 120) || null,
      origin: p.origin ? true : false,
      materialCount: p.materials.length,
      materials: p.materials.map(m => ({
        materialName: m.material.name,
        materialType: m.material.type,
        materialId: m.materialId,
        position: m.position,
        required: m.required,
        customColor: m.customColor,
        customSize: m.customSize,
      })),
      variationCount: p.variations.length,
      variations: p.variations.map(v => ({
        name: v.name,
        hasDescription: !!v.description && v.description.trim().length > 0,
        overrideCount: v.overrides.length,
      })),
      resourceCount: p.resources.length,
      resources: p.resources.map(r => ({
        type: r.type,
        title: r.title,
        url: r.url,
        creatorName: r.creatorName,
        qualityScore: r.qualityScore,
      })),
      tyingStepCount: p.tyingSteps.length,
      imageCount: p.images.length,
    })),
    materials: materials.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
    })),
    substitutions: substitutions.map(s => ({
      materialId: s.materialId,
      substituteMaterialId: s.substituteMaterialId,
      type: s.substitutionType,
    })),
    variationOverrides: variationOverrides.map(v => ({
      variationId: v.variationId,
      originalMaterialId: v.originalMaterialId,
      replacementMaterialId: v.replacementMaterialId,
    })),
    stagedSources: stagedSources.map(s => ({
      id: s.id,
      status: s.status,
      patternQuery: s.patternQuery,
      sourceType: s.sourceType,
    })),
    stagedExtractions: stagedExtractions.map(e => ({
      id: e.id,
      patternName: e.patternName,
      normalizedSlug: e.normalizedSlug,
      confidence: e.confidence,
      status: e.status,
    })),
    canonicalMaterials: canonicalMaterials.map(c => ({
      canonicalName: c.canonicalName,
      materialType: c.materialType,
      aliasCount: c.aliases.length,
    })),
    counts: {
      techniques: (techniques as unknown[]).length,
      waterBodies: (waterBodies as unknown[]).length,
      hatchEntries: (hatchEntries as unknown[]).length,
      newsArticles: newsCount,
    },
  };

  const outPath = join(__dirname, "validation-dump.json");
  writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`\n✓ Dump saved to: ${outPath}`);
  console.log(`  Total size: ${(JSON.stringify(dump).length / 1024).toFixed(1)} KB`);
}

main()
  .catch((e) => { console.error("Dump failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
