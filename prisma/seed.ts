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
    ],
  });

  console.log("Seed complete!");
  console.log(`  - ${materials.length} materials`);
  console.log("  - 4 fly patterns with tying steps");
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
