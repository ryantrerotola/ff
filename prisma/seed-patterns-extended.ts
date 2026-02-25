import {
  PrismaClient,
  FlyCategory,
  Difficulty,
  WaterType,
  MaterialType,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtendedPatternDef {
  name: string;
  slug: string;
  category: FlyCategory;
  difficulty: Difficulty;
  waterType: WaterType;
  description: string;
  origin: string;
  materials: {
    name: string;
    type: MaterialType;
    description: string;
    customColor?: string;
    customSize?: string;
    required: boolean;
    position: number;
  }[];
  steps: {
    position: number;
    title: string;
    instruction: string;
    tip?: string;
  }[];
}

// ─── Dry Flies ───────────────────────────────────────────────────────────────

const DRY_FLIES: ExtendedPatternDef[] = [
  {
    name: "Stimulator",
    slug: "stimulator",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Stimulator is a large, buoyant attractor dry fly that imitates stoneflies, caddisflies, and grasshoppers. Its palmered hackle and elk hair wing make it float high in fast, broken water. It doubles as a superb indicator fly for dropper nymph rigs.",
    origin:
      "Created by Randall Kaufmann in the 1980s as a variation of earlier stonefly dry patterns. It quickly became a staple in western US fly boxes.",
    materials: [
      { name: "Tiemco TMC 200R Nymph Hook", type: MaterialType.hook, description: "2X long, 1X heavy curved nymph hook.", customSize: "Size 8-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Elk Body Hair", type: MaterialType.tail, description: "Hollow elk hair for tail.", customColor: "Natural", required: true, position: 3 },
      { name: "Antron Yarn", type: MaterialType.body, description: "Sparkle yarn for body.", customColor: "Orange", required: true, position: 4 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Palmer hackle over the body.", required: true, position: 5 },
      { name: "Fine Gold Wire", type: MaterialType.rib, description: "Rib to reinforce palmered hackle.", required: true, position: 6 },
      { name: "Elk Hair (Wing)", type: MaterialType.wing, description: "Elk hair tent wing.", customColor: "Natural", required: true, position: 7 },
      { name: "Hare's Ear Dubbing", type: MaterialType.thorax, description: "Thorax dubbing.", customColor: "Amber", required: true, position: 8 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Collar hackle at thorax.", required: true, position: 9 },
    ],
    steps: [
      { position: 1, title: "Secure hook and tie in tail", instruction: "Place the hook in the vise. Start thread behind the eye and wrap to the bend. Cut a small bunch of elk body hair, clean and stack it, and tie it in at the bend for the tail — about half a shank length long." },
      { position: 2, title: "Tie in hackle, wire, and body yarn", instruction: "At the tail tie-in point, tie in a grizzly saddle hackle by the tip, a length of fine gold wire, and a piece of orange Antron yarn. Advance your thread to the midpoint of the shank." },
      { position: 3, title: "Wrap the abdomen and palmer hackle", instruction: "Wrap the Antron yarn forward in touching turns to the midpoint to form the abdomen. Palmer the hackle forward over the body in open spirals. Counter-wrap the wire through the hackle to reinforce it. Secure and trim all materials.", tip: "Counter-wrapping the wire locks the hackle in place so a single broken fiber will not unravel the whole hackle." },
      { position: 4, title: "Tie in the elk hair wing", instruction: "Cut, clean, and stack a bunch of elk hair. Measure to the hook bend and tie it in at the midpoint with firm pinch wraps. Trim the butts at an angle." },
      { position: 5, title: "Dub the thorax and add collar hackle", instruction: "Dub a thick thorax of amber hare's ear dubbing from behind the wing to behind the eye. Tie in a grizzly rooster hackle and wrap 3-4 collar turns through the thorax. Secure and trim." },
      { position: 6, title: "Finish the fly", instruction: "Build a small thread head. Whip finish and apply head cement. The fly should float high with hackle and wing riding above the surface." },
    ],
  },
  {
    name: "Comparadun",
    slug: "comparadun",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Comparadun is a no-hackle dry fly that uses a fanned deer hair wing to float in the surface film. Its flush-floating silhouette is devastatingly effective on selective, slow-water trout that reject traditional hackled patterns.",
    origin:
      "Developed by Al Caucci and Bob Nastasi in the 1970s as part of their 'compara' series, designed to match the natural flush-floating posture of mayfly duns.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 12-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Split tailing fibers.", customColor: "Dun", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine dry fly dubbing.", customColor: "Sulphur Yellow", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Coastal deer hair for fanned wing.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in split tails", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in 6-8 Microfibbetts, splitting them into two groups with figure-eight wraps and a small thread bump. The tails should splay at about a 45-degree angle.", tip: "Split tails act as outriggers and are critical for stability on no-hackle patterns." },
      { position: 2, title: "Dub the body", instruction: "Apply a thin, even layer of superfine dubbing to the thread. Dub a slim, tapered body from the tail to about one-third behind the eye. The body should be slender with a gentle taper." },
      { position: 3, title: "Tie in the deer hair wing", instruction: "Cut a small bunch of fine coastal deer hair, clean and stack it. Measure to one shank length. Tie it in at the one-third point with the tips fanning upward and forward in a 180-degree arc. Use firm pinch wraps. The hair should fan out but not spin around the shank.", tip: "Use fine coastal deer hair, not elk. Elk is too coarse for this pattern. The 180-degree fan is the key to the Comparadun's silhouette." },
      { position: 4, title: "Trim butts and finish thorax", instruction: "Trim the deer hair butts at an angle. Dub a small thorax over the trimmed butts to create a smooth profile. Build a neat head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Humpy",
    slug: "humpy",
    category: FlyCategory.dry,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description:
      "The Humpy (also known as the Goofus Bug) is a high-floating attractor dry fly with a distinctive hump of elk or deer hair over the body. Extremely buoyant and durable, it excels in fast pocket water and freestone streams where delicate presentations are not needed.",
    origin:
      "Originated in the Rocky Mountain West, likely in the 1940s-1950s. Its exact origin is disputed but it became a staple pattern for western trout anglers.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Elk Body Hair", type: MaterialType.tail, description: "Elk hair for tail and shellback.", customColor: "Natural", required: true, position: 3 },
      { name: "Uni-Thread 6/0", type: MaterialType.body, description: "Thread underbody.", customColor: "Yellow", required: true, position: 4 },
      { name: "Calf Body Hair", type: MaterialType.wing, description: "Upright divided wings.", customColor: "White", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Collar hackle.", required: true, position: 6 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Second collar hackle.", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in elk hair", instruction: "Place hook in vise. Start thread and wrap to the bend. Cut a bunch of elk body hair, clean and stack it. Tie it in at the bend with tips extending rearward as the tail (one shank length). Do not trim the butt ends — they will form the shellback.", tip: "The elk hair serves double duty as tail and shellback. This is the defining feature of the Humpy." },
      { position: 2, title: "Build the thread underbody", instruction: "Wrap thread forward over the elk hair butts to the two-thirds point, binding them along the top of the shank. Then wrap back to the bend and forward again to build a smooth, slightly tapered thread underbody. The elk hair butts should lay flat on top of the shank." },
      { position: 3, title: "Pull the shellback forward and tie in wings", instruction: "Pull the elk hair butt ends forward over the top of the body, forming the hump. Secure with tight thread wraps at the two-thirds point. Divide the remaining elk hair into two bunches for upright wings, or tie in white calf body hair as separate wings. Post and divide with figure-eight wraps.", tip: "Getting the hump tension right takes practice. Too loose and it looks sloppy; too tight and it distorts the body shape." },
      { position: 4, title: "Add hackle and finish", instruction: "Tie in grizzly and brown hackle feathers. Wrap 2-3 turns of each behind and in front of the wings. Secure, trim, build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Light Cahill",
    slug: "light-cahill",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Light Cahill is a classic American dry fly pattern that imitates pale mayflies like Stenacron and Stenonema species. Its cream and ginger tones make it a go-to pattern during summer evening hatches on eastern and midwestern trout streams.",
    origin:
      "Created by Dan Cahill in the 1880s on the Neversink River in the Catskills. Theodore Gordon later refined the dressing into the pattern we know today.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Cream", required: true, position: 2 },
      { name: "Ginger Hackle Fibers", type: MaterialType.tail, description: "Light ginger hackle fibers for tail.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Cream dubbing.", customColor: "Cream", required: true, position: 4 },
      { name: "Lemon Wood Duck Flank", type: MaterialType.wing, description: "Wood duck flank feather for wings.", required: true, position: 5 },
      { name: "Light Ginger Hackle", type: MaterialType.hackle, description: "Light ginger rooster hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start cream thread and wrap to the bend. Tie in 6-8 light ginger hackle fibers for the tail, about one shank length long." },
      { position: 2, title: "Dub the body", instruction: "Apply cream superfine dubbing to the thread and dub a slim, tapered body from the tail forward to the one-third point behind the eye." },
      { position: 3, title: "Tie in wood duck wings", instruction: "Select a matched pair of lemon wood duck flank feather sections. Tie them in on top of the shank with tips up, then post upright and divide with figure-eight wraps.", tip: "Wood duck flank is the traditional material. If unavailable, dyed mallard flank is a good substitute." },
      { position: 4, title: "Hackle and finish", instruction: "Tie in a light ginger hackle. Wrap 3-4 turns behind and in front of the wings. Secure, trim, build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Hendrickson",
    slug: "hendrickson",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Hendrickson is one of the most important eastern US mayfly patterns, imitating the Ephemerella subvaria. The spring Hendrickson hatch is a landmark event on many northeastern trout streams, producing the first reliable dry fly fishing of the year.",
    origin:
      "Created by Roy Steenrod in 1916 on the Beaverkill River in the Catskills, named after his fishing companion Albert Everett Hendrickson.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 12-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Gray", required: true, position: 2 },
      { name: "Medium Dun Hackle Fibers", type: MaterialType.tail, description: "Dun hackle fibers for split tail.", required: true, position: 3 },
      { name: "Hendrickson Pink Fox Dubbing", type: MaterialType.body, description: "Pink-tinted fox belly dubbing.", customColor: "Hendrickson Pink", required: true, position: 4 },
      { name: "Lemon Wood Duck Flank", type: MaterialType.wing, description: "Wood duck flank feather wings.", required: true, position: 5 },
      { name: "Medium Dun Hackle", type: MaterialType.hackle, description: "Medium dun rooster hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start gray thread and wrap to the bend. Tie in medium dun hackle fibers for the tail, split and splayed, about one shank length." },
      { position: 2, title: "Dub the body", instruction: "Apply Hendrickson pink fox dubbing (a blend of fawn-pink fox belly fur). Dub a slim, slightly tapered body from the tail to the one-third point. The color should be a subtle pinkish-tan.", tip: "The exact body color is critical for matching Hendrickson naturals. Blend light fox belly fur with a touch of pink dubbing to match the natural." },
      { position: 3, title: "Tie in wings", instruction: "Tie in matched wood duck flank feather sections as upright divided wings. Post and separate with figure-eight wraps." },
      { position: 4, title: "Hackle and finish", instruction: "Tie in medium dun hackle. Wrap 3-4 turns behind and in front of the wings. Secure, trim, build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "March Brown",
    slug: "march-brown",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The March Brown is a classic pattern imitating the Rhithrogena and Stenonema mayflies. It is one of the oldest fly patterns still actively fished, with roots going back centuries in English fly fishing tradition. The American version has been adapted for eastern US streams.",
    origin:
      "One of the oldest recorded fly patterns, dating back to Charles Cotton's additions to Izaak Walton's 'The Compleat Angler' in 1676. The American version was adapted in the 19th century.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 10-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Dark Ginger Hackle Fibers", type: MaterialType.tail, description: "Dark ginger hackle fibers.", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Tan hare's ear dubbing.", customColor: "Tan", required: true, position: 4 },
      { name: "Fine Gold Wire", type: MaterialType.rib, description: "Gold wire rib.", required: true, position: 5 },
      { name: "Turkey Quill Sections", type: MaterialType.wing, description: "Mottled turkey quill wing sections.", required: true, position: 6 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Dark ginger or brown hackle.", required: true, position: 7 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Grizzly hackle mixed with brown.", required: true, position: 8 },
    ],
    steps: [
      { position: 1, title: "Start thread and add tail and rib", instruction: "Place hook in vise. Start orange thread and wrap to the bend. Tie in dark ginger hackle fibers for the tail. Tie in fine gold wire for the rib at the same point." },
      { position: 2, title: "Dub the body", instruction: "Apply tan hare's ear dubbing and dub a slightly rough, tapered body to the one-third point. Counter-wrap the gold wire as a rib in 4-5 turns. Secure and trim." },
      { position: 3, title: "Tie in wings", instruction: "Tie in matched mottled turkey quill sections as upright divided wings. Post and divide with figure-eight wraps.", tip: "Coat the turkey quill sections with thin head cement before tying in to prevent splitting." },
      { position: 4, title: "Hackle and finish", instruction: "Tie in brown and grizzly hackle feathers. Wrap both together for 3-4 turns behind and in front of the wings. Secure, trim, build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Pale Morning Dun",
    slug: "pale-morning-dun",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Pale Morning Dun (PMD) imitates Ephemerella species mayflies that hatch prolifically on western rivers throughout summer. PMD hatches can produce incredibly selective feeding, making an accurate imitation essential. This pattern rides low in the film like the natural.",
    origin:
      "PMD patterns evolved through many tiers in the western US. The modern CDC and comparadun versions have largely replaced the traditional hackled dressings for technical water.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Pale Yellow", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Split tailing fibers.", customColor: "Light Dun", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine dubbing for body.", customColor: "PMD Yellow", required: true, position: 4 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC puff wing.", customColor: "Light Dun", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in split tails", instruction: "Place hook in vise. Start pale yellow thread and wrap to the bend. Tie in Microfibbetts split into two groups with a thread bump between them. Tails should be one shank length." },
      { position: 2, title: "Dub the body", instruction: "Apply a very thin layer of PMD yellow superfine dubbing. Dub a slim body to the two-thirds point. The body should be slender to match the delicate natural.", tip: "PMD naturals are very slim. Overdressing the body is the most common mistake." },
      { position: 3, title: "Tie in CDC wing", instruction: "Stack 2-3 light dun CDC feathers and tie them in at the two-thirds point as an upright puff wing. Trim the butts." },
      { position: 4, title: "Dub thorax and finish", instruction: "Dub a slightly fuller thorax around the wing base. Build a small head, whip finish, and apply head cement to the thread head only.", tip: "Never apply floatant directly to CDC — use a desiccant powder instead." },
    ],
  },
  {
    name: "Trico Spinner",
    slug: "trico-spinner",
    category: FlyCategory.dry,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description:
      "The Trico Spinner imitates the spent spinner fall of Tricorythodes mayflies, one of the most important and challenging hatches in North American fly fishing. Trico spinner falls can blanket the water, demanding tiny, precise imitations presented with finesse.",
    origin:
      "Trico patterns have been developed by numerous tiers. The spent-wing spinner version became standard for matching the dense spinner falls that occur on many eastern and western rivers.",
    materials: [
      { name: "Tiemco TMC 101 Dry Fly Hook", type: MaterialType.hook, description: "Wide-gap dry fly hook for small sizes.", customSize: "Size 20-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Ultra-fine tying thread.", customColor: "Black", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Split tailing fibers.", customColor: "White", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine dubbing.", customColor: "Black (thorax) / Olive (abdomen)", required: true, position: 4 },
      { name: "White Poly Yarn", type: MaterialType.wing, description: "Spent poly yarn wings.", customColor: "White", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start black thread and wrap to the bend. Tie in 2-3 white Microfibbetts, split wide, for the tails. They should be about 1.5 shank lengths.", tip: "On hooks this small, every wrap counts. Use minimal thread and the finest materials." },
      { position: 2, title: "Dub the abdomen", instruction: "Apply the tiniest amount of olive or pale dubbing. Dub a very slim abdomen to the midpoint of the shank. On size 22-24 hooks, the thread color alone may suffice." },
      { position: 3, title: "Tie in spent wings", instruction: "Cut a short piece of white poly yarn. Tie it in at the midpoint with figure-eight wraps so the wings extend horizontally to each side in a spent position. Trim to about one shank length per side.", tip: "The spent-wing profile is what trout key on during a spinner fall. The wings must lay flat." },
      { position: 4, title: "Dub thorax and finish", instruction: "Dub a tiny black thorax around the wing base. Whip finish behind the eye. Apply a micro-drop of head cement. The finished fly should be incredibly sparse.", tip: "Fish Trico spinners on 6X or 7X tippet. The fly is meant to lay flat in the surface film." },
    ],
  },
  {
    name: "Quill Gordon",
    slug: "quill-gordon",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Quill Gordon is one of the most revered American dry fly patterns, imitating the Epeorus pleuralis mayfly. It is among the first mayflies to hatch in spring on eastern streams, making it a harbinger of dry fly season. The stripped peacock quill body gives it a beautifully segmented appearance.",
    origin:
      "Created by Theodore Gordon in the late 1800s, widely considered the father of American dry fly fishing. He adapted English dry fly techniques for American trout streams.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 12-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Gray", required: true, position: 2 },
      { name: "Medium Dun Hackle Fibers", type: MaterialType.tail, description: "Dun hackle fibers for tail.", required: true, position: 3 },
      { name: "Stripped Peacock Quill", type: MaterialType.body, description: "Stripped peacock eye quill.", required: true, position: 4 },
      { name: "Lemon Wood Duck Flank", type: MaterialType.wing, description: "Wood duck flank feather wings.", required: true, position: 5 },
      { name: "Medium Dun Hackle", type: MaterialType.hackle, description: "Blue dun rooster hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start gray thread and wrap to the bend. Tie in medium dun hackle fibers for the tail, about one shank length." },
      { position: 2, title: "Wrap the quill body", instruction: "Tie in a stripped peacock eye quill at the bend. Wrap it forward in touching turns to the two-thirds point to create a beautifully segmented body. Secure and trim.", tip: "Soak the quill in water before wrapping to prevent cracking. The natural light and dark banding creates the segmented look." },
      { position: 3, title: "Tie in wings", instruction: "Tie in matched wood duck flank feather sections as upright divided wings. Post and divide with figure-eight wraps." },
      { position: 4, title: "Hackle and finish", instruction: "Tie in medium dun hackle. Wrap 3-4 turns behind and in front of the wings. Secure, trim, build a head, whip finish, and apply head cement.", tip: "Coat the quill body with a thin layer of head cement or UV resin to protect it from fish teeth." },
    ],
  },
  {
    name: "Tan Caddis (X-Caddis)",
    slug: "x-caddis",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The X-Caddis is a devastatingly effective caddis emerger/dry fly that uses a trailing Z-Lon shuck instead of hackle. It sits low in the surface film, imitating a caddis struggling to emerge. Often outperforms traditional hackled caddis patterns on educated fish.",
    origin:
      "Created by Craig Mathews and John Juracek, owners of Blue Ribbon Flies in West Yellowstone, Montana. Published in their book 'Fishing Yellowstone Hatches' in 1992.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing shuck material.", customColor: "Amber", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Dry fly dubbing.", customColor: "Tan", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair tent wing.", customColor: "Natural Tan", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in the trailing shuck", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in a sparse bunch of amber Z-Lon extending about half a shank length past the bend. This represents the pupal shuck." },
      { position: 2, title: "Dub the body", instruction: "Apply tan superfine dubbing to the thread. Dub a slim, tapered body from the shuck to about one-quarter behind the eye. Keep it neat and slightly tapered." },
      { position: 3, title: "Tie in the deer hair wing", instruction: "Cut a small bunch of deer hair, clean and stack it. Measure to the bend and tie it in on top of the shank as a tent-style wing. Use pinch wraps to prevent spinning. Trim the butts.", tip: "The wing should sit low over the body like a tent — not upright. This mimics the natural caddis wing posture." },
      { position: 4, title: "Finish the fly", instruction: "Dub a small amount of dubbing over the trimmed butts to smooth the head area. Whip finish and apply head cement. The fly should sit flush in the surface film.", tip: "The X-Caddis is intentionally hackleless. It floats in the film rather than on top of it, which is why selective trout prefer it." },
    ],
  },
];

// ─── Nymphs ──────────────────────────────────────────────────────────────────

const NYMPHS: ExtendedPatternDef[] = [
  {
    name: "Hare's Ear Flashback",
    slug: "hares-ear-flashback",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Flashback Hare's Ear adds a strip of flashback material over the wing case of the classic GRHE, giving it extra visibility and a trigger point. It is one of the most productive nymph patterns worldwide, imitating a broad range of mayfly nymphs.",
    origin:
      "An evolution of the classic Gold Ribbed Hare's Ear with a flashback wing case added for extra attraction. The flashback variant became popular in the 1990s.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Standard nymph hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "Pheasant tail fiber tail.", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Natural hare's ear dubbing.", customColor: "Natural", required: true, position: 4 },
      { name: "Fine Gold Wire", type: MaterialType.rib, description: "Gold wire rib.", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.wing, description: "Flashback wing case.", customColor: "Pearl", required: true, position: 6 },
      { name: "Hare's Ear Dubbing", type: MaterialType.thorax, description: "Picked-out thorax dubbing.", customColor: "Dark", required: true, position: 7 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tungsten bead head.", customColor: "Gold", customSize: "2.4mm-3.2mm", required: false, position: 8 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a tungsten bead onto the hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in tail, rib, and flashback", instruction: "At the bend, tie in pheasant tail fibers for a short tail, fine gold wire for the rib, and a strip of pearl Flashabou on top for the wing case. Advance thread to the midpoint." },
      { position: 3, title: "Dub and rib the abdomen", instruction: "Dub a tapered abdomen of natural hare's ear to the midpoint. Counter-wrap the gold wire forward as a rib. Secure and trim the wire." },
      { position: 4, title: "Dub thorax and pull wing case", instruction: "Dub a bulky thorax of dark hare's ear dubbing. Pull the Flashabou strip forward over the thorax as a wing case. Secure behind the bead and trim. Pick out guard hairs from the thorax with a dubbing needle.", tip: "The picked-out fibers suggest legs and give the fly its signature buggy profile." },
      { position: 5, title: "Finish the fly", instruction: "Whip finish behind the bead. Apply head cement. The finished fly should have a prominent flashback wing case and shaggy thorax." },
    ],
  },
  {
    name: "Perdigon",
    slug: "perdigon",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Perdigon is a slim, heavy, UV-resin-coated competition nymph designed to cut through the water column instantly. Developed for European competition fly fishing, it has become one of the most effective subsurface patterns worldwide. Its simplicity belies its deadly effectiveness.",
    origin:
      "Developed by the Spanish fly fishing competition team in the early 2000s. The name comes from the Spanish word for 'pellet' or 'shot,' referring to its dense, fast-sinking design.",
    materials: [
      { name: "Hanak 450 Jig Hook", type: MaterialType.hook, description: "60-degree jig hook for euro nymphing.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Semperfli Nano Silk", type: MaterialType.thread, description: "Ultra-fine tying thread.", customColor: "Black", required: true, position: 2 },
      { name: "Coq de Leon Fibers", type: MaterialType.tail, description: "Stiff tailing fibers.", required: true, position: 3 },
      { name: "Flat Tinsel", type: MaterialType.body, description: "Thin flat tinsel body.", customColor: "Pearl", required: true, position: 4 },
      { name: "Fluorescent Dubbing", type: MaterialType.thorax, description: "Hot spot collar.", customColor: "Fluorescent Orange", required: true, position: 5 },
      { name: "Tungsten Slotted Bead", type: MaterialType.bead, description: "Heavy slotted tungsten bead.", customColor: "Black Nickel", customSize: "2.5mm-3.0mm", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a slotted tungsten bead onto the jig hook. Place in vise. Start ultra-fine thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in tail and body material", instruction: "Tie in 2-3 Coq de Leon fibers for a short tail (half shank length). Tie in a strand of flat pearl tinsel at the bend." },
      { position: 3, title: "Wrap the body", instruction: "Wrap the tinsel forward in tight, slightly overlapping turns to create a slim, smooth body. Stop about 2mm behind the bead. Secure and trim.", tip: "The body must be as slim as possible. Any bulk defeats the purpose of the pattern." },
      { position: 4, title: "Add hot spot and finish thread work", instruction: "Dub a tiny collar of fluorescent orange dubbing directly behind the bead — only 2-3 wraps wide. Whip finish behind the bead and trim." },
      { position: 5, title: "Coat with UV resin", instruction: "Apply a thin, even coat of UV resin over the entire body from tail to hot spot. Rotate the fly while curing to get an even coat. Cure with UV light for 15-20 seconds.", tip: "The UV resin coat is essential — it makes the fly nearly indestructible and creates the smooth, fast-sinking profile." },
    ],
  },
  {
    name: "Walt's Worm",
    slug: "walts-worm",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "Walt's Worm is a deceptively simple nymph that imitates crane fly larvae, free-living caddis, and various aquatic worms. Despite its simplicity, it is one of the most effective competition nymphs ever designed. The rough hare's ear dubbing body creates a buggy, lifelike profile.",
    origin:
      "Created by Walt Young, a legendary Pennsylvania competition angler and fly tier. The pattern has become a staple in the European nymphing community.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved scud hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Coarse hare's mask dubbing with guard hairs.", customColor: "Natural", required: true, position: 3 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tungsten bead head.", customColor: "Gold", customSize: "2.4mm", required: false, position: 4 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Optionally slide a small tungsten bead onto the hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Dub the body", instruction: "Use a dubbing loop loaded with coarse hare's ear dubbing including plenty of guard hairs. Spin the loop and wrap forward to the bead, creating a shaggy, full body.", tip: "The bugginess is the whole point. Use lots of guard hairs and do not trim them." },
      { position: 3, title: "Finish and pick out fibers", instruction: "Whip finish behind the bead. Use a dubbing brush or piece of Velcro to aggressively pick out fibers all around the fly. The finished fly should look like a fuzzy caterpillar." },
    ],
  },
  {
    name: "Pat's Rubber Legs",
    slug: "pats-rubber-legs",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "Pat's Rubber Legs is a chunky, heavily weighted stonefly nymph imitation that excels as a point fly in nymph rigs. Its rubber legs provide irresistible movement, and its heavy weight gets the entire rig down fast. It is a go-to pattern on western freestone rivers.",
    origin:
      "Created by Pat Benson of the Yellowstone Angler in Livingston, Montana. It quickly became one of the most popular guide flies in the western United States.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long nymph hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire wraps for weight.", required: true, position: 3 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Round rubber legs.", customColor: "Brown/Black Barred", required: true, position: 4 },
      { name: "Variegated Chenille", type: MaterialType.body, description: "Variegated chenille body.", customColor: "Brown/Black", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Add weight and start thread", instruction: "Place hook in vise. Wrap 15-20 turns of lead wire around the shank center. Start thread and secure the lead wraps. Wrap a smooth thread base over the lead and the full shank." },
      { position: 2, title: "Tie in rubber legs and tail", instruction: "At the bend, tie in a pair of rubber legs splayed to each side as tails. Use figure-eight wraps to keep them separated.", tip: "The rubber legs should extend about one shank length past the bend." },
      { position: 3, title: "Tie in and wrap the chenille", instruction: "Tie in variegated chenille at the bend. Wrap forward in touching turns, tying in pairs of rubber legs at the one-third and two-thirds points as you go. Each set of legs gets figure-eight wraps to splay them outward." },
      { position: 4, title: "Add front legs and finish", instruction: "Tie in a final pair of rubber legs just behind the eye. Build a thread head, whip finish, and apply head cement.", tip: "The finished fly should have three sets of legs plus the tail — eight total rubber leg appendages." },
    ],
  },
  {
    name: "Frenchie",
    slug: "frenchie",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Frenchie is a beadhead pheasant tail variant with a fluorescent hot spot collar that has become one of the most popular competition nymphs in the world. Simple to tie and devastatingly effective, it is a must-have pattern for any Euro nymphing setup.",
    origin:
      "Popularized by Lance Egan, a member of the US Fly Fishing Team. The hot spot collar concept came from European competition traditions.",
    materials: [
      { name: "Hanak 450 Jig Hook", type: MaterialType.hook, description: "60-degree jig hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Coq de Leon Fibers", type: MaterialType.tail, description: "Stiff tailing fibers.", required: true, position: 3 },
      { name: "Pheasant Tail Fibers", type: MaterialType.body, description: "Pheasant tail fiber body.", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Copper wire rib.", required: true, position: 5 },
      { name: "Ice Dub", type: MaterialType.thorax, description: "Hot spot collar dubbing.", customColor: "Fluorescent Orange", required: true, position: 6 },
      { name: "Tungsten Slotted Bead", type: MaterialType.bead, description: "Heavy slotted tungsten bead.", customColor: "Gold", customSize: "2.5mm-3.5mm", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a slotted tungsten bead onto the jig hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in tail, wire, and pheasant tail", instruction: "At the bend, tie in 3-4 Coq de Leon fibers for a short tail. Tie in fine copper wire and 4-6 pheasant tail fibers at the same point." },
      { position: 3, title: "Wrap body and rib", instruction: "Wrap the pheasant tail fibers forward to about 3mm behind the bead, creating a slim, segmented body. Counter-wrap the copper wire as a rib in 5-6 turns. Secure and trim both.", tip: "Keep the body slim. The pheasant tail should show natural segmentation." },
      { position: 4, title: "Add hot spot collar and finish", instruction: "Dub a small collar of fluorescent orange Ice Dub directly behind the bead. Whip finish and trim. Apply head cement.", tip: "The hot spot should be small — just 2-3 wraps. It is a trigger, not a main feature." },
    ],
  },
  {
    name: "Stonefly Nymph (Kaufmann's)",
    slug: "kaufmanns-stonefly",
    category: FlyCategory.nymph,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description:
      "Kaufmann's Stonefly Nymph is a realistic, heavily weighted imitation of large stonefly nymphs like Pteronarcys (salmonflies) and Hesperoperla (golden stones). It is essential on western freestone rivers where stoneflies are a primary food source for large trout.",
    origin:
      "Created by Randall Kaufmann in the 1970s. It became one of the most widely used stonefly nymph patterns in western fly fishing.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long nymph hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Black", required: true, position: 2 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire wraps.", required: true, position: 3 },
      { name: "Goose Biots", type: MaterialType.tail, description: "Goose biot tails.", customColor: "Brown", required: true, position: 4 },
      { name: "Kaufmann's Stone Dubbing", type: MaterialType.body, description: "Blend of dark and brown dubbing.", customColor: "Brown/Black", required: true, position: 5 },
      { name: "Thin Skin", type: MaterialType.wing, description: "Wing case material.", customColor: "Mottled Brown", required: true, position: 6 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber leg material.", customColor: "Brown", required: true, position: 7 },
      { name: "Goose Biots", type: MaterialType.other, description: "Goose biot antennae.", customColor: "Brown", required: false, position: 8 },
    ],
    steps: [
      { position: 1, title: "Add weight and start thread", instruction: "Place hook in vise. Wrap 15-20 turns of lead wire. Build up lead at the thorax area to create a wide, flat profile. Start thread and cover the lead wraps." },
      { position: 2, title: "Tie in tails", instruction: "At the bend, tie in two brown goose biots splayed in a V shape for the tails, about half a shank length long." },
      { position: 3, title: "Dub abdomen with wing case segments", instruction: "Tie in a strip of mottled Thin Skin at the bend. Dub the abdomen in three segments, pulling the Thin Skin over the top as a wing case after each segment. This creates the three-segmented stonefly abdomen.", tip: "Build each segment slightly larger than the previous one to create the realistic stonefly taper." },
      { position: 4, title: "Add legs and dub thorax", instruction: "At the thorax, tie in rubber legs on each side. Dub a wide, bulky thorax. Pull the remaining Thin Skin over as a final wing case segment. Secure behind the eye." },
      { position: 5, title: "Add antennae and finish", instruction: "Optionally tie in two goose biot antennae extending forward. Build a head, whip finish, and apply head cement. Pick out dubbing fibers along the sides for a buggy profile." },
    ],
  },
  {
    name: "Mop Fly",
    slug: "mop-fly",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Mop Fly is the most controversial and arguably most effective pattern in modern fly fishing. Made from a strand of mop material, it imitates caddis larvae, crane fly larvae, and various aquatic worms. Tournament anglers swear by it despite purist objections.",
    origin:
      "The origin is uncertain, but it gained popularity through competition fly fishing circles in the 2010s. It sparked intense debate about what constitutes a legitimate fly pattern.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved scud hook.", customSize: "Size 10-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "White", required: true, position: 2 },
      { name: "Mop Chenille", type: MaterialType.body, description: "Chenille strand from a microfiber mop.", customColor: "Cream/Tan", required: true, position: 3 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tungsten bead head.", customColor: "Gold", customSize: "3.0mm-3.5mm", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a tungsten bead onto the hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in the mop strand", instruction: "Cut a single strand from a microfiber mop, about 1.5 inches long. Taper one end by trimming it to a point. Tie in the tapered end at the bend with the full strand extending rearward past the hook.", tip: "Cream, tan, and chartreuse are the most productive colors. Cut strands to length before tying." },
      { position: 3, title: "Secure and finish", instruction: "Wrap thread forward over the tie-in point to the bead, creating a smooth underbody. Whip finish behind the bead. Apply a drop of super glue to the thread wraps.", tip: "Some tiers add a hot spot collar of fluorescent dubbing behind the bead for extra attraction." },
    ],
  },
  {
    name: "Lightning Bug",
    slug: "lightning-bug",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Lightning Bug is a flashy attractor nymph that combines the effectiveness of a Flashback Pheasant Tail with extra sparkle. Its tinsel body and flashback wing case make it visible in off-color water and attract attention from fish at a distance.",
    origin:
      "A modern attractor nymph pattern that gained popularity in the early 2000s among competition and guide anglers.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Standard nymph hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Black", required: true, position: 2 },
      { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "Pheasant tail fiber tail.", required: true, position: 3 },
      { name: "Flat Tinsel", type: MaterialType.body, description: "Flat silver tinsel body.", customColor: "Silver", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Copper wire rib.", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.wing, description: "Flashback wing case.", customColor: "Pearl", required: true, position: 6 },
      { name: "Peacock Herl (Thorax)", type: MaterialType.thorax, description: "Peacock herl thorax.", required: true, position: 7 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tungsten bead head.", customColor: "Silver", customSize: "2.4mm-3.2mm", required: true, position: 8 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a silver tungsten bead onto the hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in tail, rib, tinsel, and wing case", instruction: "At the bend, tie in pheasant tail fibers for a short tail, fine copper wire, flat silver tinsel, and a strip of pearl Flashabou for the wing case." },
      { position: 3, title: "Wrap body and rib", instruction: "Wrap the flat tinsel forward to the two-thirds point for a smooth, shiny body. Counter-wrap the copper wire as a rib. Secure both." },
      { position: 4, title: "Build thorax and pull wing case", instruction: "Wrap 3-4 peacock herls into a bulky thorax. Pull the Flashabou over as a wing case. Secure behind the bead and trim." },
      { position: 5, title: "Finish the fly", instruction: "Whip finish behind the bead. Apply head cement." },
    ],
  },
  {
    name: "Squirmy Wormy",
    slug: "squirmy-wormy",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Squirmy Wormy uses ultra-stretchy silicone material to create an irresistible undulating worm imitation. Like the San Juan Worm's more animated cousin, it drives trout wild with its constant motion in the current. Another pattern that purists love to hate but fish love to eat.",
    origin:
      "Emerged from competition fly fishing in the 2010s, likely developed independently by multiple tiers using stretchy craft and lure-making materials.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved scud hook.", customSize: "Size 10-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Red", required: true, position: 2 },
      { name: "Squirmy Worm Material", type: MaterialType.body, description: "Ultra-stretchy silicone worm material.", customColor: "Red/Worm Brown", required: true, position: 3 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tungsten bead for weight.", customColor: "Gold", customSize: "3.0mm", required: false, position: 4 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Optionally add a tungsten bead. Place hook in vise. Start thread at the midpoint of the shank." },
      { position: 2, title: "Tie in the worm material", instruction: "Cut a 2-inch piece of squirmy worm material. Tie it in at the midpoint so equal lengths extend past each end of the hook. Use firm cross-wraps and figure-eight wraps to lock it in place.", tip: "The material is slippery. A drop of super glue on the thread wraps before and after tying in prevents it from pulling free." },
      { position: 3, title: "Finish the fly", instruction: "Whip finish over the tie-in point. Apply super glue generously to the thread wraps. The worm should undulate freely in the current from both ends of the hook." },
    ],
  },
  {
    name: "Jig CDC Pheasant Tail",
    slug: "jig-cdc-pheasant-tail",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Jig CDC Pheasant Tail combines the proven pheasant tail body with a CDC thorax collar on a modern jig hook. The CDC fibers pulse and move in the current, imitating a nymph's gills and legs. The jig hook design rides point-up, dramatically reducing snags.",
    origin:
      "A modern Euro nymphing evolution of the classic Pheasant Tail Nymph, incorporating CDC for movement and a jig hook for snag resistance.",
    materials: [
      { name: "Hanak 450 Jig Hook", type: MaterialType.hook, description: "60-degree jig hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Coq de Leon Fibers", type: MaterialType.tail, description: "Stiff tailing fibers.", required: true, position: 3 },
      { name: "Pheasant Tail Fibers", type: MaterialType.body, description: "Pheasant tail fiber body.", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Copper wire rib.", required: true, position: 5 },
      { name: "CDC Feathers", type: MaterialType.thorax, description: "CDC thorax collar.", customColor: "Natural Dun", required: true, position: 6 },
      { name: "Tungsten Slotted Bead", type: MaterialType.bead, description: "Slotted tungsten bead.", customColor: "Copper", customSize: "2.5mm-3.0mm", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Slide a slotted tungsten bead onto the jig hook. Place in vise. Start thread behind the bead and wrap to the bend." },
      { position: 2, title: "Build body and rib", instruction: "Tie in Coq de Leon tail fibers, copper wire, and pheasant tail fibers. Wrap the pheasant tail forward for a slim body. Counter-wrap the wire as a rib. Secure and trim." },
      { position: 3, title: "Add CDC collar", instruction: "Select a CDC feather. Tie it in by the tip behind the bead. Make 1-2 wraps as a soft hackle collar. Sweep the fibers rearward and secure.", tip: "The CDC fibers should pulse and move in the current — this is the key difference from a standard PT nymph." },
      { position: 4, title: "Finish the fly", instruction: "Whip finish behind the bead. Apply head cement to the thread wraps only — not the CDC." },
    ],
  },
];

// ─── Streamers ───────────────────────────────────────────────────────────────

const STREAMERS: ExtendedPatternDef[] = [
  {
    name: "Zonker",
    slug: "zonker",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Zonker uses a strip of rabbit fur tied Matuka-style over a mylar or tinsel body to create an incredibly lifelike baitfish imitation. The rabbit strip undulates seductively in the water, producing a swimming action that triggers savage strikes from trout, bass, and pike.",
    origin:
      "Developed by Dan Byford in Colorado in the 1970s. The name comes from the character in a comic strip popular at the time.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long streamer hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Rabbit fur strip for wing.", customColor: "Natural/Olive", required: true, position: 3 },
      { name: "Mylar Tubing", type: MaterialType.body, description: "Braided mylar tubing for body.", customColor: "Pearl/Silver", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Wire to bind rabbit strip.", required: true, position: 5 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire wraps.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Add weight and prepare body", instruction: "Place hook in vise. Wrap 10-15 turns of lead wire. Slide a piece of braided mylar tubing over the hook shank. Secure the rear end at the bend with thread and the front end behind the eye.", tip: "Remove the core string from the mylar tubing before sliding it over the hook." },
      { position: 2, title: "Prepare and tie in the rabbit strip", instruction: "Cut a rabbit strip about 2 inches long. Use a razor blade to make a small slit in the hide at the tie-in point so the hook can poke through. Tie in the front end of the strip behind the eye on top of the mylar body." },
      { position: 3, title: "Bind down the strip Matuka-style", instruction: "Use fine copper wire to spiral-wrap rearward through the rabbit fur, binding the strip to the body. Part the fur with each wrap so no fibers are trapped. Secure the wire at the bend.", tip: "Part the rabbit fur carefully with each wire wrap. Trapped fibers look sloppy and reduce the fly's action." },
      { position: 4, title: "Finish the head", instruction: "Build a thread head, covering all material butts. Whip finish and apply head cement or UV resin for a glossy head." },
    ],
  },
  {
    name: "Sculpzilla",
    slug: "sculpzilla",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Sculpzilla is a modern sculpin imitation that is incredibly easy to tie yet devastatingly effective. Using a simple Fish-Skull head and rabbit strip, it produces a wide, darting action that drives big trout wild. It has largely replaced more complex sculpin patterns in many fly boxes.",
    origin:
      "A modern pattern that gained popularity through the guide community in the 2010s, leveraging pre-molded Fish-Skull heads for ease of tying.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Wide-gap stinger hook.", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Rabbit fur strip tail/wing.", customColor: "Olive", required: true, position: 3 },
      { name: "Fish-Skull Sculpin Head", type: MaterialType.other, description: "Pre-molded sculpin head.", customColor: "Olive", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in rabbit strip", instruction: "Place hook in vise. Start thread behind the eye. Tie in a rabbit strip at the bend with the fur extending about 1.5 shank lengths rearward." },
      { position: 2, title: "Build the body", instruction: "Wrap the rabbit strip forward (or palmer short rabbit zonker strips) to behind the eye to build a bulky, buggy body. Secure and trim.", tip: "Cross-cut rabbit strips wrap more easily and create a fuller body than standard cut strips." },
      { position: 3, title: "Add the sculpin head and finish", instruction: "Slide a Fish-Skull sculpin head over the hook eye and push it against the fly body. Secure with thread wraps in front or behind the head. Apply super glue to lock the head in place. Whip finish." },
    ],
  },
  {
    name: "Circus Peanut",
    slug: "circus-peanut",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Circus Peanut is an articulated streamer with a peanut-shaped profile that produces an erratic, darting action. It is one of the most effective big-trout streamers ever designed, combining foam for buoyancy with a wire articulation that creates a snake-like swimming motion.",
    origin:
      "Created by Kelly Galloup, one of the most influential modern streamer designers. Galloup's streamer patterns have revolutionized trophy trout fishing.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Stinger hooks (two, articulated).", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "White", required: true, position: 2 },
      { name: "Articulation Wire", type: MaterialType.other, description: "Wire or beaded link for articulation.", required: true, position: 3 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Marabou tail.", customColor: "White", required: true, position: 4 },
      { name: "EP Fiber", type: MaterialType.body, description: "EP fiber for body bulk.", customColor: "White", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash accents.", customColor: "Pearl", required: true, position: 6 },
      { name: "Foam Cylinder", type: MaterialType.other, description: "Foam for buoyancy and shape.", customColor: "White", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Build the rear hook section", instruction: "Place the rear stinger hook in the vise. Start thread. Tie in a marabou tail, then build a bulky body with EP fiber. Add flash along the sides. Whip finish." },
      { position: 2, title: "Create the articulation", instruction: "Thread beaded articulation wire through the rear hook eye. Attach the front hook by threading the wire through its eye and securing with thread wraps.", tip: "The articulation joint is what gives this fly its signature darting, jointed action." },
      { position: 3, title: "Build the front section", instruction: "On the front hook, build another bulky EP fiber body. Tie in foam on top and bottom to create a peanut-shaped cross-section. Add flash along the sides." },
      { position: 4, title: "Add eyes and finish", instruction: "Add stick-on or dumbbell eyes to the sides of the head. Build a thread head. Apply UV resin over the eyes to lock them in place. The finished fly should have a distinctive two-humped peanut profile." },
    ],
  },
  {
    name: "Slump Buster",
    slug: "slump-buster",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Slump Buster is a cone-head rabbit strip streamer that lives up to its name — when nothing else works, this fly breaks the slump. Its heavy cone head and pulsing rabbit fur create an irresistible combination for trout, bass, and other predatory fish.",
    origin:
      "Created by John Barr (also the creator of the Copper John) in Colorado. It quickly became a favorite guide fly for tough fishing conditions.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long streamer hook.", customSize: "Size 4-8", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Brass Cone Head", type: MaterialType.bead, description: "Brass cone for weight and profile.", customColor: "Gold", required: true, position: 3 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire wraps.", required: true, position: 4 },
      { name: "Pine Squirrel Zonker Strip", type: MaterialType.wing, description: "Pine squirrel strip for wing.", customColor: "Olive/Natural", required: true, position: 5 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Flash material.", customColor: "Gold", required: true, position: 6 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl collar.", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Add cone and weight", instruction: "Slide a brass cone head onto the hook, small end first. Place in vise. Wrap 10-15 turns of lead wire behind the cone. Start thread and secure the lead." },
      { position: 2, title: "Tie in flash and rabbit strip", instruction: "At the bend, tie in 6-8 strands of gold Krystal Flash. Tie in a pine squirrel zonker strip on top, fur extending past the bend about 1.5 shank lengths." },
      { position: 3, title: "Wrap the body and bind the strip", instruction: "Palmer the zonker strip forward or wrap chenille/dubbing as an underbody, binding the zonker strip Matuka-style with wire wraps. Bring the strip to just behind the cone." },
      { position: 4, title: "Add peacock collar and finish", instruction: "Wrap 3-4 peacock herls as a collar directly behind the cone. Secure, trim, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Kreelex",
    slug: "kreelex",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.both,
    description:
      "The Kreelex is a simple but deadly baitfish imitation made primarily from tinsel and flash. Its bright, reflective body mimics injured or disoriented minnows. Despite its simplicity, it is one of the most effective patterns for bass, trout, and panfish in lakes and streams.",
    origin:
      "A modern pattern that became popular through warm-water fly fishing circles. Its simplicity and effectiveness have made it a staple for guides targeting bass and other species.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong tying thread.", customColor: "Red", required: true, position: 2 },
      { name: "Flashabou", type: MaterialType.wing, description: "Flash wing material.", customColor: "Gold", required: true, position: 3 },
      { name: "Flat Tinsel", type: MaterialType.body, description: "Flat tinsel body.", customColor: "Gold", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead dumbbell eyes.", customSize: "Small-Medium", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in eyes", instruction: "Place hook in vise. Start red thread one-third behind the eye. Tie in dumbbell eyes with firm figure-eight wraps. Apply super glue to lock them." },
      { position: 2, title: "Build the tinsel body", instruction: "Tie in flat gold tinsel at the bend. Wrap a smooth, shiny body forward to behind the eyes. Secure and trim." },
      { position: 3, title: "Add the flash wing", instruction: "Cut 20-30 strands of gold Flashabou. Tie them in behind the eyes so they extend past the bend about 1.5 shank lengths. Fold the butt ends back over the tie-in and secure for flash on both sides.", tip: "The flash is the entire wing. Use plenty — this fly is all about sparkle." },
      { position: 4, title: "Finish the fly", instruction: "Build a red thread head between the eyes and hook eye. Whip finish and apply head cement. The red thread head imitates bleeding gills." },
    ],
  },
  {
    name: "Conehead Bunny Leech",
    slug: "conehead-bunny-leech",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Conehead Bunny Leech is a heavy, pulsing leech imitation that uses a rabbit strip for maximum underwater movement. The cone head provides weight for a jigging action, while the rabbit fur undulates seductively. Essential for fishing deep pools and runs for large trout.",
    origin:
      "An evolution of traditional rabbit strip streamers, incorporating a cone head for added weight and the jigging action preferred by modern streamer anglers.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long streamer hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Black", required: true, position: 2 },
      { name: "Brass Cone Head", type: MaterialType.bead, description: "Brass cone.", customColor: "Black", required: true, position: 3 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Rabbit zonker strip.", customColor: "Black", required: true, position: 4 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Flash material.", customColor: "Purple", required: false, position: 5 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Lead wire for weight.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Add cone and weight", instruction: "Slide a black brass cone onto the hook. Place in vise. Wrap 10-12 turns of lead wire behind the cone. Secure with thread." },
      { position: 2, title: "Tie in flash and rabbit strip", instruction: "At the bend, tie in a few strands of purple Krystal Flash. Tie in a black rabbit strip on top with fur extending about 2 shank lengths past the bend." },
      { position: 3, title: "Palmer or bind the strip forward", instruction: "Bind the rabbit strip forward with spiral wire wraps or wrap it forward in touching turns. Secure behind the cone.", tip: "Part the rabbit fur with each wrap to keep the fibers free and mobile." },
      { position: 4, title: "Finish the fly", instruction: "Build a small thread collar behind the cone. Whip finish and apply head cement. The fly should have a full, flowing tail that pulses in the water." },
    ],
  },
  {
    name: "Woolly Bugger (Bead Head Olive)",
    slug: "bead-head-olive-woolly-bugger",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.both,
    description:
      "The Bead Head Olive Woolly Bugger is the most popular color variant of the classic pattern. The olive body with a gold bead imitates damselfly nymphs, small baitfish, and leeches. It is often the single most productive fly pattern in a guide's box.",
    origin:
      "A beadhead variant of Russell Blessing's original 1967 Woolly Bugger, combining the proven design with extra weight and flash from the bead.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long streamer hook.", customSize: "Size 6-12", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Standard tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Brass Bead", type: MaterialType.bead, description: "Brass bead head.", customColor: "Gold", customSize: "3.5mm-4.5mm", required: true, position: 3 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Olive marabou tail.", customColor: "Olive", required: true, position: 4 },
      { name: "Chenille (Medium)", type: MaterialType.body, description: "Olive chenille body.", customColor: "Olive", required: true, position: 5 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Palmer hackle.", customColor: "Grizzly dyed olive", required: true, position: 6 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Flash in tail.", customColor: "Olive", required: false, position: 7 },
    ],
    steps: [
      { position: 1, title: "Add bead and start", instruction: "Slide a gold brass bead onto the hook. Place in vise. Start olive thread behind the bead and wrap to the bend." },
      { position: 2, title: "Tie in tail and flash", instruction: "Tie in an olive marabou plume at the bend (one shank length). Add 4-6 strands of olive Krystal Flash along the sides of the tail." },
      { position: 3, title: "Tie in hackle and chenille", instruction: "At the bend, tie in a grizzly saddle hackle (dyed olive) by the tip and a piece of olive chenille." },
      { position: 4, title: "Wrap body and palmer hackle", instruction: "Wrap chenille forward to the bead in touching turns. Palmer the hackle forward over the body in open spirals. Secure both behind the bead and trim." },
      { position: 5, title: "Finish the fly", instruction: "Build a thread collar behind the bead. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Micro Bugger",
    slug: "micro-bugger",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Micro Bugger is a scaled-down version of the classic Woolly Bugger, tied on small hooks to imitate damselfly nymphs, small leeches, and midge larvae. It is especially effective in stillwater and on pressured streams where large flies spook fish.",
    origin:
      "A miniaturized adaptation of the Woolly Bugger, developed for situations where a smaller profile is more effective, particularly on heavily pressured waters.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Standard nymph hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Black", required: true, position: 2 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Small marabou tail.", customColor: "Black", required: true, position: 3 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl body.", required: true, position: 4 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Small hackle palmered over body.", required: true, position: 5 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Small tungsten bead.", customColor: "Black Nickel", customSize: "2.0mm", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Add bead and start thread", instruction: "Optionally add a small tungsten bead. Place in vise. Start thread and wrap to the bend." },
      { position: 2, title: "Tie in tail and materials", instruction: "Tie in a small tuft of marabou for the tail (keep it short — half a shank length). Tie in a small grizzly hackle by the tip and 2-3 peacock herls." },
      { position: 3, title: "Wrap body and hackle", instruction: "Twist the peacock herls with the thread into a rope. Wrap forward to the bead. Palmer the hackle forward in 3-4 open turns. Secure and trim." },
      { position: 4, title: "Finish the fly", instruction: "Whip finish behind the bead. Apply head cement. The fly should be sparse and small — resist overdressing." },
    ],
  },
  {
    name: "Sex Dungeon",
    slug: "sex-dungeon",
    category: FlyCategory.streamer,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description:
      "The Sex Dungeon is a massive articulated streamer designed to target trophy brown trout. Its two-hook articulated design produces an erratic, wounded-baitfish swimming action. This is a pattern for anglers who want to catch fewer but larger fish.",
    origin:
      "Created by Kelly Galloup at The Slide Inn in Montana. Part of his revolutionary approach to streamer fishing that has changed how anglers target trophy trout.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Stinger hooks (two, articulated).", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Articulation Shank", type: MaterialType.other, description: "Articulated shank or wire.", required: true, position: 3 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Marabou for tail.", customColor: "Olive/Black", required: true, position: 4 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Rabbit strip body.", customColor: "Olive", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash material.", customColor: "Olive/Gold", required: true, position: 6 },
      { name: "Sculpin Head", type: MaterialType.other, description: "Fish-Skull sculpin head.", customColor: "Olive", required: true, position: 7 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs for movement.", customColor: "Olive/Black Barred", required: false, position: 8 },
    ],
    steps: [
      { position: 1, title: "Build the rear hook", instruction: "Place the rear stinger hook in the vise. Tie in a marabou tail and flash. Wrap a rabbit strip body forward. Add rubber legs. Whip finish." },
      { position: 2, title: "Articulate the hooks", instruction: "Connect the rear hook to an articulation shank or front hook using interlocking wire loops or a beaded connector." },
      { position: 3, title: "Build the front section", instruction: "Tie in more marabou and flash on the front hook. Palmer rabbit strip forward. Add rubber legs at the mid-body point.", tip: "The articulation joint should allow the rear section to swing freely side to side." },
      { position: 4, title: "Add sculpin head and eyes", instruction: "Slide a Fish-Skull sculpin head onto the front hook. Add eyes and secure with UV resin. The finished fly should be 4-6 inches long with aggressive action." },
    ],
  },
  {
    name: "White Zonker",
    slug: "white-zonker",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.both,
    description:
      "The White Zonker is a versatile baitfish pattern that imitates shiners, smelt, and other silver-sided minnows. The white rabbit strip over a mylar body creates excellent flash and movement. Effective in both fresh and salt water for any species that feeds on baitfish.",
    origin:
      "A white/silver variant of Dan Byford's original Zonker pattern, adapted for imitating light-colored baitfish in a variety of waters.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "3X long hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong thread.", customColor: "White", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "White rabbit strip wing.", customColor: "White", required: true, position: 3 },
      { name: "Mylar Tubing", type: MaterialType.body, description: "Silver mylar body.", customColor: "Silver", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Wire to bind strip.", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash material.", customColor: "Silver", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Prepare the mylar body", instruction: "Place hook in vise. Slide silver mylar tubing over the shank. Secure at both ends with thread." },
      { position: 2, title: "Tie in and bind the rabbit strip", instruction: "Cut a white rabbit strip. Tie in the front end behind the eye. Bind it down along the top of the body with spiral wire wraps, parting the fur at each wrap." },
      { position: 3, title: "Add flash and finish", instruction: "Add strands of silver Flashabou along the sides. Build a thread head, whip finish, and apply head cement. Optionally add stick-on eyes." },
    ],
  },
];

