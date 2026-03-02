import {
  PrismaClient,
  FlyCategory,
  Difficulty,
  WaterType,
  MaterialType,
  SubstitutionType,
  ResourceType,
  CommissionType,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Upsert-based seed: creates seed data if missing, never deletes existing data.
 * Safe to run repeatedly — idempotent by design.
 */
async function main() {
  console.log("Seeding database (additive — existing data is preserved)...");

  // ─── Materials ───────────────────────────────────────────────────────────────

  const materialDefs: { name: string; type: MaterialType; description: string }[] = [
    // Hooks
    { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long nymph/streamer hook, standard wire. Sizes 4-12." },
    { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook, 1X fine wire. Sizes 10-22." },
    { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Standard nymph/wet fly hook, 1X heavy wire. Sizes 8-18." },
    { name: "Mustad 94840 Dry Fly Hook", type: MaterialType.hook, description: "Classic dry fly hook. Sizes 10-20." },
    // Threads
    { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread in various colors." },
    { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong flat thread for larger flies." },
    { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine denier thread for smaller flies." },
    // Tails
    { name: "Marabou Plume", type: MaterialType.tail, description: "Soft, flowing feather used for tails and wings. Excellent movement in water." },
    { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "Natural ring-necked pheasant center tail fibers." },
    { name: "Microfibbetts", type: MaterialType.tail, description: "Synthetic split tail material. Excellent for dry fly tails." },
    { name: "Grizzly Hackle Fibers", type: MaterialType.tail, description: "Barred hackle fibers from grizzly rooster cape." },
    { name: "Elk Body Hair", type: MaterialType.tail, description: "Hollow, buoyant hair from elk body." },
    // Bodies
    { name: "Chenille (Medium)", type: MaterialType.body, description: "Standard chenille for body wraps. Multiple colors." },
    { name: "Peacock Herl", type: MaterialType.body, description: "Iridescent fibers from peacock tail feathers. Classic body material." },
    { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine synthetic dubbing material for dry fly bodies." },
    { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Natural hare's ear fur dubbing with guard hairs." },
    // Ribs
    { name: "Fine Copper Wire", type: MaterialType.rib, description: "Thin copper wire for ribbing and reinforcement." },
    { name: "Fine Gold Wire", type: MaterialType.rib, description: "Thin gold-colored wire for ribbing." },
    // Hackle
    { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Barred black and white rooster hackle feathers." },
    { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Natural brown rooster hackle feathers." },
    { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Long barred grizzly saddle hackle feathers." },
    { name: "Whiting Dry Fly Hackle", type: MaterialType.hackle, description: "Premium dry fly hackle from Whiting Farms." },
    // Wings
    { name: "Elk Hair (Wing)", type: MaterialType.wing, description: "Hollow elk hair for caddis-style wings." },
    { name: "Hen Hackle Tips", type: MaterialType.wing, description: "Matched hen hackle tips for upright wings." },
    // Thorax
    { name: "Peacock Herl (Thorax)", type: MaterialType.thorax, description: "Peacock herl used for thorax area." },
    // Beads
    { name: "Brass Bead", type: MaterialType.bead, description: "Standard brass bead head, various sizes." },
    { name: "Tungsten Bead", type: MaterialType.bead, description: "Heavy tungsten bead for faster sinking." },
    // Weight
    { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire wraps for adding weight to flies." },
    { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead dumbbell eyes in various sizes for Clouser-style patterns." },
    { name: "Bead Chain Eyes", type: MaterialType.weight, description: "Lightweight bead chain eyes for bonefish and shrimp patterns." },
    // Additional Hooks
    { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Standard saltwater O'Shaughnessy hook. Sizes 1/0-6." },
    { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Short-shank curved scud/midge hook. Sizes 14-22." },
    { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Wide-gap stinger hook for streamers and bass flies. Sizes 1/0-6." },
    // Additional Threads
    { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat nylon thread for larger flies and deer hair work." },
    { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine denier thread for small nymphs and midges." },
    // Additional Wing/Hair Materials
    { name: "Bucktail", type: MaterialType.wing, description: "Deer tail hair, long and straight. Used for wings on streamers and saltwater flies." },
    { name: "Calf Body Hair", type: MaterialType.wing, description: "Fine, crinkly hair from calf body. Excellent for upright dry fly wings and posts." },
    { name: "Deer Hair", type: MaterialType.wing, description: "Natural deer body hair for spinning and stacking. Various uses." },
    { name: "Turkey Quill Sections", type: MaterialType.wing, description: "Matched turkey wing quill sections for streamer and wet fly wings." },
    { name: "EP Fiber", type: MaterialType.wing, description: "Synthetic fiber for saltwater and streamer patterns." },
    { name: "CDC Feathers", type: MaterialType.wing, description: "Cul-de-canard feathers from the preen gland area. Natural floatant properties." },
    // Additional Tail Materials
    { name: "Moose Body Hair", type: MaterialType.tail, description: "Coarse, dark hair from moose body. Excellent for tails on attractor patterns." },
    { name: "Goose Biots", type: MaterialType.tail, description: "Stiff fibers from the leading edge of goose flight feathers." },
    // Additional Body Materials
    { name: "Ultra Chenille", type: MaterialType.body, description: "Thin, durable chenille for worm and small-body patterns." },
    { name: "Red Floss", type: MaterialType.body, description: "Bright red single-strand floss for accent bands." },
    { name: "Copper Wire (Medium)", type: MaterialType.body, description: "Medium gauge copper wire for Copper John bodies and ribbing." },
    { name: "Ice Dub", type: MaterialType.body, description: "Sparkly synthetic dubbing with reflective fibers." },
    // Flash Materials
    { name: "Krystal Flash", type: MaterialType.other, description: "Mylar flash material in various colors for wings and accents." },
    { name: "Flashabou", type: MaterialType.other, description: "Flat metallic flash material for streamer wings." },
    // Additional Rib
    { name: "Gold Tinsel (Flat)", type: MaterialType.rib, description: "Flat gold tinsel for ribbing and bodies." },
    // Additional Hackle
    { name: "White Saddle Hackle", type: MaterialType.hackle, description: "Long white saddle hackle feathers for streamer tails." },
    // Other
    { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Round rubber legs for stonefly and attractor patterns." },
  ];

  const materials = await Promise.all(
    materialDefs.map((m) =>
      prisma.material.upsert({
        where: { name_type: { name: m.name, type: m.type } },
        update: {},
        create: m,
      })
    )
  );

  const mat = (name: string) => {
    const found = materials.find((m) => m.name === name);
    if (!found) throw new Error(`Material not found: ${name}`);
    return found;
  };

  // ─── Fly Patterns ────────────────────────────────────────────────────────────

  interface PatternDef {
    name: string;
    slug: string;
    category: FlyCategory;
    difficulty: Difficulty;
    waterType: WaterType;
    description: string;
    origin: string;
  }

  const patternDefs: PatternDef[] = [
    {
      name: "Woolly Bugger",
      slug: "woolly-bugger",
      category: FlyCategory.streamer,
      difficulty: Difficulty.beginner,
      waterType: WaterType.both,
      description: "The Woolly Bugger is one of the most versatile and effective fly patterns ever created. It can imitate leeches, baitfish, crayfish, large nymphs, and other aquatic food sources. Effective in virtually all water conditions, it is often the first fly a new tier learns to tie. Fish it with strips, dead drift, or swing it through runs.",
      origin: "Developed by Russell Blessing in 1967 in Pennsylvania, originally designed to imitate a Dobsonfly larva (hellgrammite).",
    },
    {
      name: "Adams",
      slug: "adams",
      category: FlyCategory.dry,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Adams is arguably the most popular dry fly pattern in the world. Its combination of grizzly and brown hackle creates a buggy silhouette that imitates a wide range of mayflies and other surface insects. It is a must-have pattern for any dry fly angler and works on trout streams worldwide.",
      origin: "Created by Leonard Halladay in 1922 in Michigan for his friend Charles Adams, who first fished it on the Boardman River.",
    },
    {
      name: "Pheasant Tail Nymph",
      slug: "pheasant-tail-nymph",
      category: FlyCategory.nymph,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Pheasant Tail Nymph (PT Nymph) is a staple nymph pattern that imitates a wide variety of mayfly nymphs. Its slim profile and natural coloring make it effective year-round. The copper wire rib adds flash and segmentation while reinforcing the delicate pheasant tail fibers. Dead drift this fly near the bottom in riffles and runs.",
      origin: "Created by Frank Sawyer, a river keeper on the River Avon in England, in the 1950s. Sawyer famously tied it without thread, using only copper wire.",
    },
    {
      name: "Elk Hair Caddis",
      slug: "elk-hair-caddis",
      category: FlyCategory.dry,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Elk Hair Caddis is the definitive caddisfly imitation and one of the most productive dry fly patterns for trout fishing. The palmered hackle and buoyant elk hair wing allow it to ride high in the water, even in fast currents. It effectively imitates adult caddisflies in a wide range of sizes and colors across most trout waters.",
      origin: "Created by Al Troth in 1957 in Dillon, Montana. It quickly became one of the most widely used dry fly patterns in the world.",
    },
    {
      name: "Clouser Minnow",
      slug: "clouser-minnow",
      category: FlyCategory.streamer,
      difficulty: Difficulty.beginner,
      waterType: WaterType.saltwater,
      description: "The Clouser Minnow is perhaps the most effective all-around fly ever designed. Created for smallmouth bass, it has proven deadly for virtually every predatory fish species in both fresh and salt water. The dumbbell eyes cause the fly to ride hook-point up, reducing snags, and create a distinctive jigging action.",
      origin: "Created by Bob Clouser in the late 1980s for smallmouth bass on the Susquehanna River in Pennsylvania.",
    },
    {
      name: "Gold Ribbed Hare's Ear",
      slug: "gold-ribbed-hares-ear",
      category: FlyCategory.nymph,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Gold Ribbed Hare's Ear is one of the most effective nymph patterns ever devised. Its rough, buggy profile imitates a wide range of mayfly nymphs. The guard hairs and rough dubbing create a lifelike appearance that suggests life even when dead-drifted. It is a must-have in any trout angler's fly box.",
      origin: "Created in England, one of the oldest fly patterns still in regular use. Dates back hundreds of years and remains one of the most universally productive nymph patterns worldwide.",
    },
    {
      name: "Prince Nymph",
      slug: "prince-nymph",
      category: FlyCategory.nymph,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Prince Nymph is a highly effective attractor nymph that does not closely imitate any single insect but suggests many. The combination of peacock herl body, white goose biot wings, and brown hackle creates a flashy, buggy profile that triggers aggressive strikes. It is one of the most popular nymphs in the western United States.",
      origin: "Created by Doug Prince in the 1940s, originally called the Brown Forked Tail. It was later popularized and renamed the Prince Nymph.",
    },
    {
      name: "Copper John",
      slug: "copper-john",
      category: FlyCategory.nymph,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Copper John is a heavily weighted attractor nymph that sinks quickly and has a flashy, segmented copper wire body. The combination of the epoxy-coated wing case, goose biot tail, and tungsten bead makes this fly both durable and effective. It is one of the most popular competition nymphing patterns worldwide.",
      origin: "Created by John Barr in the mid-1990s in Boulder, Colorado. It quickly became one of the best-selling commercial fly patterns in the United States.",
    },
    {
      name: "Zebra Midge",
      slug: "zebra-midge",
      category: FlyCategory.nymph,
      difficulty: Difficulty.beginner,
      waterType: WaterType.freshwater,
      description: "The Zebra Midge is a devastatingly simple and effective midge pupa imitation. With just thread, wire, and a bead, it is one of the easiest flies to tie yet consistently catches fish year-round. Midges are available in nearly every body of water, making this pattern indispensable for tailwater and stillwater fishing.",
      origin: "The exact origin is uncertain, but it became widely popular in the early 2000s among Colorado tailwater anglers. Its simplicity has led to countless variations.",
    },
    {
      name: "San Juan Worm",
      slug: "san-juan-worm",
      category: FlyCategory.nymph,
      difficulty: Difficulty.beginner,
      waterType: WaterType.freshwater,
      description: "The San Juan Worm is the simplest and most controversial fly in the box. Purists may scoff, but aquatic worms are a significant food source for trout, especially after rain events and high water. This pattern is tied in minutes and catches fish everywhere. It is an ideal confidence pattern for beginners learning to nymph.",
      origin: "Named after the San Juan River in New Mexico, where it became famous among tailwater anglers in the 1970s and 1980s.",
    },
    {
      name: "Royal Wulff",
      slug: "royal-wulff",
      category: FlyCategory.dry,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Royal Wulff is one of the most recognizable and effective attractor dry flies ever tied. Its combination of calf hair wings, peacock herl body with a red floss band, and stiff brown hackle creates a high-floating, visible fly that excels in fast, broken water. It does not imitate any specific insect but triggers strikes from opportunistic trout.",
      origin: "Created by Lee Wulff in the 1930s as a variation of the Royal Coachman, incorporating his signature hair-wing style designed for rough water visibility and durability.",
    },
    {
      name: "Griffith's Gnat",
      slug: "griffiths-gnat",
      category: FlyCategory.dry,
      difficulty: Difficulty.beginner,
      waterType: WaterType.freshwater,
      description: "The Griffith's Gnat is the go-to pattern for imitating midge clusters and individual adult midges on the surface. Its simplicity — just peacock herl and palmered grizzly hackle — belies its effectiveness. This tiny fly is essential for winter fishing and any time trout are sipping midges from the film.",
      origin: "Created by George Griffith, one of the founders of Trout Unlimited, in Michigan. It has become the standard midge dry fly pattern worldwide.",
    },
    {
      name: "Lefty's Deceiver",
      slug: "leftys-deceiver",
      category: FlyCategory.streamer,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.saltwater,
      description: "Lefty's Deceiver is one of the most important saltwater fly patterns ever created. Its design — saddle hackle tail with a bucktail collar — prevents fouling during casting while creating a lifelike baitfish silhouette. The pattern can be tied in any size and color combination to match local baitfish, making it effective worldwide for striped bass, bluefish, tarpon, and countless other species.",
      origin: "Created by Lefty Kreh in the late 1950s while fishing the Chesapeake Bay for striped bass. He designed it specifically to solve the problem of wing fouling on traditional streamer patterns.",
    },
    {
      name: "Muddler Minnow",
      slug: "muddler-minnow",
      category: FlyCategory.streamer,
      difficulty: Difficulty.advanced,
      waterType: WaterType.freshwater,
      description: "The Muddler Minnow is a revolutionary fly pattern that imitates sculpins, grasshoppers, and various baitfish depending on how it is fished. The spun and clipped deer hair head pushes water and creates a unique disturbance that attracts predatory fish. It can be fished dead-drifted on top, swung through runs, or stripped deep.",
      origin: "Created by Don Gapen in 1937 to imitate the sculpin (muddler) minnows found in the Nipigon River of Ontario, Canada. It has since become one of the most influential fly patterns in history.",
    },
    {
      name: "Parachute Adams",
      slug: "parachute-adams",
      category: FlyCategory.dry,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Parachute Adams is a modern evolution of the classic Adams dry fly with a horizontal hackle wrapped around a vertical post. This design allows the fly to sit lower in the surface film for a more realistic presentation while the white post provides excellent visibility for the angler. Many experienced anglers consider it even more effective than the original Adams.",
      origin: "An adaptation of the classic Adams pattern, applying the parachute hackle style that became popular in the mid-20th century. The white calf body hair post was a key innovation for both flotation and visibility.",
    },
    {
      name: "Blue-Winged Olive",
      slug: "blue-winged-olive",
      category: FlyCategory.dry,
      difficulty: Difficulty.intermediate,
      waterType: WaterType.freshwater,
      description: "The Blue-Winged Olive (BWO) is an essential dry fly pattern that imitates the Baetis mayfly, one of the most common and widespread mayfly genera in North America. BWO hatches occur throughout the year, often on overcast, drizzly days when other insects are absent. This makes the BWO pattern crucial for consistent dry fly fishing in all seasons.",
      origin: "Blue-Winged Olive patterns have evolved over many decades to match Baetis mayflies. Modern CDC-winged versions provide superior flotation and a more realistic silhouette than traditional hackled versions.",
    },
    {
      name: "Crazy Charlie",
      slug: "crazy-charlie",
      category: FlyCategory.saltwater,
      difficulty: Difficulty.beginner,
      waterType: WaterType.saltwater,
      description: "The Crazy Charlie is the quintessential bonefish fly and one of the most important patterns in saltwater fly fishing. Its simple design — bead chain eyes, a flash body, and a sparse wing — creates an effective shrimp or small crab imitation that rides hook-point up over sandy flats. It is easy to tie, casts well in wind, and has accounted for more bonefish than perhaps any other fly.",
      origin: "Created by Nasau guide Charlie Smith in the Bahamas in the 1970s. The pattern was popularized by Bob Nauheim, who named it after Charlie.",
    },
    {
      name: "Woolly Worm",
      slug: "woolly-worm",
      category: FlyCategory.nymph,
      difficulty: Difficulty.beginner,
      waterType: WaterType.both,
      description: "The Woolly Worm is one of the oldest and simplest fly patterns still in regular use. Predating the Woolly Bugger, it uses a palmered hackle over a chenille body without a marabou tail. It imitates caterpillars, large nymphs, and various aquatic creatures. Its simplicity makes it an excellent pattern for beginning fly tiers, and it remains surprisingly effective for trout, bass, and panfish.",
      origin: "The Woolly Worm dates back centuries in various forms. It is one of the most ancient fly patterns, with references to similar flies in angling literature going back to the 1600s.",
    },
  ];

  const patterns = await Promise.all(
    patternDefs.map((p) =>
      prisma.flyPattern.upsert({
        where: { slug: p.slug },
        update: {},
        create: p,
      })
    )
  );

  const pat = (slug: string) => {
    const found = patterns.find((p) => p.slug === slug);
    if (!found) throw new Error(`Pattern not found: ${slug}`);
    return found;
  };

  const woollyBugger = pat("woolly-bugger");
  const adams = pat("adams");
  const pheasantTailNymph = pat("pheasant-tail-nymph");
  const elkHairCaddis = pat("elk-hair-caddis");
  const clouserMinnow = pat("clouser-minnow");
  const goldRibbedHaresEar = pat("gold-ribbed-hares-ear");
  const princeNymph = pat("prince-nymph");
  const copperJohn = pat("copper-john");
  const zebraMidge = pat("zebra-midge");
  const sanJuanWorm = pat("san-juan-worm");
  const royalWulff = pat("royal-wulff");
  const griffithsGnat = pat("griffiths-gnat");
  const leftysDeceiver = pat("leftys-deceiver");
  const muddlerMinnow = pat("muddler-minnow");
  const parachuteAdams = pat("parachute-adams");
  const blueWingedOlive = pat("blue-winged-olive");
  const crazyCharlie = pat("crazy-charlie");
  const woollyWorm = pat("woolly-worm");

  // ─── Fly Pattern Materials (skip if pattern already has materials) ──────────

  async function seedPatternMaterials(
    patternId: string,
    mats: { materialName: string; customColor?: string; customSize?: string; required: boolean; position: number }[]
  ) {
    const existing = await prisma.flyPatternMaterial.count({ where: { flyPatternId: patternId } });
    if (existing > 0) return; // Already has materials — don't overwrite
    await prisma.flyPatternMaterial.createMany({
      data: mats.map((m) => ({
        flyPatternId: patternId,
        materialId: mat(m.materialName).id,
        customColor: m.customColor,
        customSize: m.customSize,
        required: m.required,
        position: m.position,
      })),
    });
  }

  await seedPatternMaterials(woollyBugger.id, [
    { materialName: "Mustad 9672 3XL Streamer Hook", customSize: "Size 6-10", required: true, position: 1 },
    { materialName: "Danville Flymaster Plus 140", customColor: "Black", required: true, position: 2 },
    { materialName: "Marabou Plume", customColor: "Black", required: true, position: 3 },
    { materialName: "Chenille (Medium)", customColor: "Black", required: true, position: 4 },
    { materialName: "Grizzly Saddle Hackle", customColor: "Black", required: true, position: 5 },
    { materialName: "Lead Wire (.015)", customSize: "10-15 wraps", required: false, position: 6 },
  ]);

  await seedPatternMaterials(adams.id, [
    { materialName: "Tiemco TMC 100 Dry Fly Hook", customSize: "Size 12-18", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Gray", required: true, position: 2 },
    { materialName: "Grizzly Hackle Fibers", required: true, position: 3 },
    { materialName: "Superfine Dubbing", customColor: "Adams Gray", required: true, position: 4 },
    { materialName: "Grizzly Rooster Hackle", required: true, position: 5 },
    { materialName: "Brown Rooster Hackle", required: true, position: 6 },
    { materialName: "Hen Hackle Tips", customColor: "Grizzly", required: true, position: 7 },
  ]);

  await seedPatternMaterials(pheasantTailNymph.id, [
    { materialName: "Tiemco TMC 3761 Nymph Hook", customSize: "Size 12-18", required: true, position: 1 },
    { materialName: "Fine Copper Wire", required: true, position: 2 },
    { materialName: "Pheasant Tail Fibers", required: true, position: 3 },
    { materialName: "Peacock Herl (Thorax)", required: true, position: 4 },
    { materialName: "Brass Bead", customColor: "Gold", customSize: "2.4mm - 3.2mm", required: false, position: 5 },
  ]);

  await seedPatternMaterials(elkHairCaddis.id, [
    { materialName: "Mustad 94840 Dry Fly Hook", customSize: "Size 12-18", required: true, position: 1 },
    { materialName: "Veevus 8/0 Thread", customColor: "Tan", required: true, position: 2 },
    { materialName: "Fine Gold Wire", required: true, position: 3 },
    { materialName: "Hare's Ear Dubbing", customColor: "Natural", required: true, position: 4 },
    { materialName: "Whiting Dry Fly Hackle", customColor: "Brown", required: true, position: 5 },
    { materialName: "Elk Hair (Wing)", customColor: "Natural", required: true, position: 6 },
  ]);

  await seedPatternMaterials(clouserMinnow.id, [
    { materialName: "Mustad 34007 Saltwater Hook", customSize: "Size 1/0-4", required: true, position: 1 },
    { materialName: "Danville Flat Waxed Nylon", customColor: "White", required: true, position: 2 },
    { materialName: "Bucktail", customColor: "White", required: true, position: 3 },
    { materialName: "Bucktail", customColor: "Chartreuse", required: true, position: 4 },
    { materialName: "Krystal Flash", customColor: "Pearl", required: true, position: 5 },
    { materialName: "Dumbbell Eyes (Lead)", customSize: "Medium", required: true, position: 6 },
  ]);

  await seedPatternMaterials(goldRibbedHaresEar.id, [
    { materialName: "Tiemco TMC 3761 Nymph Hook", customSize: "Size 10-16", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Brown", required: true, position: 2 },
    { materialName: "Goose Biots", customColor: "Natural", required: true, position: 3 },
    { materialName: "Hare's Ear Dubbing", customColor: "Natural", required: true, position: 4 },
    { materialName: "Fine Gold Wire", required: true, position: 5 },
    { materialName: "Hare's Ear Dubbing", customColor: "Dark (thorax)", required: true, position: 6 },
    { materialName: "Brass Bead", customColor: "Gold", customSize: "2.4mm - 3.2mm", required: false, position: 7 },
  ]);

  await seedPatternMaterials(princeNymph.id, [
    { materialName: "Tiemco TMC 3761 Nymph Hook", customSize: "Size 10-16", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Black", required: true, position: 2 },
    { materialName: "Goose Biots", customColor: "Brown", required: true, position: 3 },
    { materialName: "Peacock Herl", required: true, position: 4 },
    { materialName: "Gold Tinsel (Flat)", required: true, position: 5 },
    { materialName: "Brown Rooster Hackle", required: true, position: 6 },
    { materialName: "Goose Biots", customColor: "White", required: true, position: 7 },
    { materialName: "Brass Bead", customColor: "Gold", customSize: "2.4mm - 3.2mm", required: false, position: 8 },
  ]);

  await seedPatternMaterials(copperJohn.id, [
    { materialName: "Tiemco TMC 3761 Nymph Hook", customSize: "Size 12-18", required: true, position: 1 },
    { materialName: "UTC Ultra Thread 70", customColor: "Black", required: true, position: 2 },
    { materialName: "Goose Biots", customColor: "Brown", required: true, position: 3 },
    { materialName: "Copper Wire (Medium)", required: true, position: 4 },
    { materialName: "Peacock Herl (Thorax)", required: true, position: 5 },
    { materialName: "Tungsten Bead", customColor: "Copper", customSize: "2.4mm - 3.2mm", required: true, position: 6 },
  ]);

  await seedPatternMaterials(zebraMidge.id, [
    { materialName: "Dai-Riki 135 Scud/Midge Hook", customSize: "Size 16-22", required: true, position: 1 },
    { materialName: "UTC Ultra Thread 70", customColor: "Black", required: true, position: 2 },
    { materialName: "Fine Copper Wire", required: true, position: 3 },
    { materialName: "Tungsten Bead", customColor: "Silver", customSize: "1.5mm - 2.0mm", required: true, position: 4 },
  ]);

  await seedPatternMaterials(sanJuanWorm.id, [
    { materialName: "Dai-Riki 135 Scud/Midge Hook", customSize: "Size 10-14", required: true, position: 1 },
    { materialName: "UTC Ultra Thread 70", customColor: "Red", required: true, position: 2 },
    { materialName: "Ultra Chenille", customColor: "Red/Wine", required: true, position: 3 },
  ]);

  await seedPatternMaterials(royalWulff.id, [
    { materialName: "Tiemco TMC 100 Dry Fly Hook", customSize: "Size 10-16", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Black", required: true, position: 2 },
    { materialName: "Moose Body Hair", required: true, position: 3 },
    { materialName: "Peacock Herl", required: true, position: 4 },
    { materialName: "Red Floss", required: true, position: 5 },
    { materialName: "Calf Body Hair", customColor: "White", required: true, position: 6 },
    { materialName: "Brown Rooster Hackle", required: true, position: 7 },
  ]);

  await seedPatternMaterials(griffithsGnat.id, [
    { materialName: "Dai-Riki 135 Scud/Midge Hook", customSize: "Size 18-24", required: true, position: 1 },
    { materialName: "UTC Ultra Thread 70", customColor: "Black", required: true, position: 2 },
    { materialName: "Peacock Herl", required: true, position: 3 },
    { materialName: "Grizzly Rooster Hackle", required: true, position: 4 },
  ]);

  await seedPatternMaterials(leftysDeceiver.id, [
    { materialName: "Mustad 34007 Saltwater Hook", customSize: "Size 1/0-4", required: true, position: 1 },
    { materialName: "Danville Flat Waxed Nylon", customColor: "White", required: true, position: 2 },
    { materialName: "White Saddle Hackle", customColor: "White", required: true, position: 3 },
    { materialName: "Bucktail", customColor: "White", required: true, position: 4 },
    { materialName: "Flashabou", customColor: "Silver", required: true, position: 5 },
    { materialName: "Krystal Flash", customColor: "Pearl", required: false, position: 6 },
  ]);

  await seedPatternMaterials(muddlerMinnow.id, [
    { materialName: "Mustad 9672 3XL Streamer Hook", customSize: "Size 4-10", required: true, position: 1 },
    { materialName: "Danville Flat Waxed Nylon", customColor: "Brown", required: true, position: 2 },
    { materialName: "Gold Tinsel (Flat)", required: true, position: 3 },
    { materialName: "Turkey Quill Sections", customColor: "Mottled Brown", required: true, position: 4 },
    { materialName: "Deer Hair", customColor: "Natural", required: true, position: 5 },
  ]);

  await seedPatternMaterials(parachuteAdams.id, [
    { materialName: "Tiemco TMC 100 Dry Fly Hook", customSize: "Size 12-18", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Gray", required: true, position: 2 },
    { materialName: "Grizzly Hackle Fibers", required: true, position: 3 },
    { materialName: "Superfine Dubbing", customColor: "Adams Gray", required: true, position: 4 },
    { materialName: "Calf Body Hair", customColor: "White", required: true, position: 5 },
    { materialName: "Grizzly Rooster Hackle", required: true, position: 6 },
  ]);

  await seedPatternMaterials(blueWingedOlive.id, [
    { materialName: "Tiemco TMC 100 Dry Fly Hook", customSize: "Size 16-22", required: true, position: 1 },
    { materialName: "Veevus 8/0 Thread", customColor: "Olive", required: true, position: 2 },
    { materialName: "Microfibbetts", customColor: "Dun", required: true, position: 3 },
    { materialName: "Superfine Dubbing", customColor: "Olive", required: true, position: 4 },
    { materialName: "CDC Feathers", customColor: "Dun", required: true, position: 5 },
  ]);

  await seedPatternMaterials(crazyCharlie.id, [
    { materialName: "Mustad 34007 Saltwater Hook", customSize: "Size 4-8", required: true, position: 1 },
    { materialName: "Danville Flat Waxed Nylon", customColor: "Clear/White", required: true, position: 2 },
    { materialName: "Krystal Flash", customColor: "Pearl", required: true, position: 3 },
    { materialName: "EP Fiber", customColor: "Tan/White", required: true, position: 4 },
    { materialName: "Bead Chain Eyes", customSize: "Small-Medium", required: true, position: 5 },
  ]);

  await seedPatternMaterials(woollyWorm.id, [
    { materialName: "Mustad 9672 3XL Streamer Hook", customSize: "Size 6-12", required: true, position: 1 },
    { materialName: "Uni-Thread 6/0", customColor: "Black", required: true, position: 2 },
    { materialName: "Chenille (Medium)", customColor: "Black", required: true, position: 3 },
    { materialName: "Grizzly Saddle Hackle", required: true, position: 4 },
  ]);

  // ─── Material Substitutions (skip duplicates) ──────────────────────────────

  const subDefs = [
    { materialName: "Marabou Plume", substituteName: "Grizzly Saddle Hackle", type: SubstitutionType.aesthetic, notes: "Use a long grizzly saddle hackle for a different action profile in the water." },
    { materialName: "Chenille (Medium)", substituteName: "Peacock Herl", type: SubstitutionType.aesthetic, notes: "Peacock herl creates a slimmer, more iridescent body. Great for smaller Woolly Buggers." },
    { materialName: "Lead Wire (.015)", substituteName: "Tungsten Bead", type: SubstitutionType.equivalent, notes: "A tungsten bead adds weight at the head instead of along the body. Sinks faster with a jigging action." },
    { materialName: "Brass Bead", substituteName: "Tungsten Bead", type: SubstitutionType.equivalent, notes: "Tungsten is denser than brass and gets the fly down faster in deeper or faster water." },
    { materialName: "Superfine Dubbing", substituteName: "Hare's Ear Dubbing", type: SubstitutionType.aesthetic, notes: "Hare's ear dubbing creates a buggier profile with more texture. Slightly harder to dub tightly." },
    { materialName: "Grizzly Rooster Hackle", substituteName: "Whiting Dry Fly Hackle", type: SubstitutionType.budget, notes: "Whiting hackle is a premium alternative with excellent barb stiffness for flotation." },
    { materialName: "Pheasant Tail Fibers", substituteName: "Microfibbetts", type: SubstitutionType.availability, notes: "Microfibbetts can substitute for pheasant tail fibers in the tail. They are more durable but less natural looking." },
    { materialName: "Uni-Thread 6/0", substituteName: "Veevus 8/0 Thread", type: SubstitutionType.equivalent, notes: "Veevus 8/0 is finer and lays flatter, good for smaller flies." },
  ];

  for (const sub of subDefs) {
    const materialId = mat(sub.materialName).id;
    const substituteMaterialId = mat(sub.substituteName).id;
    const existing = await prisma.materialSubstitution.findFirst({
      where: { materialId, substituteMaterialId },
    });
    if (!existing) {
      await prisma.materialSubstitution.create({
        data: { materialId, substituteMaterialId, substitutionType: sub.type, notes: sub.notes },
      });
    }
  }

  // ─── Variations (skip if pattern already has variations) ───────────────────

  async function seedVariation(
    patternId: string,
    name: string,
    description: string,
    overrides: { originalName: string; replacementName: string }[]
  ) {
    const existing = await prisma.variation.findFirst({
      where: { flyPatternId: patternId, name },
    });
    if (existing) return;

    const variation = await prisma.variation.create({
      data: { flyPatternId: patternId, name, description },
    });

    if (overrides.length > 0) {
      await prisma.variationOverride.createMany({
        data: overrides.map((o) => ({
          variationId: variation.id,
          originalMaterialId: mat(o.originalName).id,
          replacementMaterialId: mat(o.replacementName).id,
        })),
      });
    }
  }

  await seedVariation(woollyBugger.id, "Olive Woolly Bugger",
    "Olive variant that excels for bass and trout. The olive coloring imitates damselfly nymphs and small baitfish in weedy waters.",
    [{ originalName: "Chenille (Medium)", replacementName: "Peacock Herl" }]
  );

  await seedVariation(adams.id, "Parachute Adams",
    "A modern adaptation with a parachute-style hackle wrapped horizontally around a post. Lands more naturally on the water and is easier to see for the angler.",
    [{ originalName: "Grizzly Rooster Hackle", replacementName: "Whiting Dry Fly Hackle" }]
  );

  await seedVariation(pheasantTailNymph.id, "Beadhead Pheasant Tail",
    "Adds a tungsten or brass bead at the head for extra weight. The most common modern variant, extremely effective for Euro-nymphing and indicator rigs.",
    [{ originalName: "Brass Bead", replacementName: "Tungsten Bead" }]
  );

  await seedVariation(elkHairCaddis.id, "X-Caddis (Trailing Shuck)",
    "Omits the hackle and adds a trailing Z-Lon shuck to imitate an emerging caddis. Very effective during caddis hatches when fish are keyed in on emergers.",
    []
  );

  // ─── Resources (skip if URL already exists for pattern) ────────────────────

  const resourceDefs = [
    { flyPatternId: woollyBugger.id, type: ResourceType.video, title: "How to Tie a Woolly Bugger — Beginner Tutorial", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-wb", qualityScore: 5 },
    { flyPatternId: woollyBugger.id, type: ResourceType.blog, title: "The Complete Guide to Woolly Buggers", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-woolly-bugger", qualityScore: 4 },
    { flyPatternId: adams.id, type: ResourceType.video, title: "Tying the Classic Adams Dry Fly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-adams", qualityScore: 5 },
    { flyPatternId: adams.id, type: ResourceType.blog, title: "Adams Fly History and Variations", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-adams", qualityScore: 4 },
    { flyPatternId: pheasantTailNymph.id, type: ResourceType.video, title: "Frank Sawyer's Pheasant Tail Nymph — Original Method", creatorName: "The Fly Fiend", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-ptn", qualityScore: 5 },
    { flyPatternId: pheasantTailNymph.id, type: ResourceType.pdf, title: "Pheasant Tail Nymph Step-by-Step Guide", creatorName: "Trout Unlimited", platform: "TU Resource Library", url: "https://www.tu.org/example-pt-guide.pdf", qualityScore: 3 },
    { flyPatternId: elkHairCaddis.id, type: ResourceType.video, title: "Elk Hair Caddis — Tips for Perfect Wings", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-ehc", qualityScore: 5 },
    { flyPatternId: elkHairCaddis.id, type: ResourceType.blog, title: "Why the Elk Hair Caddis is the Best Dry Fly", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-ehc", qualityScore: 4 },
    // Clouser Minnow
    { flyPatternId: clouserMinnow.id, type: ResourceType.video, title: "How to Tie the Clouser Minnow — The Fly That Catches Everything", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-clouser-minnow", qualityScore: 5 },
    { flyPatternId: clouserMinnow.id, type: ResourceType.blog, title: "Bob Clouser's Minnow: The Most Versatile Fly Ever Tied", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-clouser-minnow", qualityScore: 5 },
    // Gold Ribbed Hare's Ear
    { flyPatternId: goldRibbedHaresEar.id, type: ResourceType.video, title: "Gold Ribbed Hare's Ear Nymph — Classic and Beadhead Versions", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-gold-ribbed-hares-ear", qualityScore: 5 },
    { flyPatternId: goldRibbedHaresEar.id, type: ResourceType.blog, title: "The Essential Guide to Tying and Fishing the Hare's Ear Nymph", creatorName: "Pat Dorsey", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-gold-ribbed-hares-ear", qualityScore: 4 },
    // Prince Nymph
    { flyPatternId: princeNymph.id, type: ResourceType.video, title: "Tying the Beadhead Prince Nymph Step by Step", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-prince-nymph", qualityScore: 5 },
    { flyPatternId: princeNymph.id, type: ResourceType.blog, title: "Why the Prince Nymph Should Be in Every Fly Box", creatorName: "Lance Egan", platform: "Trout Unlimited", url: "https://www.tu.org/example-prince-nymph", qualityScore: 4 },
    // Copper John
    { flyPatternId: copperJohn.id, type: ResourceType.video, title: "John Barr's Copper John — Detailed Tying Tutorial", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-copper-john", qualityScore: 5 },
    { flyPatternId: copperJohn.id, type: ResourceType.blog, title: "The Copper John: A Modern Classic Nymph Pattern", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-copper-john", qualityScore: 5 },
    // Zebra Midge
    { flyPatternId: zebraMidge.id, type: ResourceType.video, title: "How to Tie a Zebra Midge in 2 Minutes", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-zebra-midge", qualityScore: 5 },
    { flyPatternId: zebraMidge.id, type: ResourceType.blog, title: "Zebra Midges: The Simple Fly That Saves the Day", creatorName: "Pat Dorsey", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-zebra-midge", qualityScore: 4 },
    // San Juan Worm
    { flyPatternId: sanJuanWorm.id, type: ResourceType.video, title: "San Juan Worm — The Easiest and Most Effective Fly to Tie", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-san-juan-worm", qualityScore: 4 },
    { flyPatternId: sanJuanWorm.id, type: ResourceType.blog, title: "In Defense of the San Juan Worm", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-san-juan-worm", qualityScore: 4 },
    // Royal Wulff
    { flyPatternId: royalWulff.id, type: ResourceType.video, title: "Tying the Royal Wulff — A Timeless Attractor Dry Fly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-royal-wulff", qualityScore: 5 },
    { flyPatternId: royalWulff.id, type: ResourceType.blog, title: "Lee Wulff's Royal Wulff: History and Technique", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-royal-wulff", qualityScore: 4 },
    // Griffith's Gnat
    { flyPatternId: griffithsGnat.id, type: ResourceType.video, title: "Griffith's Gnat — The Essential Midge Dry Fly", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-griffiths-gnat", qualityScore: 5 },
    { flyPatternId: griffithsGnat.id, type: ResourceType.blog, title: "Fishing the Griffith's Gnat During Midge Hatches", creatorName: "Pat Dorsey", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-griffiths-gnat", qualityScore: 4 },
    // Lefty's Deceiver
    { flyPatternId: leftysDeceiver.id, type: ResourceType.video, title: "How to Tie Lefty's Deceiver — Saltwater Essential", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-leftys-deceiver", qualityScore: 5 },
    { flyPatternId: leftysDeceiver.id, type: ResourceType.blog, title: "Lefty Kreh's Deceiver: The Fly That Changed Saltwater Fishing", creatorName: "Lefty Kreh", platform: "Saltwater Sportsman", url: "https://www.saltwatersportsman.com/example-leftys-deceiver", qualityScore: 5 },
    // Muddler Minnow
    { flyPatternId: muddlerMinnow.id, type: ResourceType.video, title: "Muddler Minnow Masterclass — Spinning Deer Hair", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-muddler-minnow", qualityScore: 5 },
    { flyPatternId: muddlerMinnow.id, type: ResourceType.blog, title: "The Muddler Minnow: Spinning Deer Hair for Beginners and Experts", creatorName: "Kelly Galloup", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-muddler-minnow", qualityScore: 5 },
    // Parachute Adams
    { flyPatternId: parachuteAdams.id, type: ResourceType.video, title: "Parachute Adams — The Perfect Dry Fly Tying Tutorial", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-parachute-adams", qualityScore: 5 },
    { flyPatternId: parachuteAdams.id, type: ResourceType.blog, title: "Mastering the Parachute Adams: Tips for a Better Fly", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-parachute-adams", qualityScore: 5 },
    // Blue-Winged Olive
    { flyPatternId: blueWingedOlive.id, type: ResourceType.video, title: "CDC Blue-Winged Olive — Simple and Deadly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-blue-winged-olive", qualityScore: 5 },
    { flyPatternId: blueWingedOlive.id, type: ResourceType.blog, title: "Fishing the BWO Hatch: Patterns and Strategies", creatorName: "Lance Egan", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-blue-winged-olive", qualityScore: 4 },
    // Crazy Charlie
    { flyPatternId: crazyCharlie.id, type: ResourceType.video, title: "Tying the Crazy Charlie — Bonefish Fly Essential", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-crazy-charlie", qualityScore: 5 },
    { flyPatternId: crazyCharlie.id, type: ResourceType.blog, title: "The Crazy Charlie: The Bonefish Fly That Started It All", creatorName: "Saltwater Sportsman", platform: "Saltwater Sportsman", url: "https://www.saltwatersportsman.com/example-crazy-charlie", qualityScore: 4 },
    // Woolly Worm
    { flyPatternId: woollyWorm.id, type: ResourceType.video, title: "Classic Woolly Worm — Perfect Beginner Fly Tying Pattern", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-woolly-worm", qualityScore: 4 },
    { flyPatternId: woollyWorm.id, type: ResourceType.blog, title: "The Woolly Worm: An Ancient Pattern That Still Catches Fish", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-woolly-worm", qualityScore: 3 },
  ];

  for (const res of resourceDefs) {
    const existing = await prisma.resource.findFirst({
      where: { flyPatternId: res.flyPatternId, url: res.url },
    });
    if (!existing) {
      await prisma.resource.create({ data: res });
    }
  }

  // ─── Affiliate Links (skip if URL already exists) ──────────────────────────

  const affiliateDefs = [
    { materialId: mat("Mustad 9672 3XL Streamer Hook").id, retailer: "J. Stockard", url: "https://www.jsflyfishing.com/example-mustad-9672", commissionType: CommissionType.percentage },
    { materialId: mat("Marabou Plume").id, retailer: "Fly Tyer's Dungeon", url: "https://www.flytyersdungeon.com/example-marabou", commissionType: CommissionType.percentage },
    { materialId: mat("Chenille (Medium)").id, retailer: "J. Stockard", url: "https://www.jsflyfishing.com/example-chenille", commissionType: CommissionType.percentage },
    { materialId: mat("Tiemco TMC 100 Dry Fly Hook").id, retailer: "Trident Fly Fishing", url: "https://www.tridentflyfishing.com/example-tmc100", commissionType: CommissionType.percentage },
    { materialId: mat("Grizzly Rooster Hackle").id, retailer: "Whiting Farms", url: "https://www.whitingfarms.com/example-grizzly", commissionType: CommissionType.flat },
    { materialId: mat("Pheasant Tail Fibers").id, retailer: "Feather-Craft", url: "https://www.feather-craft.com/example-pt-fibers", commissionType: CommissionType.percentage },
    { materialId: mat("Tungsten Bead").id, retailer: "Hareline Dubbin", url: "https://www.hareline.com/example-tungsten-bead", commissionType: CommissionType.percentage },
    { materialId: mat("Elk Hair (Wing)").id, retailer: "J. Stockard", url: "https://www.jsflyfishing.com/example-elk-hair", commissionType: CommissionType.percentage },
    { materialId: mat("Whiting Dry Fly Hackle").id, retailer: "Whiting Farms", url: "https://www.whitingfarms.com/example-dryfly", commissionType: CommissionType.flat },
    { materialId: mat("Hare's Ear Dubbing").id, retailer: "Wapsi Fly", url: "https://www.wapsifly.com/example-hares-ear", commissionType: CommissionType.percentage },
  ];

  for (const aff of affiliateDefs) {
    const existing = await prisma.affiliateLink.findFirst({
      where: { materialId: aff.materialId, url: aff.url },
    });
    if (!existing) {
      await prisma.affiliateLink.create({ data: aff });
    }
  }

  // ─── Tying Steps (skip if pattern already has steps) ───────────────────────

  async function seedTyingSteps(
    patternId: string,
    steps: { position: number; title: string; instruction: string; tip?: string }[]
  ) {
    const existing = await prisma.tyingStep.count({ where: { flyPatternId: patternId } });
    if (existing > 0) return;
    await prisma.tyingStep.createMany({
      data: steps.map((s) => ({ flyPatternId: patternId, ...s })),
    });
  }

  await seedTyingSteps(woollyBugger.id, [
    { position: 1, title: "Secure the hook and add weight", instruction: "Place the hook in the vise. If adding weight, wrap 10-15 turns of lead wire around the hook shank, starting behind the eye and stopping at the midpoint. Push the wraps toward the center of the shank.", tip: "Leave room behind the eye for the hackle tie-off and a neat head." },
    { position: 2, title: "Start the thread and tie in the tail", instruction: "Start your thread behind the eye and wrap back to the bend of the hook. Select a marabou plume about one shank length long. Tie it in at the bend, with the tips extending past the hook. Wrap forward over the butts to create a smooth underbody.", tip: "Wet your fingers and pinch the marabou to align the fibers before tying in. The tail should be roughly the same length as the hook shank." },
    { position: 3, title: "Tie in the hackle and chenille", instruction: "At the base of the tail, tie in a saddle hackle feather by the tip, with the shiny side facing you. Then tie in a piece of medium chenille at the same point.", tip: "Stripping a few fibers from the base of the hackle makes it easier to tie in and creates a neater look." },
    { position: 4, title: "Wrap the chenille body", instruction: "Advance your thread to just behind the eye. Wrap the chenille forward in touching turns, creating a full, even body. Tie off and trim the excess chenille behind the eye." },
    { position: 5, title: "Palmer the hackle", instruction: "Wrap the hackle feather forward in evenly spaced spiral turns (4-6 wraps) over the chenille body. Each wrap should be about the same distance apart. Tie off behind the eye and trim the excess hackle.", tip: "Wrap the hackle in the opposite direction from the chenille to prevent trapping fibers. Use your fingers to sweep the fibers back as you wrap." },
    { position: 6, title: "Build the head and finish", instruction: "Build a small, neat thread head. Whip finish with 3-4 wraps and trim the thread. Apply a drop of head cement to the thread wraps." },
  ]);

  await seedTyingSteps(adams.id, [
    { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start thread and wrap to the bend. Select 6-8 stiff grizzly hackle fibers and tie them in at the bend, splayed slightly. The tails should be about one hook shank length.", tip: "Split the tails by wrapping a small bump of thread and figure-eighting around the fibers." },
    { position: 2, title: "Dub the body", instruction: "Apply a thin amount of Adams gray dubbing to your thread. Wrap a slightly tapered body from the tail forward, stopping about 1/3 of the shank length behind the eye. The body should be slim and neat." },
    { position: 3, title: "Tie in and post the wings", instruction: "Select two matched grizzly hen hackle tips. Tie them in on top of the shank where the body ended, tips pointing upward. Post them upright with thread wraps at the base. Separate them into a V shape with figure-eight wraps.", tip: "The wings should be about one hook shank length tall." },
    { position: 4, title: "Tie in hackles", instruction: "Select one grizzly and one brown rooster hackle feather sized for the hook. Tie them in together just behind the wing with the shiny side facing you." },
    { position: 5, title: "Wrap the hackles and finish", instruction: "Wrap both hackles together (or one at a time) behind and in front of the wings, 2-3 turns each side. Tie off, trim excess, build a neat head, whip finish, and apply head cement.", tip: "Wrapping both hackles at the same time gives a more uniform appearance." },
  ]);

  await seedTyingSteps(pheasantTailNymph.id, [
    { position: 1, title: "Add bead and start wire", instruction: "Slide a brass or tungsten bead onto the hook, small hole first. Place hook in vise. Start copper wire at the bead and wrap back to the bend in smooth turns.", tip: "If using a beadhead variant, crush the barb first to make sliding the bead easier." },
    { position: 2, title: "Tie in tail and body fibers", instruction: "Select 4-6 pheasant tail fibers. Tie them in at the bend for the tail (about half a shank length). Do not trim — the butts will be used for the body." },
    { position: 3, title: "Wrap the body and rib", instruction: "Wrap the pheasant tail fibers forward to the 2/3 point of the shank, creating a slim abdomen. Secure with the wire. Counter-wrap the copper wire forward in 4-5 evenly spaced turns to rib and reinforce the body. Secure the wire and helicopter off the excess." },
    { position: 4, title: "Build the thorax", instruction: "Tie in 3-4 peacock herls at the 2/3 point. Twist them together into a rope and wrap a bulky thorax up to the bead. Tie off and trim.", tip: "Twisting the herls with the thread makes them much more durable." },
    { position: 5, title: "Finish behind the bead", instruction: "Whip finish behind the bead. Trim thread and apply a small drop of head cement." },
  ]);

  await seedTyingSteps(elkHairCaddis.id, [
    { position: 1, title: "Start thread and tie in ribbing", instruction: "Place hook in vise. Start thread at the eye and wrap back to the bend. Tie in fine gold wire for the rib." },
    { position: 2, title: "Dub the body", instruction: "Apply hare's ear dubbing to your thread. Dub a slightly tapered body from the bend to about 1/3 behind the eye. Keep it moderately shaggy for a buggy appearance." },
    { position: 3, title: "Tie in and palmer the hackle", instruction: "Tie in a brown hackle feather at the front of the body. Palmer it back toward the bend in evenly spaced turns. Secure with the gold wire by counter-wrapping forward. Trim excess wire.", tip: "Palmering the hackle from front to back and securing with wire makes it very durable." },
    { position: 4, title: "Add the elk hair wing", instruction: "Cut a small bunch of elk body hair. Clean out the underfur and even the tips in a hair stacker. Measure to the bend of the hook. Tie in on top of the shank with 2-3 pinch wraps, letting the thread torque distribute the hair around the shank.", tip: "Use just enough thread tension to flare the butts without spinning the hair. The wing should form a tent shape over the body." },
    { position: 5, title: "Trim butts and finish the head", instruction: "Trim the elk hair butts at an angle to form a neat, tapered head. Wrap thread over the trimmed butts to smooth them. Whip finish and apply head cement." },
  ]);

  await seedTyingSteps(clouserMinnow.id, [
    { position: 1, title: "Attach thread and tie in dumbbell eyes", instruction: "Place the hook in the vise with the point up (or point down — the eyes will flip it). Start thread about one-third of the shank length behind the eye. Tie in the dumbbell eyes on top of the shank using tight figure-eight wraps, then add several securing wraps underneath. Apply a drop of super glue to the thread wraps to lock the eyes in place.", tip: "The eyes should be far enough behind the hook eye to leave room for a neat head. Use about 20 firm figure-eight wraps for security." },
    { position: 2, title: "Tie in the bottom wing (white bucktail)", instruction: "Advance the thread to just behind the hook eye. Cut a sparse bunch of white bucktail, clean out the short hairs and underfur, and tie it in at the hook eye so it extends past the bend about one and a half to two shank lengths. Wrap back to the eyes, binding the bucktail firmly to the top of the shank.", tip: "Keep the bucktail sparse — a common beginner mistake is using too much hair. You should be able to see light through the wing." },
    { position: 3, title: "Add flash material", instruction: "Select 6-8 strands of Krystal Flash. Tie them in on top of the white bucktail, just behind the dumbbell eyes. The flash should extend slightly past the bucktail, then fold the butt ends back and secure them so the flash flanks both sides of the wing.", tip: "Fold the Krystal Flash over the thread to get flash on both sides with a single tie-in. Trim so the flash is just slightly longer than the bucktail." },
    { position: 4, title: "Tie in the top wing (chartreuse bucktail)", instruction: "Rotate the fly so the hook point is up (or flip the hook in the vise). Cut a similar-sized bunch of chartreuse bucktail. Tie it in behind the dumbbell eyes so it sits on top of the flash and white bucktail. The chartreuse hair should be roughly the same length as the white hair.", tip: "When fishing, the fly inverts so the chartreuse rides on top — this mimics a dark-over-light baitfish color pattern." },
    { position: 5, title: "Build the head and finish", instruction: "Wrap a smooth, tapered thread head between the dumbbell eyes and the hook eye, covering all material butts. Whip finish just behind the hook eye and apply head cement or UV resin over the entire thread head and around the dumbbell eye wraps for maximum durability." },
  ]);

  await seedTyingSteps(goldRibbedHaresEar.id, [
    { position: 1, title: "Add bead and start thread", instruction: "If tying the beadhead version, slide a brass bead onto the hook small hole first. Place the hook in the vise. Start the thread behind the bead (or behind the eye for the unweighted version) and wrap back to the bend.", tip: "Crush the barb before adding the bead to make it slide on easily." },
    { position: 2, title: "Tie in tail and ribbing wire", instruction: "At the hook bend, tie in a small bunch of guard hairs from the hare's ear mask for the tail, about half a shank length long. At the same point, tie in a length of fine gold wire for the ribbing.", tip: "You can also use goose biots for the tail for a cleaner look. The original pattern uses hare's ear guard hairs for a buggier appearance." },
    { position: 3, title: "Dub the abdomen", instruction: "Apply hare's ear dubbing to your thread — use the softer underfur mixed with a few guard hairs. Dub a slightly tapered abdomen from the tail forward to the midpoint of the shank. The dubbing should be somewhat rough and uneven.", tip: "A dubbing loop with hare's ear fur creates the buggiest, most effective body. Do not overdub — a slightly rough, translucent body is the goal." },
    { position: 4, title: "Rib the abdomen", instruction: "Counter-wrap the gold wire forward in 4-5 evenly spaced turns over the dubbed abdomen. Secure the wire and helicopter off the excess. The ribbing adds segmentation and reinforces the delicate dubbing.", tip: "Counter-wrapping (wrapping the wire in the opposite direction from the dubbing) dramatically increases durability." },
    { position: 5, title: "Dub the thorax", instruction: "Switch to a slightly darker, more heavily-guarded hare's ear dubbing for the thorax. Dub a bulky thorax from the midpoint up to the bead or eye area. Pick out guard hairs from the thorax with a dubbing needle or velcro to create legs and a buggy silhouette.", tip: "The thorax should be noticeably bulkier than the abdomen. Picked-out guard hairs serve as legs and add a tremendous amount of lifelike movement." },
    { position: 6, title: "Finish the fly", instruction: "Whip finish behind the bead (or build a small thread head and whip finish). Trim the thread and apply a small drop of head cement. Use a dubbing brush or piece of velcro to pick out additional fibers from the thorax area." },
  ]);

  await seedTyingSteps(princeNymph.id, [
    { position: 1, title: "Add bead and start thread", instruction: "Slide a brass or tungsten bead onto the hook. Place the hook in the vise. Start thread behind the bead and wrap to the bend of the hook.", tip: "A gold brass bead is traditional, but copper and black tungsten are popular modern variations." },
    { position: 2, title: "Tie in the goose biot tail", instruction: "Select two brown goose biots. Tie them in at the bend so they splay outward in a V shape, extending about half a shank length past the bend. The curved sides should face out to create the forked tail.", tip: "Goose biots can be tricky. Tie in one at a time on each side of the shank and use figure-eight wraps to keep them separated." },
    { position: 3, title: "Tie in rib and wrap the body", instruction: "Tie in a piece of flat gold tinsel at the tail. Then tie in 3-4 peacock herls by their tips. Twist the herls together into a rope (or twist with the thread for extra durability) and wrap a full, iridescent body forward to behind the bead. Secure and trim.", tip: "Twisting peacock herl with the thread creates a much more durable herl rope that will not unravel if a fiber breaks." },
    { position: 4, title: "Rib the body and add hackle", instruction: "Counter-wrap the flat gold tinsel forward in 4-5 evenly spaced turns to create the rib. Secure and trim. Tie in a brown rooster hackle feather and wrap 2-3 turns as a collar behind the bead. Sweep the fibers back and secure.", tip: "The hackle should be sparse — just enough to suggest legs. Too much hackle hides the beautiful peacock body." },
    { position: 5, title: "Tie in white biot wings", instruction: "Select two white goose biots. Tie them in on top of the shank behind the bead so they sweep back over the body in a V shape, extending to about the midpoint of the body. They should flare outward at roughly a 45-degree angle.", tip: "The white biot wings are the signature feature of the Prince Nymph. Make sure they are secure and evenly splayed." },
    { position: 6, title: "Finish the fly", instruction: "Build a neat thread collar behind the bead, covering all material tie-in points. Whip finish and trim. Apply a drop of head cement to the thread wraps behind the bead." },
  ]);

  await seedTyingSteps(copperJohn.id, [
    { position: 1, title: "Add bead, weight, and start thread", instruction: "Slide a tungsten bead onto the hook small hole first. Optionally add 6-8 wraps of lead wire behind the bead and push it into the bead recess. Start thread behind the lead wraps and build a smooth thread base back to the bend.", tip: "The tungsten bead provides most of the weight. Additional lead wire is optional and depends on the water depth you are targeting." },
    { position: 2, title: "Tie in the goose biot tail", instruction: "Select two brown goose biots. Tie them in at the bend so they splay in a V shape, extending about half a shank length past the bend. Secure with firm thread wraps and trim the butts.", tip: "Use a small ball of thread at the tie-in point to help splay the biots apart." },
    { position: 3, title: "Wrap the copper wire body", instruction: "Tie in a length of medium copper wire at the tail. Wrap the wire forward in tight, touching turns to create a smooth, segmented body. Stop at the two-thirds point of the shank. Secure the wire with thread and trim.", tip: "Keep the wire wraps tight and even with no gaps. A smooth underbody of thread helps the wire lay flat." },
    { position: 4, title: "Create the wing case and thorax", instruction: "Tie in a thin strip of Thin Skin or a folded piece of Flashabou over the top of the thorax area. Tie in 3-4 peacock herls and wrap a bulky thorax from the wire body up to behind the bead. Pull the wing case material over the top of the thorax and secure behind the bead. Trim the excess.", tip: "Coating the wing case with a thin layer of UV resin after completing the fly makes it nearly indestructible." },
    { position: 5, title: "Add legs and finish", instruction: "Tie in a few fibers of brown goose biot or rubber legs on each side of the thorax to suggest legs. Build a neat thread head behind the bead. Whip finish and trim. Apply head cement to the thread wraps and optionally coat the wing case with UV resin.", tip: "The legs should angle back and slightly downward. Keep them sparse — just 2-3 fibers per side." },
  ]);

  await seedTyingSteps(zebraMidge.id, [
    { position: 1, title: "Add bead and start thread", instruction: "Slide a small tungsten bead onto the hook small hole first. Place the hook in the vise. Start thread directly behind the bead and make a few wraps to secure.", tip: "Use a silver or nickel bead for the classic Zebra Midge. Black and copper beads are also effective alternatives." },
    { position: 2, title: "Build the thread body", instruction: "Wrap the thread in smooth, touching turns all the way back to the bend of the hook, then wrap forward again to create a smooth, slightly tapered thread body. The body should be very slim and even.", tip: "Two layers of thread are usually enough. The key is a smooth, even body that the wire rib will stand out against." },
    { position: 3, title: "Tie in and wrap the wire rib", instruction: "At the bend of the hook, tie in a length of fine copper wire. Wrap the thread forward to behind the bead. Now wrap the wire forward in evenly spaced spiral turns (5-7 wraps) to create the distinctive zebra striping. Secure behind the bead and helicopter off the excess wire.", tip: "Consistent spacing of the wire wraps is what makes this fly look right. Aim for even gaps between each wrap." },
    { position: 4, title: "Finish the fly", instruction: "Build a tiny thread collar behind the bead to cover the wire tie-off. Whip finish behind the bead and trim the thread. Apply a very small drop of head cement to the thread wraps. Optionally, coat the entire body with a thin layer of UV resin for extra durability and a slight sheen.", tip: "The Zebra Midge should be very slim and clean. Resist the urge to add bulk — simplicity is this fly's greatest strength." },
  ]);

  await seedTyingSteps(sanJuanWorm.id, [
    { position: 1, title: "Start thread and prepare the hook", instruction: "Place the hook in the vise. Start the thread at the midpoint of the hook shank and make a small thread bump. This bump will help hold the chenille in place.", tip: "Some tiers prefer to add a tiny drop of super glue on the thread bump for extra security." },
    { position: 2, title: "Tie in the chenille", instruction: "Cut a 3-inch piece of ultra chenille. Lay it on top of the hook shank centered on the thread bump so equal lengths extend past each side. Secure it with tight cross wraps and figure-eight wraps over the chenille at the midpoint. The chenille should be firmly locked in place.", tip: "Wetting the chenille slightly and singeing the ends with a lighter creates a natural tapered look and prevents fraying." },
    { position: 3, title: "Secure and shape", instruction: "Make several more tight wraps over the tie-in point, then whip finish. Trim the thread. Apply a small drop of super glue or head cement to the thread wraps. Trim each end of the chenille to approximately 1 to 1.5 inches, depending on the hook size.", tip: "Taper the cut ends by cutting at an angle. Some tiers hold a lighter near the ends briefly to create a natural taper — but be careful not to melt too much." },
    { position: 4, title: "Final adjustments", instruction: "Gently curve the chenille ends by pulling them between your fingernails to give the worm a natural bend. The finished worm should have a slight curve and look alive in the water, not stiff and straight.", tip: "Fish the San Juan Worm under an indicator or as a dropper behind a larger nymph. It is especially deadly during high water or after rain when worms wash into the stream." },
  ]);

  await seedTyingSteps(royalWulff.id, [
    { position: 1, title: "Start thread and tie in the tail", instruction: "Place the hook in the vise. Start thread behind the eye and wrap to the bend. Select a small bundle of moose body hair, align the tips, and tie it in at the bend. The tail should be about one shank length and slightly splayed.", tip: "Moose body hair is stiff and durable — ideal for tails on rough-water dry flies. A small thread bump at the base helps splay the fibers." },
    { position: 2, title: "Build the body — rear peacock section", instruction: "Tie in 3-4 peacock herls at the base of the tail. Wrap them forward to create the rear third of the body. Secure with thread and trim the excess.", tip: "Twist the herl into a rope with the thread for much greater durability." },
    { position: 3, title: "Add the red floss band", instruction: "Tie in a piece of red floss where the peacock herl ended. Wrap a smooth band of red floss for the middle third of the body. The red band should be clean and bright against the iridescent peacock. Secure and trim the floss.", tip: "Single-strand floss lays flatter and creates a smoother band. Avoid building up too many layers — one or two smooth layers is ideal." },
    { position: 4, title: "Complete the front body and tie in wings", instruction: "Tie in more peacock herl and wrap the front third of the body. Secure and trim. Then cut a bundle of white calf body hair, clean and stack it, and tie it in on top of the shank. Post the wing upright with thread wraps at the base and divide into two wings with figure-eight wraps.", tip: "Calf body hair is easier to work with than calf tail and flares less. The wings should be about one shank length tall." },
    { position: 5, title: "Tie in and wrap the hackle", instruction: "Select a brown rooster hackle feather sized for the hook gap. Tie it in just behind the wings. Wrap 2-3 turns behind the wings and 2-3 turns in front, creating a dense hackle collar that supports the fly on the water. Secure, trim the excess hackle.", tip: "For extra rough-water buoyancy, you can use two hackle feathers — one brown and one grizzly — wound together." },
    { position: 6, title: "Build the head and finish", instruction: "Build a small, neat thread head. Whip finish with 3-4 turns and trim the thread. Apply head cement to the thread wraps. The finished fly should sit upright on a flat surface, supported by the stiff hackle and tail." },
  ]);

  await seedTyingSteps(griffithsGnat.id, [
    { position: 1, title: "Start thread and tie in hackle", instruction: "Place the hook in the vise. Start thread behind the eye and wrap to the bend. At the bend, tie in a grizzly rooster hackle feather by the butt end, with the shiny side facing forward.", tip: "Select a hackle feather that is slightly oversized for the hook. The palmered wraps will be trimmed or spaced out, so slightly longer barbs work well." },
    { position: 2, title: "Tie in and wrap the peacock herl body", instruction: "At the bend, tie in 2-3 peacock herls by their tips. Twist them into a rope with the thread for durability. Wrap the herl rope forward in touching turns to create a full, iridescent body, stopping just behind the eye. Secure and trim the excess herl.", tip: "On very small hooks (size 20+), a single herl is sufficient. The body should be slightly thicker than the thread alone but not bulky." },
    { position: 3, title: "Palmer the hackle forward", instruction: "Wrap the grizzly hackle forward over the peacock body in 4-6 evenly spaced spiral turns. Each turn should be about the same distance apart. Secure the hackle behind the eye and trim the excess tip.", tip: "Palmer with open spirals — the hackle should not be dense. The barred pattern of grizzly hackle over iridescent peacock is what makes this fly so effective." },
    { position: 4, title: "Finish the fly", instruction: "Build a very small, neat thread head. Whip finish with 2-3 turns and trim the thread. Apply a tiny drop of head cement. The finished fly should be very small and sparse — resist the urge to overdress it.", tip: "The Griffith's Gnat is meant to sit in the surface film, not ride high above it. A light application of floatant on the hackle tips only is ideal." },
  ]);

  await seedTyingSteps(leftysDeceiver.id, [
    { position: 1, title: "Start thread and tie in the tail", instruction: "Place the hook in the vise. Start thread at the bend of the hook. Select 4-6 white saddle hackle feathers and arrange them so the curves match — two or three per side, curving outward. Tie them in at the bend, extending 1.5 to 2 shank lengths past the hook. The feathers should splay slightly outward.", tip: "Use matched pairs of feathers for each side. The slight outward splay prevents the tail from fouling around the hook bend during casting." },
    { position: 2, title: "Add flash to the tail", instruction: "Tie in 6-10 strands of Flashabou along the sides of the saddle hackle tail. The flash should be roughly the same length as the hackle feathers or just slightly shorter. Advance the thread forward to behind the eye, binding down all material butts to create a smooth underbody.", tip: "You can also add a few strands of Krystal Flash for additional sparkle. Mix the flash so it is distributed on both sides of the fly." },
    { position: 3, title: "Build the bucktail collar", instruction: "At the front of the hook, tie in a sparse bunch of white bucktail on the far side, then the near side, and on top and bottom if desired. The bucktail should surround the shank and extend back to meet the saddle hackle tail. Each bunch should be tied in separately with firm pinch wraps.", tip: "Build the collar in stages — tying in small bunches around the shank creates a more even profile than one large bunch. Keep it sparse." },
    { position: 4, title: "Add topping and lateral flash", instruction: "If desired, tie in a small bunch of colored bucktail (olive, blue, or chartreuse) on top as a topping to create a dark back. Add additional strands of Flashabou or Krystal Flash along the sides. The overall profile should be a minnow shape — slim and tapered.", tip: "The classic white Deceiver is effective everywhere, but adding a darker topping creates a more realistic baitfish profile with a dark back and light belly." },
    { position: 5, title: "Build the head and finish", instruction: "Wrap a smooth, tapered thread head that covers all material butts. Build up the head to create a slightly bulky baitfish-shaped profile. Whip finish and apply several coats of head cement or UV resin. Add stick-on prismatic eyes to the sides of the head if desired, and coat with an additional layer of resin to lock them in place.", tip: "A well-shaped head is critical to the Deceiver's swimming action. Apply head cement in multiple thin coats rather than one thick coat for the best finish." },
  ]);

  await seedTyingSteps(muddlerMinnow.id, [
    { position: 1, title: "Start thread and build the tail", instruction: "Place the hook in the vise. Start thread at the midpoint of the shank and wrap to the bend. Cut a small slip of matched turkey wing quill and tie it in at the bend as the tail. The tail should be about half a shank length.", tip: "Use matched sections from left and right turkey wing quills for a symmetrical tail. Coat the quill slip with thin head cement before tying in to prevent splitting." },
    { position: 2, title: "Build the tinsel body", instruction: "Tie in flat gold tinsel at the bend. Wrap the thread forward to the midpoint of the shank. Wrap the tinsel forward in tight, overlapping turns to create a smooth, bright gold body. Secure at the midpoint and trim the excess.", tip: "Overlap each turn of tinsel by about half the width for a smooth, gap-free body. Handle the tinsel by the edges to avoid kinking." },
    { position: 3, title: "Tie in the turkey quill wing", instruction: "Cut matched sections from left and right turkey wing quills. Place them together, tent-style, over the body with the tips extending to the end of the tail. Tie them in at the midpoint with firm pinch wraps. The wing should sit neatly on top of the body.", tip: "This is the trickiest part of the fly. Apply a thin coat of head cement to the quill sections before tying them in to reinforce them against splitting." },
    { position: 4, title: "Spin the deer hair collar", instruction: "Cut a small pencil-sized bunch of deer body hair. Remove the underfur and short hairs. Hold the bunch on top of the shank and make two loose wraps, then tighten the thread to allow the hair to flare and spin around the shank. Make several tight wraps through the base of the spun hair. Push the hair back with your fingers and advance the thread. Repeat 2-3 more times to build up the head.", tip: "This is an advanced technique. Use flat waxed thread for maximum flaring power. Each successive bunch should be pushed tightly against the previous one. Switch to Danville Flat Waxed Nylon if you are not already using it." },
    { position: 5, title: "Shape the deer hair head", instruction: "Remove the fly from the vise. Using a sharp razor blade or deer hair trimming scissors, trim the deer hair head into a rounded, sculpin-like shape. The bottom should be trimmed close to the shank while the top and sides are left fuller. Trim to a slight wedge shape from the side profile.", tip: "Trim a little at a time — you can always cut more but cannot put it back. Leave some of the collar fibers untrimmed around the wing to blend the head into the body." },
    { position: 6, title: "Finish the fly", instruction: "Place the fly back in the vise. Whip finish at the eye. Apply head cement to the thread wraps at the eye. Check that the wing and tail are aligned and the deer hair head is symmetrical.", tip: "The Muddler Minnow is one of the most challenging patterns to tie well. Do not be discouraged if your first attempts are rough — the fish do not care about perfection, and the pattern fishes well even with an imperfect head." },
  ]);

  await seedTyingSteps(parachuteAdams.id, [
    { position: 1, title: "Start thread and tie in the post", instruction: "Place hook in vise. Start thread behind the eye and wrap to the midpoint of the shank. Cut a small bunch of white calf body hair, clean and stack it, and tie it in on top of the shank with the tips pointing upward. Post the wing by wrapping thread around the base, building a smooth post that stands vertically. The post should be about one shank length tall.", tip: "Wrap the thread up the post about 5-6 turns and then back down to create a solid, upright post. This also provides a base for wrapping the hackle later." },
    { position: 2, title: "Tie in the tail", instruction: "Wrap the thread back to the bend of the hook. Select a small bunch of grizzly hackle fibers (or mixed grizzly and brown). Tie them in at the bend for the tail, about one shank length long. The tail should be splayed slightly for stability on the water.", tip: "A micro-split tail (separated into two groups with a thread wrap) provides better flotation and a more realistic footprint on the water." },
    { position: 3, title: "Dub the body", instruction: "Apply Adams gray superfine dubbing to your thread in a thin, even noodle. Dub a slightly tapered body from the tail forward to just behind the wing post. The body should be slim and neat.", tip: "Less dubbing is more. A thin body is more realistic and allows the parachute hackle to do the flotation work." },
    { position: 4, title: "Tie in and wrap the parachute hackle", instruction: "Select a grizzly rooster hackle feather sized so the barbs are about 1.5 times the hook gap. Tie it in at the base of the wing post with the shiny side facing up. Wrap the hackle horizontally around the base of the post — 3-5 turns — working downward from the top of the post. Secure the hackle tip with your thread below the hackle wraps.", tip: "Wrapping the parachute hackle from top to bottom keeps each successive wrap below the previous one, creating a neat, layered effect. Use hackle pliers and keep tension consistent." },
    { position: 5, title: "Finish the fly", instruction: "Trim the excess hackle tip. Build a small, clean thread head between the hackle and the hook eye. Whip finish and trim the thread. Apply a drop of head cement to the thread head only — avoid getting cement on the hackle barbs.", tip: "The Parachute Adams should land on the water with the hackle forming a flat disc on the surface and the body hanging below. Test it by placing it on a dark surface to check the footprint." },
  ]);

  await seedTyingSteps(blueWingedOlive.id, [
    { position: 1, title: "Start thread and tie in the tail", instruction: "Place the hook in the vise. Start thread behind the eye and wrap to the bend. Select 4-6 Microfibbetts in dun color and tie them in at the bend, splitting them into two groups to create a forked tail about one shank length long.", tip: "Microfibbetts provide excellent support on the water surface. Split them with figure-eight wraps and a small thread bump between the groups." },
    { position: 2, title: "Dub the body", instruction: "Apply a very thin layer of olive superfine dubbing to your thread. Dub a slim, slightly tapered body from the tail forward to about two-thirds of the way up the shank. The body should be very thin — BWOs are delicate insects.", tip: "On small hooks (size 18-22), the thread color alone can serve as part of the body. Keep the dubbing extremely sparse." },
    { position: 3, title: "Tie in the CDC wing", instruction: "Select 2-3 CDC feathers in dun or gray. Stack them together and tie them in on top of the shank at the two-thirds point with the tips extending upward and slightly back. Post them semi-upright with a few thread wraps at the base. Trim the butts.", tip: "Do not handle CDC feathers with greasy fingers — the natural oils on the feathers are what provide flotation. Use hackle pliers or tweezers to position them." },
    { position: 4, title: "Dub the thorax", instruction: "Apply slightly more olive dubbing to the thread and create a small, fuller thorax area around the base of the CDC wing, filling in from behind the wing to just behind the eye. The thorax should be only slightly bulkier than the abdomen.", tip: "Figure-eight the dubbing around and through the base of the CDC wing to lock it upright and create a realistic thorax profile." },
    { position: 5, title: "Finish the fly", instruction: "Build a very small, neat thread head. Whip finish with 2-3 turns and trim the thread. Apply a minimal drop of head cement to the thread head only. The finished fly should be slim, sparse, and delicate — matching the natural Baetis mayfly.", tip: "CDC dry flies should not be treated with standard silicone floatant, which mats the fibers. Use a CDC-specific desiccant powder to dry and re-fluff the feathers between fish." },
  ]);

  await seedTyingSteps(crazyCharlie.id, [
    { position: 1, title: "Attach thread and tie in bead chain eyes", instruction: "Place the hook in the vise. Start thread about one-quarter of the shank length behind the eye. Tie in the bead chain eyes on top of the shank using firm figure-eight wraps. The eyes should be positioned well behind the eye to leave room for the wing and a neat head.", tip: "Bead chain eyes are lighter than lead dumbbells, giving a slower sink rate ideal for shallow flats. Use silver or gold bead chain to match local conditions." },
    { position: 2, title: "Tie in the tail and body material", instruction: "Wrap thread back to the bend. Tie in 6-8 strands of pearl Krystal Flash at the bend for a short tail extending about half a shank length past the bend. Do not trim the Krystal Flash — it will be used to create the body.", tip: "The Krystal Flash tail and body create a translucent, shimmery profile that imitates the semi-transparent body of a glass minnow or small shrimp." },
    { position: 3, title: "Wrap the body", instruction: "Advance the thread to just behind the bead chain eyes. Wrap the Krystal Flash strands forward in tight, smooth turns to create a slim, sparkling body. Secure behind the bead chain eyes and trim any excess.", tip: "Keep the body slim and even. You can also wrap the Krystal Flash in a dubbing-loop style for a more segmented look." },
    { position: 4, title: "Tie in the wing", instruction: "Cut a small, sparse bunch of EP Fiber or calf body hair in tan or white. Tie it in just behind the bead chain eyes so it extends back over the body to roughly the end of the tail. The wing should be sparse and should not extend much past the tail.", tip: "The Crazy Charlie rides hook-point up, so tie the wing on the side of the hook that will be on top when inverted. Less is more with the wing — keep it sparse." },
    { position: 5, title: "Finish the fly", instruction: "Build a smooth thread head between the bead chain eyes and the hook eye, covering all material butts. Whip finish just behind the hook eye and trim the thread. Apply head cement or UV resin to the thread head and around the bead chain eye wraps for durability.", tip: "Crazy Charlies should be tied in several color variations — pink, tan, white, chartreuse — to match different bottom conditions on the flats." },
  ]);

  await seedTyingSteps(woollyWorm.id, [
    { position: 1, title: "Start thread and tie in the hackle", instruction: "Place the hook in the vise. Start thread behind the eye and wrap to the bend. At the bend, tie in a grizzly saddle hackle feather by the tip, with the shiny side facing you.", tip: "Select a hackle feather with barbs about 1.5 times the hook gap for a full, buggy look." },
    { position: 2, title: "Tie in the chenille", instruction: "At the same tie-in point at the bend, tie in a piece of medium black chenille. Strip away a small section of the chenille fuzz at the tie-in end to expose the core thread, which makes it easier to tie in without bulk.", tip: "Stripping the fuzz from the tie-in end prevents bulk at the tail area and creates a cleaner start to the body." },
    { position: 3, title: "Wrap the chenille body", instruction: "Advance the thread to just behind the eye. Wrap the chenille forward in tight, touching turns to create a full, even body. Tie off behind the eye and trim the excess chenille.", tip: "Leave enough room behind the eye for the hackle tie-off and a neat thread head — about two eye-widths of space." },
    { position: 4, title: "Palmer the hackle", instruction: "Wrap the hackle forward over the chenille body in evenly spaced spiral turns, about 5-7 wraps depending on the hook size. Tie off behind the eye and trim the excess hackle.", tip: "Wrap the hackle in the opposite direction from the chenille wraps to avoid trapping barbs. Use your fingers to sweep the fibers back after each turn." },
    { position: 5, title: "Build the head and finish", instruction: "Build a small, neat thread head. Whip finish with 3-4 turns and trim the thread. Apply head cement to the thread wraps.", tip: "The Woolly Worm is one of the most forgiving patterns for beginners. Focus on even spacing of the hackle wraps and a full chenille body — those two things make the biggest difference in the finished fly." },
  ]);

  // ─── Tying Challenge (skip if one already exists for this month) ───────────

  const now = new Date();
  const existingChallenge = await prisma.tyingChallenge.findUnique({
    where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
  });
  if (!existingChallenge) {
    await prisma.tyingChallenge.create({
      data: {
        title: "Woolly Bugger Challenge",
        description: "The classic Woolly Bugger is the ultimate beginner pattern. Tie your best one — any color variation — and share it! Bonus points for creative color combos.",
        flyPatternId: woollyBugger.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        active: true,
      },
    });
  }

  // ─── Forum Categories (skipDuplicates handles uniqueness) ──────────────────

  await prisma.forumCategory.createMany({
    skipDuplicates: true,
    data: [
      { name: "General Discussion", slug: "general", description: "Chat about anything fly fishing or fly tying related.", sortOrder: 1 },
      { name: "Pattern Help", slug: "pattern-help", description: "Need help with a specific pattern? Ask here.", sortOrder: 2 },
      { name: "Materials & Tools", slug: "materials-tools", description: "Discuss materials, tools, and equipment.", sortOrder: 3 },
      { name: "Show & Tell", slug: "show-and-tell", description: "Share photos of your tied flies!", sortOrder: 4 },
      { name: "Fishing Reports", slug: "fishing-reports", description: "Share what's working on the water.", sortOrder: 5 },
      { name: "Gear Reviews", slug: "gear-reviews", description: "Review and discuss rods, reels, waders, vises, and other gear.", sortOrder: 6 },
    ],
  });

  console.log("Seed complete!");
  console.log(`  - ${materials.length} materials`);
  console.log(`  - ${patterns.length} fly patterns with tying steps`);
  console.log("  - Pattern materials linked");
  console.log("  - Substitutions created");
  console.log("  - Variations created");
  console.log("  - Resources created");
  console.log("  - Affiliate links created");
  console.log("  - Tying challenge created");
  console.log("  - Forum categories created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
