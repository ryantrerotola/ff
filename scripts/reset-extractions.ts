import { prisma } from "../src/lib/prisma";

async function main() {
  // Reset ingested extractions back to extracted so they can be re-processed
  const result = await prisma.stagedExtraction.updateMany({
    where: { status: "ingested" },
    data: { status: "extracted" },
  });

  console.log(`Reset ${result.count} extractions from 'ingested' to 'extracted'`);

  // Also clean up production fly pattern materials so re-ingest doesn't conflict
  const deletedMaterials = await prisma.flyPatternMaterial.deleteMany({});
  await prisma.variation.deleteMany({});
  await prisma.resource.deleteMany({});
  const deletedPatterns = await prisma.flyPattern.deleteMany({});

  console.log(`Cleaned production tables: ${deletedPatterns.count} patterns, ${deletedMaterials.count} materials`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