// ─── Emergers ────────────────────────────────────────────────────────────────

const EMERGERS: ExtendedPatternDef[] = [
  {
    name: "RS2",
    slug: "rs2",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The RS2 (Rim Semi-2) is a sparse, minimalist emerger that imitates mayfly and midge emergers in the surface film. Its simplicity is its strength — just thread, dubbing, and a CDC or web-wing tuft. It is deadly during slow, selective feeding situations on spring creeks and tailwaters.",
    origin:
      "Created by Rim Chung in Colorado. The name stands for 'Rim Semi-2' referring to Chung's second version of his semi-dry emerger design.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved scud hook.", customSize: "Size 18-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Gray", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Split tailing fibers.", customColor: "Dun", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine dubbing.", customColor: "Adams Gray", required: true, position: 4 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC puff wing.", customColor: "Dun", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start fine gray thread and wrap to the bend. Tie in 2-3 Microfibbetts, splitting them wide." },
      { position: 2, title: "Dub a sparse body", instruction: "Apply the tiniest amount of gray dubbing. Dub a very slim body to the two-thirds point. Less is more on this pattern." },
      { position: 3, title: "Add CDC wing and finish", instruction: "Tie in a small tuft of dun CDC on top as an emerging wing. Trim to a short puff. Build a tiny thread head, whip finish, and apply minimal head cement.", tip: "The RS2 should be incredibly sparse. If it looks underdressed, it is probably right." },
    ],
  },
  {
    name: "Klinkhamer Special",
    slug: "klinkhamer-special",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Klinkhamer Special is a parachute emerger tied on a curved hook, designed so the body hangs below the surface while the hackle and wing sit in the film. This creates a remarkably realistic profile of a mayfly or caddis struggling to emerge. It is one of the most versatile and effective dry fly/emerger patterns in the world.",
    origin:
      "Created by Hans van Klinken, a Dutch fly tier, in the 1980s for grayling and trout fishing on Scandinavian rivers. It has become one of Europe's most popular fly patterns.",
    materials: [
      { name: "Tiemco TMC 200R Nymph Hook", type: MaterialType.hook, description: "Curved nymph hook.", customSize: "Size 10-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Body dubbing.", customColor: "Tan", required: true, position: 3 },
      { name: "Peacock Herl (Thorax)", type: MaterialType.thorax, description: "Peacock herl thorax.", required: true, position: 4 },
      { name: "Poly Yarn", type: MaterialType.wing, description: "Parachute post.", customColor: "White", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Parachute hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and post the wing", instruction: "Place the curved hook in the vise. Start thread and wrap to the thorax position (about one-third back from the eye). Tie in a post of white poly yarn. Build a sturdy upright post with thread wraps at the base." },
      { position: 2, title: "Dub the abdomen", instruction: "Wrap thread to the bend of the curved hook. Dub a slim tan abdomen from the bend forward to the post. The curved hook causes the abdomen to hang below the surface.", tip: "The curved hook is essential — it makes the body hang vertically in the film like a natural emerger." },
      { position: 3, title: "Build the thorax", instruction: "Wrap 2-3 peacock herls around the base of the post to build a bulky thorax." },
      { position: 4, title: "Wrap parachute hackle and finish", instruction: "Tie in a grizzly hackle at the base of the post. Wrap 4-5 parachute turns around the post. Secure the hackle tip below. Whip finish and apply head cement." },
    ],
  },
  {
    name: "CDC Emerger (Biot Body)",
    slug: "cdc-biot-emerger",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "This CDC Biot Emerger combines the natural segmentation of a goose biot body with the buoyancy and movement of CDC feathers. It hangs in the surface film at a natural angle, perfectly imitating a mayfly nymph shedding its shuck and emerging as a dun.",
    origin:
      "A modern pattern influenced by European emerger designs, combining two of the most effective natural materials — biots and CDC — into a single deadly package.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 16-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing shuck.", customColor: "Brown", required: true, position: 3 },
      { name: "Goose Biots", type: MaterialType.body, description: "Goose biot body.", customColor: "Olive", required: true, position: 4 },
      { name: "Superfine Dubbing", type: MaterialType.thorax, description: "Thorax dubbing.", customColor: "Dark Olive", required: true, position: 5 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC emerging wing.", customColor: "Dun", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in shuck", instruction: "Place hook in vise. Start olive thread and wrap to the bend. Tie in a sparse tuft of brown Z-Lon as a trailing shuck, about half a shank length." },
      { position: 2, title: "Wrap the biot body", instruction: "Tie in an olive goose biot by the tip at the bend. Wrap forward in touching turns to the two-thirds point. The natural ridges on the biot create segmentation.", tip: "Wrapping the biot one direction shows a smooth edge; the other direction shows a raised rib. Experiment with both." },
      { position: 3, title: "Add CDC wing and thorax", instruction: "Tie in a CDC feather as a wing puff at the two-thirds point. Dub a small dark olive thorax around the wing base. Build a tiny head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Sparkle Dun",
    slug: "sparkle-dun",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Sparkle Dun is a Comparadun variant with a trailing Z-Lon shuck instead of a traditional tail. This imitates a mayfly dun still attached to its nymphal shuck — the most vulnerable stage of emergence and exactly what selective trout target during a hatch.",
    origin:
      "Created by Craig Mathews and John Juracek of Blue Ribbon Flies in West Yellowstone, Montana. Published in their influential book on matching Yellowstone hatches.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing shuck material.", customColor: "Amber/Brown", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine dry fly dubbing.", customColor: "Olive", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Fanned deer hair wing.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in trailing shuck", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in a sparse bunch of amber Z-Lon for the trailing shuck, about three-quarters shank length." },
      { position: 2, title: "Dub the body", instruction: "Apply a thin layer of olive superfine dubbing. Dub a slim, tapered body to the one-third point behind the eye." },
      { position: 3, title: "Tie in the fanned deer hair wing", instruction: "Cut, clean, and stack a bunch of fine deer hair. Measure to one shank length. Tie it in with pinch wraps so it fans in a 180-degree arc. Trim butts at an angle.", tip: "The 180-degree fan is the defining feature. Use fine coastal deer hair for the best flare." },
      { position: 4, title: "Finish the fly", instruction: "Dub a small thorax over the trimmed butts. Build a tiny head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Barr Emerger (BWO)",
    slug: "barr-emerger-bwo",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Barr Emerger is a deadly subsurface emerger pattern that imitates a Blue-Winged Olive nymph rising toward the surface to hatch. Fished in the film or just below it, this pattern excels during BWO hatches when trout are taking emergers rather than adult duns on the surface.",
    origin:
      "Created by John Barr of Boulder, Colorado — the same innovative tier who created the Copper John.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 18-22", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "Pheasant tail fiber tail.", required: true, position: 3 },
      { name: "Pheasant Tail Fibers", type: MaterialType.body, description: "Pheasant tail fiber body.", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Copper wire rib.", required: true, position: 5 },
      { name: "Superfine Dubbing", type: MaterialType.thorax, description: "BWO thorax dubbing.", customColor: "BWO Olive", required: true, position: 6 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC emerging wing.", customColor: "Dun", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start brown thread and wrap to the bend. Tie in 3-4 pheasant tail fibers for a short tail." },
      { position: 2, title: "Build body and rib", instruction: "Wrap pheasant tail fibers forward for a slim body to the two-thirds point. Counter-wrap copper wire as a rib. Secure and trim." },
      { position: 3, title: "Add wing and thorax", instruction: "Tie in a small CDC puff as an emerging wing. Dub a BWO olive thorax around the wing base. Build a small head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Soft Hackle Partridge and Orange",
    slug: "soft-hackle-partridge-orange",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Partridge and Orange is the quintessential soft-hackle wet fly, dating back centuries. The soft partridge hackle fibers pulse and breathe in the current, suggesting an emerging insect or drowned caddis. Fished on the swing, it is one of the most effective and elegant techniques in fly fishing.",
    origin:
      "One of the oldest fly patterns still in use, with roots in the English North Country tradition dating to the 17th century. The exact origin is lost to history.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Standard wet fly hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Floss", type: MaterialType.body, description: "Orange floss body.", customColor: "Orange", required: true, position: 3 },
      { name: "Partridge Hackle", type: MaterialType.hackle, description: "Hungarian partridge soft hackle.", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Start thread and wrap the body", instruction: "Place hook in vise. Start orange thread and wrap to the bend. Tie in a strand of orange floss. Wrap a slim, smooth floss body forward to the one-quarter point behind the eye. Secure and trim." },
      { position: 2, title: "Tie in and wrap the soft hackle", instruction: "Select a Hungarian partridge body feather with barbs about one shank length. Strip the base fibers. Tie in by the tip behind the eye. Make 1.5-2 turns of hackle, sweeping the fibers rearward with each turn. Secure and trim.", tip: "Less is more with soft hackle. One and a half turns is usually perfect. The fibers should sweep back along the body." },
      { position: 3, title: "Finish the fly", instruction: "Build a small thread head. Whip finish and apply head cement. The fly should have a sparse, translucent appearance." },
    ],
  },
  {
    name: "CDC Loop Wing Emerger",
    slug: "cdc-loop-wing-emerger",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The CDC Loop Wing Emerger uses a looped CDC feather to create a wing bud that sits in the surface film. The loop shape is visible to the angler while creating a realistic emerging-wing silhouette. It excels during mayfly hatches when fish are taking insects in the film.",
    origin:
      "A modern European emerger design that has gained worldwide popularity for its effectiveness on selective trout during mayfly emergences.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing shuck.", customColor: "Light Brown", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine body dubbing.", customColor: "Olive/Brown", required: true, position: 4 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC loop wing.", customColor: "Dun", required: true, position: 5 },
      { name: "Superfine Dubbing", type: MaterialType.thorax, description: "Thorax dubbing.", customColor: "Dark Brown", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in shuck", instruction: "Place hook in vise. Start thread at the eye and wrap to the bend. Tie in a short trailing shuck of Z-Lon." },
      { position: 2, title: "Dub the abdomen", instruction: "Dub a slim, tapered abdomen of olive dubbing to the two-thirds point of the shank." },
      { position: 3, title: "Create the CDC loop wing", instruction: "Tie in a CDC feather by both the tip and butt, creating a loop about one shank length tall that stands upright above the thorax area. Secure both ends firmly.", tip: "The loop should be visible to the angler — it acts as both a wing and a sighting aid." },
      { position: 4, title: "Dub thorax and finish", instruction: "Dub a slightly bulkier dark brown thorax around the base of the loop wing. Build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Snowshoe Emerger",
    slug: "snowshoe-emerger",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Snowshoe Emerger uses the naturally buoyant foot hair from a snowshoe rabbit as a wing to float the fly in the surface film. It is one of the easiest and most effective emerger patterns to tie, and the snowshoe rabbit hair traps air bubbles that enhance its floating ability.",
    origin:
      "Developed in the fly fishing community as a simple, effective alternative to CDC-based emergers. Snowshoe rabbit hair floats naturally without any added floatant.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "Pheasant tail fiber tails.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Fine body dubbing.", customColor: "Brown/Olive", required: true, position: 4 },
      { name: "Snowshoe Rabbit Foot Hair", type: MaterialType.wing, description: "Naturally buoyant snowshoe hair.", customColor: "Natural/White", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tails", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in 3-4 pheasant tail fibers for a short tail." },
      { position: 2, title: "Dub the body", instruction: "Dub a slim, tapered body to the two-thirds point using olive or brown dubbing." },
      { position: 3, title: "Tie in snowshoe hair wing", instruction: "Cut a small bunch of snowshoe rabbit foot hair. Tie it in on top at the two-thirds point with tips extending forward and upward. Trim butts and cover with dubbing.", tip: "Snowshoe rabbit hair has natural water-repelling properties and floats without floatant — do not apply silicone products to it." },
      { position: 4, title: "Finish the fly", instruction: "Dub a small thorax around the wing base. Build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Quigley Cripple",
    slug: "quigley-cripple",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description:
      "The Quigley Cripple imitates a mayfly that has become stuck in its shuck during emergence — a crippled dun. Fish feed preferentially on cripples because they are easy prey that cannot escape. This pattern hangs in the film with the abdomen below and the wing and hackle above.",
    origin:
      "Created by Bob Quigley, a renowned California fly tier. The pattern has become a standard for matching selective feeding during mayfly hatches.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-20", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Short marabou shuck.", customColor: "Brown", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Body dubbing.", customColor: "Olive", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair wing.", customColor: "Natural", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Hackle collar.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in shuck", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in a small tuft of brown marabou as a trailing shuck, about half a shank length. This represents the nymphal exoskeleton." },
      { position: 2, title: "Dub the abdomen", instruction: "Dub a slim olive abdomen from the shuck to the midpoint of the shank." },
      { position: 3, title: "Tie in deer hair wing", instruction: "Cut, clean, and stack a small bunch of deer hair. Tie it in at the midpoint as an upright, slightly forward-angled wing. Trim butts." },
      { position: 4, title: "Add hackle and finish", instruction: "Tie in a grizzly hackle. Wrap 2-3 turns behind and in front of the wing. Dub a small thorax. Build a head, whip finish, and apply head cement.", tip: "The finished fly should sit with the abdomen hanging below the film and the hackle/wing above — the classic cripple posture." },
    ],
  },
  {
    name: "Iris Caddis",
    slug: "iris-caddis",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description:
      "The Iris Caddis is a superb caddis emerger that floats in the surface film with a trailing shuck. Its sparse design and low-riding profile make it irresistible to trout during caddis hatches. The pattern is named after the iridescent sheen of natural caddis pupae.",
    origin:
      "Another influential pattern from Craig Mathews and John Juracek of Blue Ribbon Flies, developed for the prolific caddis hatches of the Yellowstone region.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine tying thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing pupal shuck.", customColor: "Amber", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Rough dubbing body.", customColor: "Olive/Tan", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Sparse deer hair wing.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in trailing shuck", instruction: "Place hook in vise. Start thread and wrap to the bend. Tie in a sparse bunch of amber Z-Lon as a trailing pupal shuck." },
      { position: 2, title: "Dub the body", instruction: "Apply olive/tan hare's ear dubbing and dub a slightly rough body to the one-quarter point behind the eye." },
      { position: 3, title: "Tie in sparse deer hair wing and finish", instruction: "Tie in a sparse bunch of deer hair on top as a tent wing. Trim butts, dub over them to smooth the head, whip finish, and apply head cement.", tip: "Keep the wing very sparse. The Iris Caddis is meant to be a minimalist pattern." },
    ],
  },
];

