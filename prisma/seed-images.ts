import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Color palette for generating pattern placeholder images
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  dry_fly: { bg: "e8d5b7", text: "6b4226" },
  nymph: { bg: "a0c4b8", text: "2d5f4e" },
  streamer: { bg: "b8c9e0", text: "2c4a6e" },
  wet_fly: { bg: "c9b8d9", text: "5c3d75" },
  saltwater: { bg: "b0d8e8", text: "1a5276" },
  bass_bug: { bg: "d4c4a0", text: "6b5b2e" },
  salmon_fly: { bg: "e0b8b8", text: "8b3a3a" },
  terrestrial: { bg: "c8d8a8", text: "4a5f2a" },
};

async function main() {
  // Check if images already exist
  const existing = await prisma.patternImage.count();
  if (existing > 0) {
    console.log(`Skipping: ${existing} pattern images already exist.`);
    await prisma.$disconnect();
    return;
  }

  const patterns = await prisma.flyPattern.findMany({
    select: { id: true, name: true, category: true },
  });

  if (patterns.length === 0) {
    console.log("No patterns found to add images to.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Adding placeholder images for ${patterns.length} patterns...`);

  let count = 0;
  for (const pattern of patterns) {
    const colors = CATEGORY_COLORS[pattern.category] ?? { bg: "e0e0e0", text: "333333" };
    const encodedName = encodeURIComponent(pattern.name);

    // Create a primary placeholder image
    await prisma.patternImage.create({
      data: {
        flyPatternId: pattern.id,
        url: `https://placehold.co/800x600/${colors.bg}/${colors.text}?text=${encodedName}`,
        caption: `${pattern.name} fly pattern`,
        isPrimary: true,
      },
    });

    // Create a secondary "tying view" image
    await prisma.patternImage.create({
      data: {
        flyPatternId: pattern.id,
        url: `https://placehold.co/800x600/${colors.bg}/${colors.text}?text=${encodedName}+%28Detail%29`,
        caption: `${pattern.name} — detail view`,
        isPrimary: false,
      },
    });

    count++;
  }

  console.log(`Done: Added ${count * 2} images for ${count} patterns.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