// ─── Saltwater ───────────────────────────────────────────────────────────────

const SALTWATER: ExtendedPatternDef[] = [
  {
    name: "Gotcha",
    slug: "gotcha",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description:
      "The Gotcha is a staple bonefish pattern that imitates small shrimp and crabs on tropical flats. Its slim profile, bead chain eyes, and craft fur wing make it easy to cast in wind. Second only to the Crazy Charlie in bonefish fly popularity.",
    origin:
      "Developed in the Bahamas for bonefishing. The name refers to what guides shout when a bonefish takes the fly.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Standard saltwater hook.", customSize: "Size 4-8", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Pink", required: true, position: 2 },
      { name: "Krystal Flash", type: MaterialType.body, description: "Krystal Flash body.", customColor: "Pearl", required: true, position: 3 },
      { name: "Craft Fur", type: MaterialType.wing, description: "Craft fur wing.", customColor: "Tan/Pink", required: true, position: 4 },
      { name: "Bead Chain Eyes", type: MaterialType.weight, description: "Bead chain eyes.", customSize: "Small", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in eyes", instruction: "Place hook in vise. Start thread one-quarter back from the eye. Tie in bead chain eyes with figure-eight wraps. Apply super glue." },
      { position: 2, title: "Build the body", instruction: "Wrap thread to the bend. Tie in 8-10 strands of pearl Krystal Flash. Wrap them forward in a smooth, even body to behind the eyes. Secure and trim." },
      { position: 3, title: "Add the wing and finish", instruction: "Tie in a sparse bunch of tan or pink craft fur behind the eyes as a wing, extending past the hook bend. Build a thread head, whip finish, and apply head cement.", tip: "Fish the Gotcha on flats with a slow strip-strip-pause retrieve." },
    ],
  },
  {
    name: "Bonefish Bitter",
    slug: "bonefish-bitter",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description:
      "The Bonefish Bitter is a clean, effective shrimp pattern for bonefishing on shallow flats. Its translucent body and sparse profile look incredibly realistic in clear, shallow water where bonefish are spooky and selective.",
    origin:
      "A classic Bahamian bonefish pattern that has stood the test of time across Caribbean, Central American, and Pacific Island flats.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 4-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Tan", required: true, position: 2 },
      { name: "EP Fiber", type: MaterialType.wing, description: "Sparse EP fiber wing.", customColor: "Tan", required: true, position: 3 },
      { name: "Krystal Flash", type: MaterialType.body, description: "Flash body.", customColor: "Root Beer", required: true, position: 4 },
      { name: "Bead Chain Eyes", type: MaterialType.weight, description: "Bead chain eyes.", customSize: "Medium", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in eyes", instruction: "Place hook in vise. Start thread one-quarter back from the eye. Tie in bead chain eyes with figure-eight wraps." },
      { position: 2, title: "Build body and wing", instruction: "Wrap to the bend. Tie in Krystal Flash strands and wrap a slim body forward. Tie in sparse EP fiber wing. Finish head and apply cement." },
    ],
  },
  {
    name: "EP Baitfish",
    slug: "ep-baitfish",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description:
      "The EP Baitfish is a modern saltwater streamer that uses EP (Enrico Puglisi) fibers to create a translucent, realistic baitfish profile. It is incredibly versatile, castable in wind, and can be tied to imitate any baitfish species by varying color and size.",
    origin:
      "Developed by Enrico Puglisi, an innovative fly tier whose synthetic fibers revolutionized saltwater fly tying by creating flies that are lighter, more durable, and more translucent than natural materials.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "White", required: true, position: 2 },
      { name: "EP Fiber", type: MaterialType.body, description: "EP fiber body material.", customColor: "White (belly) / Olive (back)", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash lateral line.", customColor: "Silver", required: true, position: 4 },
      { name: "3D Stick-On Eyes", type: MaterialType.other, description: "Prismatic eyes.", customSize: "5-7mm", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build the white belly layer", instruction: "Place hook in vise. Start thread behind the eye. Tie in bunches of white EP fiber at several points along the shank, building a full belly profile. Add flash along the lateral line." },
      { position: 2, title: "Add the colored back", instruction: "Tie in olive or blue EP fiber on top of each white bunch to create the dark back. The color should transition from dark on top to white on the belly." },
      { position: 3, title: "Shape and add eyes", instruction: "Brush the fibers back to blend them. Trim the overall profile into a baitfish shape — tapered at both ends with a full midsection. Apply stick-on eyes and lock with UV resin.", tip: "EP flies are designed to be trimmed. Do not be shy with the scissors — shaping is what makes the fly look realistic." },
    ],
  },
  {
    name: "Merkin Crab",
    slug: "merkin-crab",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description:
      "The Merkin Crab (also known as Del's Merkin) is the standard permit fly and one of the most important crab patterns in saltwater fly fishing. Its flat, disc-shaped body and rubber legs create a realistic crab silhouette. Permit, bonefish, and redfish all eat it eagerly.",
    origin:
      "Created by Del Brown for permit fishing in the Florida Keys. Del Brown is legendary for catching more permit on a fly rod than anyone in history at the time.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Tan", required: true, position: 2 },
      { name: "EP Fiber", type: MaterialType.body, description: "Craft fur or EP fiber for body.", customColor: "Tan", required: true, position: 3 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs for crab legs.", customColor: "Tan/Barred", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead eyes for weight.", customSize: "Medium", required: true, position: 5 },
      { name: "Yarn", type: MaterialType.other, description: "Yarn body disc.", customColor: "Tan/Olive", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in eyes and legs", instruction: "Place hook in vise point up. Start thread and tie in lead dumbbell eyes near the bend. Tie in 4-6 rubber legs on each side, splayed outward." },
      { position: 2, title: "Build the body disc", instruction: "Using rug yarn or EP fiber, build a flat, round crab body by stacking and securing bunches across the shank. Flatten and trim into a disc shape.", tip: "The body should be flat and round like a silver dollar when viewed from above." },
      { position: 3, title: "Add claws and finish", instruction: "Tie in small EP fiber or craft fur claws at the front. Whip finish and apply super glue to all thread wraps. Color the body with markers if desired to match local crab species.", tip: "Vary the color to match local crabs — tan for sand flats, olive for turtle grass, dark brown for rocky bottoms." },
    ],
  },
  {
    name: "Surf Candy",
    slug: "surf-candy",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description:
      "The Surf Candy is an epoxy-coated baitfish pattern that is nearly indestructible. Its hard, translucent body imitates glass minnows, bay anchovies, and silversides. The epoxy coating makes it incredibly durable — a single fly can last through dozens of bluefish.",
    origin:
      "Created by Bob Popovics, one of the most innovative saltwater fly tiers on the New Jersey coast. His epoxy techniques revolutionized saltwater fly durability.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "White", required: true, position: 2 },
      { name: "Bucktail", type: MaterialType.wing, description: "Sparse bucktail wing.", customColor: "White/Olive", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash lateral line.", customColor: "Silver", required: true, position: 4 },
      { name: "3D Stick-On Eyes", type: MaterialType.other, description: "Prismatic eyes.", required: true, position: 5 },
      { name: "Epoxy or UV Resin", type: MaterialType.other, description: "Epoxy for body coating.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build the bucktail body", instruction: "Place hook in vise. Start thread. Tie in sparse white bucktail along the shank. Add silver flash along the sides. Tie in olive or blue bucktail on top for the back. Build a thread head and whip finish." },
      { position: 2, title: "Add eyes", instruction: "Apply stick-on prismatic eyes to each side of the head area." },
      { position: 3, title: "Coat with epoxy", instruction: "Mix a batch of 5-minute epoxy or use UV resin. Coat the head and forward third of the body, encasing the eyes. Rotate the fly while the epoxy sets to prevent sagging. The coating should be smooth and clear.", tip: "Use a rotary dryer or turn the fly by hand every 30 seconds until the epoxy sets. This prevents drips and ensures an even coat." },
    ],
  },
  {
    name: "Gurgler",
    slug: "gurgler",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description:
      "The Gurgler is a topwater saltwater pattern that pushes water and creates a commotion on the surface. The foam lip scoops water as it is stripped, producing a gurgling, popping sound that drives striped bass, bluefish, and other surface predators into a frenzy.",
    origin:
      "Created by Jack Gartside, a legendary Boston-based fly tier known for his innovative use of unconventional materials.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "White", required: true, position: 2 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Marabou tail.", customColor: "White", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash in tail.", customColor: "Silver", required: true, position: 4 },
      { name: "Foam Sheet", type: MaterialType.body, description: "Closed-cell foam for body and lip.", customColor: "White", required: true, position: 5 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Hackle collar.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tail", instruction: "Place hook in vise. Start thread at the bend. Tie in a full marabou tail with flash on the sides. The tail should be about 1.5 shank lengths." },
      { position: 2, title: "Tie in foam and build body", instruction: "Cut a strip of closed-cell foam about 1.5 times the hook shank length and twice the hook gap width. Tie in the rear end at the tail. Advance thread forward, making segmented wraps to bind the foam to the shank, leaving the front portion extending past the hook eye.", tip: "The foam segments create the body. Leave enough foam extending forward to form the gurgling lip." },
      { position: 3, title: "Create the lip and finish", instruction: "Fold the extending foam back over itself and tie down behind the eye to create a scoop-shaped lip. Optionally wrap a hackle collar behind the lip. Whip finish and apply super glue to the thread wraps.", tip: "The lip shape determines the action. A wider, more scooped lip creates more disturbance." },
    ],
  },
  {
    name: "Tarpon Toad",
    slug: "tarpon-toad",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description:
      "The Tarpon Toad is a low-profile, weedless tarpon fly that pushes through grass and debris without fouling. Its flat, compressed profile and mono weed guard make it ideal for fishing in and around mangrove edges and grass flats where tarpon patrol.",
    origin:
      "Developed by Florida Keys guides for the specific challenges of tarpon fishing in shallow, weedy environments.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Strong, wide-gap hook.", customSize: "Size 1/0-3/0", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong flat thread.", customColor: "Black", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.tail, description: "Rabbit strip tail.", customColor: "Black/Purple", required: true, position: 3 },
      { name: "EP Fiber", type: MaterialType.body, description: "EP fiber body layers.", customColor: "Black/Purple", required: true, position: 4 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash accents.", customColor: "Purple", required: true, position: 5 },
      { name: "Mono Weed Guard", type: MaterialType.other, description: "Monofilament weed guard.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build the tail section", instruction: "Place hook in vise. Start thread at the bend. Tie in a rabbit strip tail and flash. The tail should be about 2 shank lengths." },
      { position: 2, title: "Build the body in layers", instruction: "Tie in EP fiber in flat, wide bunches along the shank to create a compressed, toad-like profile. Alternate dark and light layers. Add flash between layers." },
      { position: 3, title: "Add weed guard and finish", instruction: "Tie in a mono loop weed guard at the eye. Shape the EP fiber body by trimming into a flat, broad profile. Apply eyes and UV resin head.", tip: "The flat profile is key — it prevents the fly from rolling on the strip." },
    ],
  },
  {
    name: "Avalon Permit Fly",
    slug: "avalon-permit-fly",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description:
      "The Avalon Permit Fly is a crab pattern specifically designed for permit fishing on Cayo Largo and other Cuban flats. Its weighted design and realistic profile have proven deadly for the notoriously selective permit. It sinks quickly and lands softly.",
    origin:
      "Developed for the famous permit fishing at Cayo Largo (Avalon) in Cuba, where some of the world's best permit fishing exists.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Craft Fur", type: MaterialType.body, description: "Craft fur for body.", customColor: "Tan/Olive", required: true, position: 3 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber crab legs.", customColor: "Tan Barred", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead eyes.", customSize: "Small-Medium", required: true, position: 5 },
      { name: "EP Fiber", type: MaterialType.wing, description: "EP fiber claw tips.", customColor: "Tan", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in eyes and legs", instruction: "Place hook in vise point up. Tie in lead dumbbell eyes at the bend. Tie in rubber legs splayed to each side." },
      { position: 2, title: "Build the crab body", instruction: "Stack and tie in bunches of craft fur across the shank to create a flat, round crab body. Add EP fiber claws at the front. Trim into a crab-shaped disc." },
      { position: 3, title: "Finish and color", instruction: "Whip finish and apply super glue to all thread wraps. Use waterproof markers to add mottled coloring to match local crab species." },
    ],
  },
  {
    name: "Seaducer",
    slug: "seaducer",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description:
      "The Seaducer is a large, flashy saltwater hackle fly that imitates baitfish, shrimp, and generic prey items. Its long, flowing hackle creates incredible movement in the water. It is effective for a wide range of saltwater species including snook, redfish, seatrout, and baby tarpon.",
    origin:
      "A classic saltwater pattern with roots in the Southeastern US guide community. The Seaducer is one of the foundational saltwater fly patterns.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Red", required: true, position: 2 },
      { name: "White Saddle Hackle", type: MaterialType.tail, description: "Long saddle hackle tail.", customColor: "White", required: true, position: 3 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Palmer hackle.", customColor: "Grizzly", required: true, position: 4 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: false, position: 5 },
    ],
    steps: [
      { position: 1, title: "Start thread and tie in tail hackles", instruction: "Place hook in vise. Start red thread at the bend. Tie in 4-6 white saddle hackle feathers as a flowing tail, splayed slightly. Add flash along the sides." },
      { position: 2, title: "Palmer hackle forward", instruction: "Tie in a grizzly saddle hackle at the bend. Palmer it forward in close turns to create a full, bushy body. You may need 2-3 hackle feathers to cover the full shank. Secure behind the eye." },
      { position: 3, title: "Build head and finish", instruction: "Build a bulky red thread head. Whip finish and apply several coats of head cement for a glossy finish." },
    ],
  },
  {
    name: "Puglisi Spawning Shrimp",
    slug: "puglisi-spawning-shrimp",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.advanced,
    waterType: WaterType.saltwater,
    description:
      "The Puglisi Spawning Shrimp is an ultra-realistic shrimp pattern using EP fibers layered to create a translucent, lifelike body. It is one of the most effective patterns for bonefish, permit, and redfish on shallow flats where crustaceans are the primary food source.",
    origin:
      "Created by Enrico Puglisi, whose EP fiber material system allows tiers to create incredibly realistic, translucent baitfish and crustacean imitations.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Tan", required: true, position: 2 },
      { name: "EP Fiber", type: MaterialType.body, description: "EP fiber for body layers.", customColor: "Shrimp Tan/Orange", required: true, position: 3 },
      { name: "EP Fiber", type: MaterialType.other, description: "EP fiber for legs and antennae.", customColor: "Tan/Clear", required: true, position: 4 },
      { name: "Bead Chain Eyes", type: MaterialType.weight, description: "Bead chain or mono eyes.", customSize: "Small", required: true, position: 5 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Flash in body.", customColor: "Root Beer", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build the shrimp tail", instruction: "Place hook in vise. Start thread at the bend. Tie in a fan of EP fibers as the shrimp tail, trimmed into a broad fan shape." },
      { position: 2, title: "Build the body in layers", instruction: "Working forward, tie in successive bunches of EP fiber, building up a tapered shrimp body. Add flash between layers. Tie in thin EP fiber legs at several points along the body." },
      { position: 3, title: "Add eyes, antennae, and finish", instruction: "Tie in bead chain or mono eyes at the head. Add long EP fiber antennae. Trim the body into a curved shrimp profile. Apply UV resin to the head area for durability.", tip: "The translucency of EP fiber is what makes this pattern so realistic. Do not overdress — light should pass through the body." },
    ],
  },
];

// ─── Combine all patterns ────────────────────────────────────────────────────

const ALL_EXTENDED_PATTERNS: ExtendedPatternDef[] = [
  ...DRY_FLIES,
  ...NYMPHS,
  ...STREAMERS,
  ...EMERGERS,
  ...SALTWATER,
];

// ─── Seed function ───────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Seeding ${ALL_EXTENDED_PATTERNS.length} extended fly patterns...`
  );

  let created = 0;
  let skipped = 0;

  for (const patternDef of ALL_EXTENDED_PATTERNS) {
    // Upsert the fly pattern itself
    const pattern = await prisma.flyPattern.upsert({
      where: { slug: patternDef.slug },
      update: {
        description: patternDef.description,
        origin: patternDef.origin,
      },
      create: {
        name: patternDef.name,
        slug: patternDef.slug,
        category: patternDef.category,
        difficulty: patternDef.difficulty,
        waterType: patternDef.waterType,
        description: patternDef.description,
        origin: patternDef.origin,
      },
    });

    // Seed materials and link them (skip if pattern already has materials)
    const existingMaterials = await prisma.flyPatternMaterial.count({
      where: { flyPatternId: pattern.id },
    });

    if (existingMaterials === 0 && patternDef.materials.length > 0) {
      for (const matDef of patternDef.materials) {
        // Upsert the material itself
        const material = await prisma.material.upsert({
          where: { name_type: { name: matDef.name, type: matDef.type } },
          update: {},
          create: {
            name: matDef.name,
            type: matDef.type,
            description: matDef.description,
          },
        });

        // Link material to pattern
        await prisma.flyPatternMaterial.create({
          data: {
            flyPatternId: pattern.id,
            materialId: material.id,
            customColor: matDef.customColor,
            customSize: matDef.customSize,
            required: matDef.required,
            position: matDef.position,
          },
        });
      }
    }

    // Seed tying steps (skip if pattern already has steps)
    const existingSteps = await prisma.tyingStep.count({
      where: { flyPatternId: pattern.id },
    });

    if (existingSteps === 0 && patternDef.steps.length > 0) {
      await prisma.tyingStep.createMany({
        data: patternDef.steps.map((s) => ({
          flyPatternId: pattern.id,
          position: s.position,
          title: s.title,
          instruction: s.instruction,
          tip: s.tip,
        })),
      });
    }

    const isNew = existingMaterials === 0;
    if (isNew) {
      created++;
    } else {
      skipped++;
    }

    console.log(
      `  ${isNew ? "+" : "~"} ${patternDef.name} (${patternDef.materials.length} materials, ${patternDef.steps.length} steps)`
    );
  }

  console.log(
    `\nDone! Created ${created}, updated ${skipped} (${ALL_EXTENDED_PATTERNS.length} total patterns)`
  );
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
