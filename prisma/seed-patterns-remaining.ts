import {
  PrismaClient,
  FlyCategory,
  Difficulty,
  WaterType,
  MaterialType,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types (same as seed-patterns-extended) ──────────────────────────────────

interface PatternDef {
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

// ─── Dry Flies (30 remaining) ────────────────────────────────────────────────

const DRY_FLIES: PatternDef[] = [
  {
    name: "Goddard Caddis",
    slug: "goddard-caddis",
    category: FlyCategory.dry,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description: "The Goddard Caddis uses spun and clipped deer hair to create an unsinkable caddis imitation. It floats like a cork even in the fastest water and produces a realistic caddis silhouette when viewed from below. An excellent searching pattern and indicator fly.",
    origin: "Created by John Goddard and Cliff Henry in England. Goddard is one of the most influential fly fishing entomologists of the 20th century.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Standard dry fly hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Tying thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Deer Hair", type: MaterialType.body, description: "Spun deer hair body.", customColor: "Natural Tan", required: true, position: 3 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Collar hackle.", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Spin deer hair body", instruction: "Place hook in vise. Start thread at the bend. Spin small bunches of deer hair along the shank from bend to eye, packing each bunch tightly. Use Danville flat waxed nylon for extra flaring power." },
      { position: 2, title: "Trim to caddis shape", instruction: "Remove from vise. Trim the deer hair into a tent-shaped caddis silhouette — flat on the bottom, peaked on top. Leave the tips at the rear untrimmed as the wing.", tip: "Trim the bottom completely flat so the fly sits properly on the water." },
      { position: 3, title: "Add hackle and finish", instruction: "Return to vise. Tie in a brown hackle at the front and wrap 2-3 turns. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Dave's Hopper",
    slug: "daves-hopper",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "Dave's Hopper is the classic grasshopper imitation for trout and bass. Its turkey quill wing, yellow body, and deer hair collar create a realistic profile that drives fish wild during late summer terrestrial season. It is the standard against which all hopper patterns are measured.",
    origin: "Created by Dave Whitlock, one of the most influential American fly tiers and anglers, in the 1970s.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 6-12", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Yellow Yarn", type: MaterialType.tail, description: "Yarn tail loop.", customColor: "Yellow/Red", required: true, position: 3 },
      { name: "Yellow Yarn", type: MaterialType.body, description: "Yellow body.", customColor: "Yellow", required: true, position: 4 },
      { name: "Turkey Quill Sections", type: MaterialType.wing, description: "Mottled turkey quill wing.", required: true, position: 5 },
      { name: "Deer Hair", type: MaterialType.other, description: "Deer hair collar and head.", customColor: "Natural", required: true, position: 6 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Knotted rubber legs.", customColor: "Yellow", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Build body and tail", instruction: "Place hook in vise. Start thread at the bend. Tie in a small loop of yellow/red yarn as the tail. Dub or wrap a yellow body forward to the two-thirds point." },
      { position: 2, title: "Add wing and legs", instruction: "Tie in matched turkey quill sections as a tent wing over the body. Add knotted rubber legs on each side." },
      { position: 3, title: "Spin deer hair head", instruction: "Spin 2-3 bunches of deer hair at the front, packing tightly. Trim into a flat-bottomed, rounded muddler-style head. Whip finish." },
    ],
  },
  {
    name: "Foam Beetle",
    slug: "foam-beetle",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Foam Beetle is an easy-to-tie terrestrial that is deadly during summer months when beetles are blown onto the water. Its foam body is virtually unsinkable, making it an excellent indicator fly. Trout eat beetles with confident, splashy takes.",
    origin: "A modern evolution of traditional beetle patterns, using closed-cell foam instead of deer hair for better floatation and durability.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Foam Sheet", type: MaterialType.body, description: "Black foam sheet.", customColor: "Black", required: true, position: 3 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl underbody.", required: true, position: 4 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Thin rubber legs.", customColor: "Black", required: false, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie in foam and underbody", instruction: "Place hook in vise. Cut a strip of black foam. Start thread and tie in the foam strip at the bend with the excess extending rearward. Wrap 2-3 peacock herls forward as an underbody." },
      { position: 2, title: "Pull foam over and add legs", instruction: "Pull the foam strip forward over the body. Tie it down at the one-third point. Optionally add rubber legs. Pull foam over the remaining section and tie down behind the eye." },
      { position: 3, title: "Finish", instruction: "Trim the foam extending past the eye into a short head. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Chernobyl Ant",
    slug: "chernobyl-ant",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Chernobyl Ant is a massive, foam-bodied terrestrial attractor that floats like a pontoon boat. Despite its cartoonish appearance, it is one of the most effective big-trout dry flies. It doubles perfectly as an indicator for dropper nymphs beneath it.",
    origin: "Originated in the Western US, likely in the 1990s. Named for its outsized, mutant-like proportions compared to natural ants.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Black", required: true, position: 2 },
      { name: "Foam Sheet", type: MaterialType.body, description: "Layered foam body.", customColor: "Black/Orange", required: true, position: 3 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Round rubber legs.", customColor: "Black/White Barred", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Layer foam strips", instruction: "Cut two foam strips — one black, one orange. Stack them and tie in at the bend. Fold the foam forward to create the rear body segment." },
      { position: 2, title: "Add legs and create segments", instruction: "Tie in rubber legs at the midpoint (figure-eight wraps). Fold foam forward again to create the thorax/head segment. Add another set of legs at the front." },
      { position: 3, title: "Finish", instruction: "Tie down the foam behind the eye. Trim into a rounded head shape. Whip finish and apply super glue to thread wraps." },
    ],
  },
  {
    name: "Hi-Vis Ant",
    slug: "hi-vis-ant",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Hi-Vis Ant uses a fluorescent post for visibility while maintaining a realistic ant silhouette in the surface film. Flying ants are one of the most underrated food sources for trout, and this pattern catches fish consistently when ants are on the water.",
    origin: "A modern adaptation of traditional ant patterns, adding a sighting post to make tiny ants visible on the water.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 16-22", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine thread.", customColor: "Black", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Dubbing for ant body segments.", customColor: "Black", required: true, position: 3 },
      { name: "Poly Yarn", type: MaterialType.wing, description: "Fluorescent sighting post.", customColor: "Fluorescent Orange", required: true, position: 4 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Small hackle collar.", required: false, position: 5 },
    ],
    steps: [
      { position: 1, title: "Dub the rear abdomen", instruction: "Place hook in vise. Start thread at the bend. Dub a bulbous rear abdomen segment using black dubbing, about one-third of the shank." },
      { position: 2, title: "Add waist and sighting post", instruction: "Create a thin waist of bare thread. Tie in a short post of fluorescent poly yarn. Optionally wrap 1-2 turns of small hackle at the waist." },
      { position: 3, title: "Dub front segment and finish", instruction: "Dub a slightly smaller front thorax/head segment. Build a small head, whip finish, and apply head cement. Trim the poly post to about one shank length." },
    ],
  },
  {
    name: "Improved Sofa Pillow",
    slug: "improved-sofa-pillow",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Improved Sofa Pillow is a large attractor stonefly dry that excels during salmonfly and golden stonefly hatches on western rivers. Its elk hair wing and palmered hackle make it visible in fast, broken water. A must-have pattern during the famous salmonfly hatch.",
    origin: "An improved version of Pat Barnes' original Sofa Pillow, refined for the massive stonefly hatches of Montana, Idaho, and Oregon rivers.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 4-8", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Elk Body Hair", type: MaterialType.tail, description: "Elk hair tail.", customColor: "Natural", required: true, position: 3 },
      { name: "Antron Yarn", type: MaterialType.body, description: "Antron yarn body.", customColor: "Orange", required: true, position: 4 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Palmer hackle.", required: true, position: 5 },
      { name: "Elk Hair (Wing)", type: MaterialType.wing, description: "Elk hair wing.", customColor: "Natural", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in tail and body materials", instruction: "Place hook in vise. Tie in an elk hair tail at the bend, then a brown hackle and orange Antron yarn." },
      { position: 2, title: "Wrap body and palmer hackle", instruction: "Wrap the yarn forward as the body. Palmer the hackle forward over the body. Secure at the two-thirds point." },
      { position: 3, title: "Add wing and finish", instruction: "Tie in a large elk hair wing at the two-thirds point. Build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Yellow Sally",
    slug: "yellow-sally",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Yellow Sally imitates small yellow stoneflies (Isoperla) that hatch in late spring and summer. These tiny bright yellow stoneflies are often overlooked but provide excellent dry fly fishing. A simple and effective pattern for freestone streams.",
    origin: "Yellow Sally patterns have been tied by many tiers to match the common small yellow stonefly found across North America and Europe.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Yellow dubbing.", customColor: "Pale Yellow", required: true, position: 3 },
      { name: "Elk Hair (Wing)", type: MaterialType.wing, description: "Pale elk hair wing.", customColor: "Light Natural", required: true, position: 4 },
      { name: "Light Ginger Hackle", type: MaterialType.hackle, description: "Pale ginger hackle.", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Dub body", instruction: "Place hook in vise. Start yellow thread and wrap to the bend. Dub a slim pale yellow body to the one-third point." },
      { position: 2, title: "Add wing and hackle", instruction: "Tie in a light elk hair wing. Tie in a pale ginger hackle and wrap 2-3 turns. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Green Drake",
    slug: "green-drake",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Green Drake imitates one of the largest and most anticipated mayfly hatches in North America. Ephemera guttulata hatches create explosive surface feeding. These big flies bring up the biggest fish and the hatch is often measured in hours, not days.",
    origin: "Green Drake patterns have been tied for centuries. American versions were developed for the famous Eastern hatches, particularly in Pennsylvania's limestone country.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 8-12", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Moose Body Hair", type: MaterialType.tail, description: "Moose hair tails.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Body dubbing.", customColor: "Olive/Cream", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Comparadun-style deer hair wing.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie in tails and dub body", instruction: "Tie in moose body hair tails. Dub an olive/cream body forward to the one-third point." },
      { position: 2, title: "Add deer hair wing and finish", instruction: "Tie in a fanned deer hair wing. Dub a thorax around the base. Build head, whip finish, and apply cement." },
    ],
  },
  {
    name: "Brown Drake",
    slug: "brown-drake",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Brown Drake imitates Ephemera simulans, a large burrowing mayfly that hatches after dark on many rivers. Brown Drake hatches are brief, intense, and attract the biggest trout. A must-have pattern for Michigan's famous Au Sable River and similar waters.",
    origin: "Brown Drake patterns were developed primarily for the legendary hatches on Michigan's Au Sable River and have spread to match similar hatches across the northern US.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 10-12", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Moose Body Hair", type: MaterialType.tail, description: "Moose hair tails.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Brown dubbing.", customColor: "Yellowish Brown", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair wing.", customColor: "Natural", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Dyed brown grizzly hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in tails and dub body", instruction: "Tie in moose hair tails splayed wide. Dub a yellowish-brown body to the one-third point." },
      { position: 2, title: "Add wing, hackle, and finish", instruction: "Tie in a deer hair wing. Add brown grizzly hackle 2-3 turns. Whip finish and apply cement." },
    ],
  },
  {
    name: "Joe's Hopper",
    slug: "joes-hopper",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "Joe's Hopper is a classic grasshopper pattern that uses a clipped deer hair body and turkey quill wings. It has a distinctive flattened profile and rides low on the water, creating the impression of a struggling grasshopper. A proven big-fish pattern during summer.",
    origin: "Created by Michigan tier Joe Brooks in the 1950s. It remains one of the most iconic hopper patterns despite many modern alternatives.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 6-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Red Hackle Fibers", type: MaterialType.tail, description: "Red hackle fiber tail.", required: true, position: 3 },
      { name: "Yellow Yarn", type: MaterialType.body, description: "Yellow yarn body.", customColor: "Yellow", required: true, position: 4 },
      { name: "Turkey Quill Sections", type: MaterialType.wing, description: "Turkey quill wings.", required: true, position: 5 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Brown hackle collar.", required: true, position: 6 },
      { name: "Deer Hair", type: MaterialType.other, description: "Clipped deer hair head.", customColor: "Natural", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Build tail and body", instruction: "Tie in red hackle fiber tail. Wrap yellow yarn body to the two-thirds point." },
      { position: 2, title: "Add wings, hackle, and head", instruction: "Tie in turkey quill wings tent-style. Add brown hackle collar. Spin deer hair head and trim flat on the bottom. Whip finish." },
    ],
  },
  {
    name: "Ausable Wulff",
    slug: "ausable-wulff",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Ausable Wulff is a robust, high-floating attractor dry designed for the tumbling pocket water of the Ausable River in the Adirondacks. Its orange-rust body and white wings make it easy to see in rough water while remaining attractive to trout.",
    origin: "Developed by Francis Betters for the fast, rocky waters of New York's Ausable River. Betters' fly shop on the river became legendary.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Moose Body Hair", type: MaterialType.tail, description: "Moose hair tails.", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Rusty dubbing.", customColor: "Rust/Orange", required: true, position: 4 },
      { name: "Calf Body Hair", type: MaterialType.wing, description: "White calf body hair wings.", customColor: "White", required: true, position: 5 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Brown hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in tails and dub body", instruction: "Tie in moose body hair tails. Dub a rust/orange body to the one-third point." },
      { position: 2, title: "Add wings, hackle, and finish", instruction: "Post white calf body hair wings upright, divided. Wrap brown hackle behind and in front of wings. Whip finish." },
    ],
  },
  {
    name: "Irresistible",
    slug: "irresistible",
    category: FlyCategory.dry,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description: "The Irresistible features a spun deer hair body that makes it virtually unsinkable. It is a classic attractor pattern for fast, broken water where buoyancy matters more than exact imitation. The deer hair body also gives it a unique silhouette when viewed from below.",
    origin: "A traditional American dry fly pattern that has been a staple in eastern fly boxes for decades. The spun hair body technique dates back to early American fly tying tradition.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Gray", required: true, position: 2 },
      { name: "Deer Hair", type: MaterialType.tail, description: "Deer hair tail.", customColor: "Natural", required: true, position: 3 },
      { name: "Deer Hair", type: MaterialType.body, description: "Spun and clipped deer hair body.", customColor: "Natural", required: true, position: 4 },
      { name: "Calf Body Hair", type: MaterialType.wing, description: "Upright divided wings.", customColor: "White", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Hackle collar.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in tail and spin body", instruction: "Tie in deer hair tail. Spin deer hair along the shank from bend to midpoint. Pack tightly and trim into a rounded body shape." },
      { position: 2, title: "Add wings, hackle, and finish", instruction: "Tie in calf body hair wings, post upright, and divide. Wrap grizzly hackle. Build head, whip finish." },
    ],
  },
  {
    name: "Renegade",
    slug: "renegade",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Renegade is a fore-and-aft hackled fly with a brown hackle at the rear and a white hackle at the front. This unusual construction creates a versatile pattern that can be fished dry, wet, or in the film. It is especially effective on mountain brookies and cutthroat.",
    origin: "A traditional Western pattern of uncertain origin that has been a favorite for high-altitude lake and stream fishing for over a century.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl body.", required: true, position: 3 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Rear hackle.", required: true, position: 4 },
      { name: "White Saddle Hackle", type: MaterialType.hackle, description: "Front white hackle.", customColor: "White", required: true, position: 5 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.rib, description: "Tag at rear.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Wrap rear hackle", instruction: "Place hook in vise. Start thread at the bend. Wrap 2-3 turns of brown hackle at the bend. Secure." },
      { position: 2, title: "Wrap peacock herl body", instruction: "Tie in peacock herls and wrap a full body forward to the one-quarter point behind the eye." },
      { position: 3, title: "Wrap front hackle and finish", instruction: "Wrap 2-3 turns of white hackle at the front. Build a head, whip finish, and apply head cement." },
    ],
  },
  {
    name: "Sulphur Dun",
    slug: "sulphur-dun",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Sulphur Dun imitates Ephemerella dorothea and rotunda mayflies, which produce some of the most important hatches on Eastern and Midwestern trout streams. Sulphur hatches in late May through June create magical evening dry fly fishing.",
    origin: "Sulphur patterns have been refined by generations of Pennsylvania limestone stream anglers. Modern versions incorporate CDC and parachute techniques.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Fine thread.", customColor: "Pale Yellow", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Pale dun tails.", customColor: "Cream", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Sulphur dubbing.", customColor: "Pale Sulphur Yellow", required: true, position: 4 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC wing.", customColor: "Light Dun", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie in tails and dub body", instruction: "Tie in split Microfibbetts. Dub a slim pale yellow body to the two-thirds point." },
      { position: 2, title: "Add CDC wing and finish", instruction: "Tie in CDC wing puff. Dub a small thorax. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Henryville Special",
    slug: "henryville-special",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Henryville Special is a traditional caddis pattern featuring a palmered body hackle, duck quill underwing, and deer hair overwing. It produces a complex silhouette that is deadly during caddis hatches. One of the most elegant caddis imitations ever designed.",
    origin: "Created by Hiram Brobst on Henryville Creek in the Pocono Mountains of Pennsylvania in the 1920s.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Olive dubbing body.", customColor: "Olive", required: true, position: 3 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Palmered body hackle.", required: true, position: 4 },
      { name: "Lemon Wood Duck Flank", type: MaterialType.wing, description: "Wood duck underwing.", required: true, position: 5 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair overwing.", customColor: "Natural", required: true, position: 6 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Front collar hackle.", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Build palmered body", instruction: "Dub olive body. Palmer grizzly hackle over the body from bend to two-thirds point." },
      { position: 2, title: "Add wings and collar", instruction: "Tie in wood duck flank underwing, then deer hair overwing tent-style. Add 2-3 turns of brown hackle as a collar. Whip finish." },
    ],
  },
  {
    name: "Letort Hopper",
    slug: "letort-hopper",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Letort Hopper is a refined, low-profile grasshopper imitation designed for the smooth, slow-moving limestone streams of Pennsylvania's Cumberland Valley. Unlike the bushy Dave's Hopper, it sits flush in the surface film for a more natural presentation to selective trout.",
    origin: "Created by Ed Shenk for the famous Letort Spring Run in Carlisle, Pennsylvania — one of the most demanding trout streams in America.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 10-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Yellow body.", customColor: "Yellow", required: true, position: 3 },
      { name: "Turkey Quill Sections", type: MaterialType.wing, description: "Turkey quill wing.", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.other, description: "Deer hair head.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Dub body and add wing", instruction: "Dub a yellow body from bend to two-thirds. Tie in a tent-style turkey quill wing." },
      { position: 2, title: "Add deer hair head and finish", instruction: "Spin and clip deer hair into a flattened head. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Turck's Tarantula",
    slug: "turcks-tarantula",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "Turck's Tarantula is a foam-and-rubber-leg attractor dry fly that imitates stoneflies, hoppers, and anything else a hungry trout might eat. It is one of the most versatile big attractor dry flies, floating high and supporting heavy dropper nymphs beneath it.",
    origin: "Created by Guy Turck, a Wyoming fly fishing guide and tier. It has become a western guide staple.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 6-12", required: true, position: 1 },
      { name: "Danville Flymaster Plus 140", type: MaterialType.thread, description: "Strong thread.", customColor: "Tan", required: true, position: 2 },
      { name: "Deer Hair", type: MaterialType.tail, description: "Deer hair tail.", customColor: "Natural", required: true, position: 3 },
      { name: "Antron Yarn", type: MaterialType.body, description: "Antron body.", customColor: "Tan/Yellow", required: true, position: 4 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs.", customColor: "White/Black Barred", required: true, position: 5 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair wing.", customColor: "Natural", required: true, position: 6 },
      { name: "Foam Sheet", type: MaterialType.other, description: "Foam head.", customColor: "Tan", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Build body with legs", instruction: "Tie in deer hair tail. Wrap Antron body. Add rubber legs at midpoint." },
      { position: 2, title: "Add wing and foam head", instruction: "Tie in deer hair wing. Add foam head on top, secure with thread wraps. Add front legs. Whip finish." },
    ],
  },
  {
    name: "Madam X",
    slug: "madam-x",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Madam X is a rubber-legged attractor dry fly with a deer hair body and tent wing. It imitates stoneflies, hoppers, and caddis simultaneously. An excellent searching pattern for exploring new water, and a reliable indicator fly for nymph dropper rigs.",
    origin: "Created by Doug Swisher, co-author of the influential 'Selective Trout.' Despite its simplicity, it remains one of the most effective attractor dries in fly fishing.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 6-12", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Yellow", required: true, position: 2 },
      { name: "Elk Body Hair", type: MaterialType.tail, description: "Elk hair tail.", customColor: "Natural", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Yellow body.", customColor: "Yellow", required: true, position: 4 },
      { name: "Elk Hair (Wing)", type: MaterialType.wing, description: "Elk hair tent wing.", customColor: "Natural", required: true, position: 5 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs.", customColor: "White/Black Barred", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build tail and body", instruction: "Tie in elk hair tail. Dub yellow body to two-thirds point." },
      { position: 2, title: "Add wing, legs, and finish", instruction: "Tie in elk hair tent wing. Add rubber legs at the head with figure-eight wraps. Build a head, whip finish." },
    ],
  },
  {
    name: "Purple Haze",
    slug: "purple-haze",
    category: FlyCategory.dry,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Purple Haze is a parachute-style attractor dry fly with a purple body that has become wildly popular in the West. Despite its unnatural color, it consistently outperforms natural-colored patterns, likely because the purple body imitates the UV spectrum that trout see.",
    origin: "Created by Andy Carlson of Montana, inspired by the legendary guitarist's song. It has become one of the best-selling dry fly patterns in the Rocky Mountain West.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 14-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Purple", required: true, position: 2 },
      { name: "Moose Body Hair", type: MaterialType.tail, description: "Moose hair tails.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Purple dubbing.", customColor: "Purple", required: true, position: 4 },
      { name: "Calf Body Hair", type: MaterialType.wing, description: "White parachute post.", customColor: "White", required: true, position: 5 },
      { name: "Grizzly Rooster Hackle", type: MaterialType.hackle, description: "Parachute hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Post wing and tie tails", instruction: "Post white calf body hair upright. Wrap to bend and tie in moose hair tails." },
      { position: 2, title: "Dub body and wrap hackle", instruction: "Dub purple body to wing. Wrap parachute hackle 4-5 turns around the post. Whip finish." },
    ],
  },
  {
    name: "Rusty Spinner",
    slug: "rusty-spinner",
    category: FlyCategory.dry,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Rusty Spinner is a generic spinner pattern that matches the spent spinner stage of many mayfly species. Spinners fall spent on the water after mating, lying flat with wings outstretched. One good Rusty Spinner pattern can match dozens of different species.",
    origin: "A general-purpose pattern refined by many tiers over the decades. The rusty brown color matches the majority of mayfly spinner bodies.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 14-20", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine thread.", customColor: "Rust Brown", required: true, position: 2 },
      { name: "Microfibbetts", type: MaterialType.tail, description: "Tails.", customColor: "Dun", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Rust brown dubbing.", customColor: "Rust Brown", required: true, position: 4 },
      { name: "White Poly Yarn", type: MaterialType.wing, description: "Spent wings.", customColor: "White", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie tails and dub body", instruction: "Split Microfibbett tails. Dub a slim rust-brown body to the two-thirds point." },
      { position: 2, title: "Add spent wings and finish", instruction: "Tie in poly yarn spent wings flat. Dub thorax around wing base. Whip finish." },
    ],
  },
];

// ─── Nymphs (25 remaining) ──────────────────────────────────────────────────

const NYMPHS: PatternDef[] = [
  {
    name: "WD-40",
    slug: "wd-40",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The WD-40 is a simple, sparse midge/mayfly emerger pattern that is deadly on tailwaters and spring creeks. Its thread body and mallard flank wing case create a subtle profile that selective trout cannot resist. One of the most effective small-fly patterns ever designed.",
    origin: "Created by John Engle from Colorado tailwater fishing. The name does not refer to the lubricant but to the fly's four original materials.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 18-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Fine thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Mallard Flank Fibers", type: MaterialType.tail, description: "Mallard flank tail.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.thorax, description: "Thorax dubbing.", customColor: "Olive", required: true, position: 4 },
      { name: "Mallard Flank Fibers", type: MaterialType.wing, description: "Wing case.", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie tails and build thread body", instruction: "Tie in mallard flank fibers for a short tail. Wrap a slim thread body to the two-thirds point." },
      { position: 2, title: "Add wing case and thorax", instruction: "Tie in mallard flank for wing case. Dub a small thorax. Pull wing case over. Whip finish." },
    ],
  },
  {
    name: "Brassie",
    slug: "brassie",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Brassie is a dead-simple midge larva pattern made of nothing but copper wire and a thread or peacock herl thorax. It sinks quickly and catches fish everywhere midges exist — which is virtually every body of water.",
    origin: "Originated in the South Park area of Colorado, where it was developed for the heavily pressured tailwater fisheries. Its simplicity is its genius.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 16-22", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Copper Wire (Medium)", type: MaterialType.body, description: "Copper wire body.", required: true, position: 3 },
      { name: "Peacock Herl (Thorax)", type: MaterialType.thorax, description: "Peacock herl thorax.", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Wrap copper wire body", instruction: "Start thread. Wrap copper wire in tight turns from bend to two-thirds point for a segmented body." },
      { position: 2, title: "Add thorax and finish", instruction: "Wrap 1-2 peacock herls as a small thorax. Whip finish." },
    ],
  },
  {
    name: "Zug Bug",
    slug: "zug-bug",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Zug Bug is a classic attractor nymph with a peacock herl body, silver tinsel rib, and wood duck legs. It suggests a variety of caddis larvae and small nymphs. Though less popular than modern patterns, it remains remarkably effective.",
    origin: "Created by Cliff Zug in the early 20th century. It is one of the oldest American nymph patterns still commonly fished.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Peacock Sword Fibers", type: MaterialType.tail, description: "Peacock sword tail.", required: true, position: 3 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl body.", required: true, position: 4 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.rib, description: "Silver tinsel rib.", required: true, position: 5 },
      { name: "Lemon Wood Duck Flank", type: MaterialType.other, description: "Wood duck legs.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Tie in peacock sword tail fibers and tinsel rib. Wrap peacock herl body. Counter-wrap the tinsel." },
      { position: 2, title: "Add legs and finish", instruction: "Tie in wood duck flank fibers as legs on each side. Build head and whip finish." },
    ],
  },
  {
    name: "Bird's Nest",
    slug: "birds-nest",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Bird's Nest is a shaggy, impressionistic nymph that imitates a variety of aquatic insects. Its rough dubbing body with picked-out fibers creates an incredibly buggy, lifelike profile. Simple to tie and devastating to fish.",
    origin: "Created by Cal Bird in Northern California. It became a staple on western steelhead and trout waters.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 8-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Pheasant Tail Fibers", type: MaterialType.tail, description: "PT fiber tail.", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Rough dubbing.", customColor: "Natural", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Wire rib.", required: true, position: 5 },
      { name: "Brass Bead", type: MaterialType.bead, description: "Optional bead head.", customColor: "Gold", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Add optional bead. Tie in PT tail fibers and wire. Dub a rough body with lots of guard hairs. Rib with wire." },
      { position: 2, title: "Pick out and finish", instruction: "Pick out dubbing fibers aggressively with a dubbing needle or Velcro. Whip finish." },
    ],
  },
  {
    name: "Tellico Nymph",
    slug: "tellico-nymph",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Tellico Nymph is a classic Southern Appalachian pattern that uses a yellow body with peacock herl shellback and brown hackle. It is one of the most effective nymph patterns for brook trout and brown trout in mountain streams throughout the Southeast.",
    origin: "Named after the Tellico River in the Great Smoky Mountains of Tennessee, where it was first developed for native brook trout fishing.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 10-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Guinea Fowl Fibers", type: MaterialType.tail, description: "Guinea fowl tail.", required: true, position: 3 },
      { name: "Yellow Floss", type: MaterialType.body, description: "Yellow floss body.", customColor: "Yellow", required: true, position: 4 },
      { name: "Peacock Herl", type: MaterialType.wing, description: "Peacock herl shellback.", required: true, position: 5 },
      { name: "Brown Rooster Hackle", type: MaterialType.hackle, description: "Palmer hackle.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Tie in guinea fowl tail, peacock shellback, and hackle. Wrap yellow floss body. Palmer hackle forward. Pull shellback over." },
      { position: 2, title: "Finish", instruction: "Secure shellback. Build head and whip finish." },
    ],
  },
  {
    name: "Golden Stonefly Nymph",
    slug: "golden-stonefly-nymph",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Golden Stonefly Nymph imitates Hesperoperla pacifica and other golden stonefly species. These large nymphs are an important food source on western freestone rivers. The golden/amber coloring distinguishes it from the darker Kaufmann's Stone.",
    origin: "Developed for the prolific golden stonefly populations in Rocky Mountain rivers, where they provide year-round subsurface feeding for large trout.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long hook.", customSize: "Size 6-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Amber", required: true, position: 2 },
      { name: "Goose Biots", type: MaterialType.tail, description: "Goose biot tails.", customColor: "Amber", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Golden amber dubbing.", customColor: "Golden Amber", required: true, position: 4 },
      { name: "Thin Skin", type: MaterialType.wing, description: "Wing case.", customColor: "Golden Brown", required: true, position: 5 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs.", customColor: "Amber/Brown", required: true, position: 6 },
      { name: "Lead Wire (.015)", type: MaterialType.weight, description: "Weight.", required: true, position: 7 },
    ],
    steps: [
      { position: 1, title: "Weight and build body", instruction: "Add lead wraps. Tie in biot tails and wing case material. Dub a segmented amber body, pulling wing case over each segment." },
      { position: 2, title: "Add legs and finish", instruction: "Tie in rubber legs at the thorax. Dub thorax. Pull final wing case. Whip finish." },
    ],
  },
  {
    name: "Serendipity",
    slug: "serendipity",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Serendipity is a minimalist midge pupa/emerger pattern that uses twisted Z-Lon or Antron for a segmented body and deer hair for a wing/head. Despite having only two materials, it is one of the most effective midge patterns in existence.",
    origin: "Created by Ross Merigold in Wyoming. The name reflects the happy accident of its development from simple experimentation with materials.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 16-22", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Red", required: true, position: 2 },
      { name: "Z-Lon", type: MaterialType.body, description: "Twisted Z-Lon body.", customColor: "Red/Olive/Black", required: true, position: 3 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair head/wing.", customColor: "Natural", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Twist and wrap body", instruction: "Tie in Z-Lon at the bend. Twist into a tight rope and wrap forward for a segmented body." },
      { position: 2, title: "Add deer hair head", instruction: "Tie in a small bunch of deer hair as a wing bud/head. Trim to shape. Whip finish." },
    ],
  },
  {
    name: "Juju Baetis",
    slug: "juju-baetis",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Juju Baetis is a realistic BWO nymph pattern that uses coated Superfine dubbing for a slim, segmented look. It is devastating during Blue-Winged Olive hatches when trout are feeding on emerging nymphs just below the surface.",
    origin: "Created by Charlie Craven at Charlie's Fly Box in Denver. Craven is one of the most innovative commercial fly designers in the industry.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 18-22", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Coq de Leon Fibers", type: MaterialType.tail, description: "Tailing fibers.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "BWO dubbing.", customColor: "BWO Olive", required: true, position: 4 },
      { name: "Flashabou", type: MaterialType.wing, description: "Wing case.", customColor: "Black", required: true, position: 5 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Bead head.", customColor: "Black", customSize: "2.0mm", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Add bead. Tie in tail fibers and wing case material. Dub a thin body. Pull wing case over thorax." },
      { position: 2, title: "Finish", instruction: "Whip finish. Coat body with UV resin for a smooth, realistic sheen." },
    ],
  },
  {
    name: "Top Secret Midge",
    slug: "top-secret-midge",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Top Secret Midge is a simple, effective midge pupa pattern that uses nothing more than thread wraps and a bead. The bicolored thread body creates a realistic segmented look that fools even the most selective tailwater trout.",
    origin: "A modern tailwater midge pattern that exemplifies the minimalist approach that is often most effective for midge fishing.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 20-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Black/Wine", required: true, position: 2 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Tiny bead.", customColor: "Silver", customSize: "1.5mm", required: true, position: 3 },
    ],
    steps: [
      { position: 1, title: "Build the thread body", instruction: "Add bead. Wrap thread to the bend. Build a smooth two-toned body using wraps of black and wine thread." },
      { position: 2, title: "Finish", instruction: "Whip finish behind the bead. Optional: coat with UV resin." },
    ],
  },
  {
    name: "Black Beauty",
    slug: "black-beauty",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Black Beauty is a sleek midge larva/pupa pattern designed for Colorado's demanding tailwaters. Its dark thread body with fine wire rib and tuft of white CDC creates a deadly combination that imitates the most common midge species in tailwater environments.",
    origin: "Created by Pat Dorsey, one of Colorado's most respected tailwater guides and authors. It is a cornerstone of his South Platte midge box.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 18-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Fine wire rib.", required: true, position: 3 },
      { name: "Superfine Dubbing", type: MaterialType.thorax, description: "Thorax.", customColor: "Black", required: true, position: 4 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC wing puff.", customColor: "White", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build body and rib", instruction: "Wrap smooth black thread body. Counter-rib with fine wire." },
      { position: 2, title: "Add thorax, CDC, and finish", instruction: "Dub black thorax. Tie in a tiny tuft of white CDC. Whip finish." },
    ],
  },
  {
    name: "Disco Midge",
    slug: "disco-midge",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Disco Midge is a flashy midge larva pattern that uses holographic tinsel for maximum sparkle. When midges are hatching, this fly's extra flash helps it stand out and trigger strikes even in off-color water or low-light conditions.",
    origin: "A modern midge pattern developed for competitive and tailwater fishing where extra flash can trigger reaction strikes.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Scud hook.", customSize: "Size 18-24", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Holographic Tinsel", type: MaterialType.body, description: "Holographic tinsel body.", customColor: "Silver/Red", required: true, position: 3 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Wire rib.", required: true, position: 4 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Bead.", customColor: "Silver", customSize: "2.0mm", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Wrap body", instruction: "Add bead. Wrap tinsel body in smooth turns. Counter-rib with wire." },
      { position: 2, title: "Finish", instruction: "Whip finish behind bead." },
    ],
  },
  {
    name: "Psycho Prince",
    slug: "psycho-prince",
    category: FlyCategory.nymph,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Psycho Prince is a rubber-legged version of the classic Prince Nymph with flashback wing case. The rubber legs add movement and the flashback adds visibility. It combines the proven Prince Nymph body with modern attractor features.",
    origin: "A modern adaptation of Doug Prince's classic pattern, adding rubber legs and flashback materials popularized in competition fishing.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 10-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Goose Biots", type: MaterialType.tail, description: "Biot tail.", customColor: "Brown", required: true, position: 3 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl body.", required: true, position: 4 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.rib, description: "Gold tinsel rib.", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.wing, description: "Flashback wing case.", customColor: "Pearl", required: true, position: 6 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Rubber legs.", customColor: "Black", required: true, position: 7 },
      { name: "Tungsten Bead", type: MaterialType.bead, description: "Bead.", customColor: "Gold", required: true, position: 8 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Add bead. Tie in biot tails, rib, and wing case. Wrap peacock herl body. Rib with tinsel." },
      { position: 2, title: "Add legs, wing case, finish", instruction: "Tie in rubber legs at thorax. Pull flashback wing case over. Whip finish." },
    ],
  },
  {
    name: "Caddis Larva",
    slug: "caddis-larva",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "A simple caddis larva pattern that imitates the green or tan cased or free-living caddis larva. Caddis larvae are one of the most abundant food sources in trout streams, and this simple pattern imitates them effectively.",
    origin: "A generic pattern type tied by many tiers. Gary LaFontaine's research in 'Caddisflies' helped popularize caddis larva imitations.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Superfine Dubbing", type: MaterialType.body, description: "Green dubbing.", customColor: "Bright Green/Tan", required: true, position: 3 },
      { name: "Peacock Herl (Thorax)", type: MaterialType.thorax, description: "Dark thorax.", required: true, position: 4 },
      { name: "Brass Bead", type: MaterialType.bead, description: "Bead head.", customColor: "Gold", required: false, position: 5 },
    ],
    steps: [
      { position: 1, title: "Dub body", instruction: "Add optional bead. Dub a full, slightly rough body of green or tan dubbing." },
      { position: 2, title: "Add thorax and finish", instruction: "Wrap peacock herl thorax. Whip finish." },
    ],
  },
  {
    name: "Green Weenie",
    slug: "green-weenie",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Green Weenie is a devastatingly simple inchworm/caddis larva imitation made from nothing but green chenille. It is the go-to pattern for Pennsylvania anglers and is surprisingly effective anywhere green caddis larvae or inchworms are present.",
    origin: "A staple of Pennsylvania fly fishing, particularly on the limestone streams of central PA. Its exact origin is unknown but it has been a regional favorite for decades.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Curved hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Green", required: true, position: 2 },
      { name: "Ultra Chenille", type: MaterialType.body, description: "Green chenille.", customColor: "Chartreuse Green", required: true, position: 3 },
    ],
    steps: [
      { position: 1, title: "Wrap chenille", instruction: "Start thread. Tie in green ultra chenille at the bend. Wrap forward in touching turns to the eye." },
      { position: 2, title: "Finish", instruction: "Tie off and whip finish. Apply head cement." },
    ],
  },
  {
    name: "Egg Pattern",
    slug: "egg-pattern",
    category: FlyCategory.nymph,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Egg Pattern (Glo Bug) imitates loose fish eggs drifting downstream during spawning season. Despite purist objections, trout and steelhead eagerly eat drifting eggs, making this one of the most effective patterns during fall and spring spawning runs.",
    origin: "Egg patterns originated in the Great Lakes steelhead fishing community and have spread worldwide wherever salmon, steelhead, and trout spawn.",
    materials: [
      { name: "Dai-Riki 135 Scud/Midge Hook", type: MaterialType.hook, description: "Short shank hook.", customSize: "Size 8-14", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Glo Bug Yarn", type: MaterialType.body, description: "Egg yarn.", customColor: "Oregon Cheese/Peach", required: true, position: 3 },
    ],
    steps: [
      { position: 1, title: "Tie in yarn", instruction: "Start thread at the midpoint. Lay a strand of Glo Bug yarn across the shank. Secure with tight cross-wraps." },
      { position: 2, title: "Trim to shape", instruction: "Pull all the yarn up and trim into a round egg shape with sharp scissors. Whip finish and apply super glue to the thread." },
    ],
  },
];

// ─── Streamers (15 remaining) ───────────────────────────────────────────────

const STREAMERS: PatternDef[] = [
  {
    name: "Zoo Cougar",
    slug: "zoo-cougar",
    category: FlyCategory.streamer,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description: "The Zoo Cougar is a large, deer hair-headed sculpin imitation designed for trophy brown trout. Its wide profile and diving action mimic a sculpin darting along the bottom. One of Kelly Galloup's most famous patterns.",
    origin: "Created by Kelly Galloup, the Michigan/Montana streamer guru whose patterns and techniques have revolutionized big-trout streamer fishing.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Stinger hook.", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Rabbit strip wing.", customColor: "Olive", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Gold", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.other, description: "Spun deer hair head.", customColor: "Olive/Brown", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Tie in rabbit strip wing and flash at the bend. Palmer or bind forward to create a body." },
      { position: 2, title: "Spin deer hair head", instruction: "Spin and pack deer hair bunches to create a large, wide head. Trim into a flat-bottomed sculpin shape." },
    ],
  },
  {
    name: "Game Changer",
    slug: "game-changer",
    category: FlyCategory.streamer,
    difficulty: Difficulty.advanced,
    waterType: WaterType.both,
    description: "The Game Changer is a multi-articulated baitfish pattern that creates the most lifelike swimming action of any fly ever designed. Each segment moves independently, producing a sinuous, fish-like motion that is irresistible to predatory fish of all species.",
    origin: "Created by Blane Chocklett of Virginia. His articulated shanks and tying technique have truly changed the game in streamer design.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Front hook plus articulated shanks.", customSize: "Size 2-2/0 + shanks", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Strong thread.", customColor: "White", required: true, position: 2 },
      { name: "EP Fiber", type: MaterialType.body, description: "EP fiber body segments.", customColor: "White/Olive", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: true, position: 4 },
      { name: "3D Stick-On Eyes", type: MaterialType.other, description: "Eyes.", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build tail sections", instruction: "Tie EP fiber on each articulated shank, building progressively larger segments from tail to front." },
      { position: 2, title: "Build head and add eyes", instruction: "On the front hook, build a large head section. Add eyes. Trim all sections into a baitfish taper." },
    ],
  },
  {
    name: "Mickey Finn",
    slug: "mickey-finn",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Mickey Finn is a classic bucktail streamer with a bold red and yellow color scheme. It imitates small minnows and baitfish and is one of the most popular traditional streamers for brook trout and landlocked salmon. Simple to tie and consistently effective.",
    origin: "Created by John Alden Knight in the 1930s, originally called the Assassin. It was later renamed after the famous knockout cocktail.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 6-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.body, description: "Gold tinsel body.", required: true, position: 3 },
      { name: "Fine Gold Wire", type: MaterialType.rib, description: "Gold wire rib.", required: true, position: 4 },
      { name: "Bucktail", type: MaterialType.wing, description: "Red and yellow bucktail.", customColor: "Yellow/Red/Yellow", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Wrap body", instruction: "Wrap flat gold tinsel body. Counter-rib with wire." },
      { position: 2, title: "Build wing and finish", instruction: "Layer bucktail: yellow, then red, then yellow on top. Build thread head and apply cement." },
    ],
  },
  {
    name: "Black Ghost",
    slug: "black-ghost",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Black Ghost is a classic feathered streamer that imitates smelt and other slender baitfish. Its black body, white hackle throat, and white marabou or hackle wing create an elegant and effective profile. A traditional pattern for brook trout and landlocked salmon.",
    origin: "Created by Herb Welch in the 1920s at his fishing camp in Maine. It remains one of the most iconic New England streamer patterns.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Red Floss", type: MaterialType.tail, description: "Yellow hackle fibers.", customColor: "Yellow", required: true, position: 3 },
      { name: "Red Floss", type: MaterialType.body, description: "Black floss body.", customColor: "Black", required: true, position: 4 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.rib, description: "Tinsel rib.", required: true, position: 5 },
      { name: "White Saddle Hackle", type: MaterialType.wing, description: "White hackle wing.", customColor: "White", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Tie in yellow tail fibers. Wrap black floss body with gold tinsel rib." },
      { position: 2, title: "Add throat and wing", instruction: "Add white hackle throat. Tie in matched white hackle feathers as wing. Build head, apply cement." },
    ],
  },
  {
    name: "Gray Ghost",
    slug: "gray-ghost",
    category: FlyCategory.streamer,
    difficulty: Difficulty.advanced,
    waterType: WaterType.freshwater,
    description: "The Gray Ghost is the most famous traditional streamer pattern in American fly fishing. Created to imitate the smelt of Rangeley Lakes, it is a complex but beautiful fly that represents the pinnacle of classical streamer tying artistry.",
    origin: "Created by Carrie Stevens of Upper Dam, Maine in 1924. She famously won a fishing competition the day she first fished the pattern.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long streamer hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Gold Tinsel (Flat)", type: MaterialType.body, description: "Flat silver tinsel body.", required: true, position: 3 },
      { name: "White Saddle Hackle", type: MaterialType.hackle, description: "White bucktail underwing.", customColor: "White", required: true, position: 4 },
      { name: "Peacock Herl", type: MaterialType.wing, description: "Peacock herl topping.", required: true, position: 5 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.wing, description: "Gray hackle feather overwing.", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Wrap body", instruction: "Wrap flat silver tinsel body. Build a smooth underbody first for an even finish." },
      { position: 2, title: "Build complex wing", instruction: "Layer: white bucktail underwing, peacock herl, gray hackle feathers. Add throat hackle. Build a neat lacquered head." },
    ],
  },
  {
    name: "Egg Sucking Leech",
    slug: "egg-sucking-leech",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Egg Sucking Leech combines a leech body with a bright egg-colored bead or chenille head. The theory is that it imitates a leech that has just consumed a fish egg. Whatever the reason, the fluorescent head makes this pattern irresistible to trout and steelhead.",
    origin: "Originated in Pacific Northwest steelhead fishing. The egg-head addition to traditional leech patterns proved devastatingly effective.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Marabou Plume", type: MaterialType.tail, description: "Black marabou tail.", customColor: "Black/Purple", required: true, position: 3 },
      { name: "Chenille (Medium)", type: MaterialType.body, description: "Black chenille body.", customColor: "Black", required: true, position: 4 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Palmer hackle.", customColor: "Black", required: true, position: 5 },
      { name: "Chenille (Medium)", type: MaterialType.other, description: "Egg head.", customColor: "Fluorescent Orange/Pink", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build leech body", instruction: "Tie in marabou tail. Wrap chenille body. Palmer hackle over body." },
      { position: 2, title: "Add egg head", instruction: "Wrap 2-3 turns of fluorescent orange/pink chenille at the head. Whip finish." },
    ],
  },
  {
    name: "Pine Squirrel Leech",
    slug: "pine-squirrel-leech",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Pine Squirrel Leech uses a strip of pine squirrel skin for maximum underwater movement. Pine squirrel fur is finer and softer than rabbit, creating a more subtle action that excels in clear water conditions where rabbit strip flies can seem too aggressive.",
    origin: "Popularized by John Barr and other Colorado tiers who found pine squirrel to be an excellent alternative to rabbit for clear water fishing.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Pine Squirrel Zonker Strip", type: MaterialType.wing, description: "Pine squirrel strip.", customColor: "Natural/Olive", required: true, position: 3 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Flash.", customColor: "Pearl", required: true, position: 4 },
      { name: "Brass Cone Head", type: MaterialType.bead, description: "Cone head.", customColor: "Gold", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Add cone. Tie in flash and pine squirrel strip at the bend. Bind strip forward Matuka-style with wire." },
      { position: 2, title: "Finish", instruction: "Build a thread collar behind the cone. Whip finish." },
    ],
  },
  {
    name: "Double Bunny",
    slug: "double-bunny",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Double Bunny uses two rabbit strips — one on top and one on the bottom — to create a wide, pulsing baitfish profile. The two strips work independently in the water, creating incredible lifelike movement that drives predatory fish into a frenzy.",
    origin: "Popularized by western streamer anglers as a variation of the standard Zonker, adding a second strip for a more dramatic profile.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "White/Olive", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.wing, description: "Two rabbit strips.", customColor: "White (bottom) / Olive (top)", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead eyes.", customSize: "Medium", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie in both strips", instruction: "Add lead eyes behind eye. Tie in white strip on bottom and olive strip on top at the bend. Add flash between them." },
      { position: 2, title: "Bind forward and finish", instruction: "Bind both strips forward with thread or wire wraps. Secure behind lead eyes. Build head and apply cement." },
    ],
  },
  {
    name: "Matuka",
    slug: "matuka",
    category: FlyCategory.streamer,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Matuka is a wet fly/streamer style where hackle feathers are bound along the top of the body with a ribbing wire. This prevents the wing from fouling around the hook, creating a sleek minnow profile. It is one of the most effective baitfish imitation styles.",
    origin: "Originated from the Maori people of New Zealand, where the technique was first used. It was later adopted and popularized in Western fly tying traditions.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 4-10", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Chenille (Medium)", type: MaterialType.body, description: "Chenille body.", customColor: "Olive/Black", required: true, position: 3 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.wing, description: "Matched saddle hackle feathers.", required: true, position: 4 },
      { name: "Fine Copper Wire", type: MaterialType.rib, description: "Wire to bind feathers.", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Wrap body and prepare feathers", instruction: "Wrap chenille body. Strip the barbs from the bottom half of two matched saddle hackles. Lay them on top of the body." },
      { position: 2, title: "Bind Matuka-style", instruction: "Use wire to spiral-wrap through the feather fibers, binding the stems to the body. Secure wire. Add hackle collar. Whip finish." },
    ],
  },
  {
    name: "Sparkle Minnow",
    slug: "sparkle-minnow",
    category: FlyCategory.streamer,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Sparkle Minnow is a simple, flashy baitfish imitation made primarily from Flashabou and a cone head. It is quick to tie, casts well, and the shimmering flash body triggers aggressive strikes from trout, bass, and pike.",
    origin: "A modern guide-box staple that exemplifies the trend toward simple, flashy streamer patterns that catch fish and can be tied quickly.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Streamer hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "White", required: true, position: 2 },
      { name: "Brass Cone Head", type: MaterialType.bead, description: "Cone head.", customColor: "Gold", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.wing, description: "Full flash body.", customColor: "Pearl/Silver", required: true, position: 4 },
      { name: "Krystal Flash", type: MaterialType.other, description: "Additional flash.", customColor: "Gold", required: false, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build flash body", instruction: "Add cone. Tie in 30-40 strands of Flashabou at the midpoint. Fold back over for flash on all sides." },
      { position: 2, title: "Finish", instruction: "Build thread head behind cone. Apply head cement." },
    ],
  },
];

// ─── Emergers (10 remaining after deduplication) ────────────────────────────

const EMERGERS: PatternDef[] = [
  {
    name: "Sparkle Pupa",
    slug: "sparkle-pupa",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Sparkle Pupa (LaFontaine's) uses an Antron yarn overbody that traps air bubbles, mimicking the gas bubble that caddis pupae use to ascend to the surface. This is one of the most innovative and effective caddis emerger patterns ever created.",
    origin: "Created by Gary LaFontaine after years of underwater observation of caddis emergence. Published in his landmark book 'Caddisflies' in 1981.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Antron Yarn", type: MaterialType.body, description: "Antron overbody.", customColor: "Amber/Green", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Underbody dubbing.", customColor: "Brown", required: true, position: 4 },
      { name: "Deer Hair", type: MaterialType.wing, description: "Deer hair wing.", customColor: "Natural", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build underbody and overbody", instruction: "Tie in Antron yarn at the bend. Dub an underbody. Pull the Antron loosely over the top and sides, creating a bubble-like overbody." },
      { position: 2, title: "Add wing and finish", instruction: "Tie in a short deer hair wing. Build a head and whip finish." },
    ],
  },
  {
    name: "Deep Sparkle Pupa",
    slug: "deep-sparkle-pupa",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "The Deep Sparkle Pupa is the subsurface version of LaFontaine's design, meant to be fished on the swing or dead-drifted deep. It imitates a caddis pupa ascending from the stream bed toward the surface, surrounded by its gas bubble.",
    origin: "Also by Gary LaFontaine, designed to fish the early stage of caddis emergence when pupae are still well below the surface.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Nymph hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Uni-Thread 6/0", type: MaterialType.thread, description: "Thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Antron Yarn", type: MaterialType.body, description: "Antron overbody.", customColor: "Amber", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Underbody.", customColor: "Brown", required: true, position: 4 },
      { name: "Partridge Hackle", type: MaterialType.hackle, description: "Soft hackle collar.", required: true, position: 5 },
      { name: "Brass Bead", type: MaterialType.bead, description: "Bead for depth.", required: false, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body", instruction: "Add optional bead. Build Antron overbody over dubbed underbody as in the surface version." },
      { position: 2, title: "Add soft hackle and finish", instruction: "Wrap 1-2 turns of partridge hackle as a soft collar. Whip finish." },
    ],
  },
  {
    name: "Partridge and Green",
    slug: "partridge-and-green",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Partridge and Green is a classic North Country spider pattern that imitates caddis and olive emergers. Its green floss body and sparse partridge hackle create an effective pattern for swinging through runs and riffles.",
    origin: "A traditional English North Country spider pattern dating back centuries, part of the family that includes Partridge and Orange.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Wet fly hook.", customSize: "Size 12-16", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Thread.", customColor: "Green", required: true, position: 2 },
      { name: "Floss", type: MaterialType.body, description: "Green floss body.", customColor: "Green", required: true, position: 3 },
      { name: "Partridge Hackle", type: MaterialType.hackle, description: "Soft hackle.", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Wrap body", instruction: "Wrap a slim green floss body from bend to one-quarter behind the eye." },
      { position: 2, title: "Add soft hackle", instruction: "Wrap 1.5 turns of partridge hackle, sweeping fibers back. Whip finish." },
    ],
  },
  {
    name: "Starling and Herl",
    slug: "starling-and-herl",
    category: FlyCategory.emerger,
    difficulty: Difficulty.beginner,
    waterType: WaterType.freshwater,
    description: "The Starling and Herl is a classic spider pattern using a peacock herl body and starling soft hackle. The iridescent peacock body and soft, translucent starling hackle create a subtle, impressionistic fly that imitates a variety of emerging insects.",
    origin: "Another traditional North Country wet fly pattern, likely dating back to the 1800s or earlier. Part of the rich English soft-hackle tradition.",
    materials: [
      { name: "Tiemco TMC 3761 Nymph Hook", type: MaterialType.hook, description: "Wet fly hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "UTC Ultra Thread 70", type: MaterialType.thread, description: "Thread.", customColor: "Black", required: true, position: 2 },
      { name: "Peacock Herl", type: MaterialType.body, description: "Peacock herl body.", required: true, position: 3 },
      { name: "Starling Hackle", type: MaterialType.hackle, description: "Starling body feather.", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Wrap peacock body", instruction: "Wrap 2-3 peacock herls as a full body from bend to behind the eye." },
      { position: 2, title: "Add starling hackle", instruction: "Wrap 1-2 turns of starling body feather as a soft hackle collar. Whip finish." },
    ],
  },
  {
    name: "LaFontaine Caddis Emerger",
    slug: "lafontaine-caddis-emerger",
    category: FlyCategory.emerger,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.freshwater,
    description: "A general-purpose caddis emerger based on Gary LaFontaine's research into caddis emergence behavior. It combines dubbing, flash, and a CDC wing to imitate caddis pupae transitioning from aquatic to aerial insects in the surface film.",
    origin: "Inspired by Gary LaFontaine's groundbreaking underwater studies documented in his book 'Caddisflies,' which changed how anglers understand caddis emergence.",
    materials: [
      { name: "Tiemco TMC 100 Dry Fly Hook", type: MaterialType.hook, description: "Dry fly hook.", customSize: "Size 12-18", required: true, position: 1 },
      { name: "Veevus 8/0 Thread", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Rough body dubbing.", customColor: "Olive", required: true, position: 3 },
      { name: "CDC Feathers", type: MaterialType.wing, description: "CDC emerging wing.", customColor: "Dun", required: true, position: 4 },
      { name: "Z-Lon", type: MaterialType.tail, description: "Trailing shuck.", customColor: "Amber", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Tie trailing shuck and dub body", instruction: "Tie in Z-Lon shuck at the bend. Dub an olive body to the two-thirds point." },
      { position: 2, title: "Add CDC wing and finish", instruction: "Tie in CDC feather as a wing puff. Dub a small thorax. Whip finish." },
    ],
  },
];

// ─── Saltwater (9 remaining after deduplication) ────────────────────────────

const SALTWATER: PatternDef[] = [
  {
    name: "Cockroach",
    slug: "cockroach",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description: "The Cockroach is one of the most effective tarpon flies ever designed. Its simple construction — grizzly hackle over a brown thread body — creates an incredibly lifelike profile that has fooled thousands of tarpon. A must-have for any tarpon trip.",
    origin: "A traditional Florida Keys tarpon pattern of uncertain origin that has been a staple of tarpon fishing for decades. Sometimes attributed to various Keys guides.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Strong saltwater hook.", customSize: "Size 1/0-3/0", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "Brown", required: true, position: 2 },
      { name: "Grizzly Saddle Hackle", type: MaterialType.hackle, description: "Grizzly hackle tail and collar.", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Gold", required: false, position: 4 },
    ],
    steps: [
      { position: 1, title: "Tie in hackle tail", instruction: "Tie in 4-6 grizzly saddle hackle feathers at the bend as a flowing tail." },
      { position: 2, title: "Build body and collar", instruction: "Wrap a smooth thread body. Palmer grizzly hackle as a collar at the head. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Borski's Slider",
    slug: "borskis-slider",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description: "Borski's Slider is a spun deer hair fly designed for shallow saltwater flats. The clipped deer hair head pushes water and creates a wake that attracts predators while keeping the fly in the upper water column. Effective for snook, redfish, and baby tarpon.",
    origin: "Created by Tim Borski, a legendary Florida Keys fly tier known for his innovative saltwater patterns.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "Chartreuse", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.tail, description: "Rabbit strip tail.", customColor: "Chartreuse/White", required: true, position: 3 },
      { name: "Deer Hair", type: MaterialType.other, description: "Spun deer hair head.", customColor: "Chartreuse/White", required: true, position: 4 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Pearl", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build tail", instruction: "Tie in rabbit strip tail and flash at the bend." },
      { position: 2, title: "Spin and trim head", instruction: "Spin deer hair in alternating colors. Trim into a bullet/slider head shape — flat on the bottom, rounded on top. Whip finish." },
    ],
  },
  {
    name: "Clouser Crayfish",
    slug: "clouser-crayfish",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.both,
    description: "The Clouser Crayfish adapts Bob Clouser's weighted-eye design to imitate a crayfish. With dumbbell eyes and a claw-like profile, it rides hook-point-up to avoid snags while presenting a realistic crayfish silhouette. Deadly for smallmouth bass and redfish.",
    origin: "Created by Bob Clouser, leveraging the same inverted-hook principle as his famous Minnow but adapted for crayfish imitation.",
    materials: [
      { name: "Mustad 9672 3XL Streamer Hook", type: MaterialType.hook, description: "Long shank hook.", customSize: "Size 2-8", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "Olive", required: true, position: 2 },
      { name: "Rabbit Strip", type: MaterialType.tail, description: "Rabbit claws.", customColor: "Olive/Brown", required: true, position: 3 },
      { name: "Hare's Ear Dubbing", type: MaterialType.body, description: "Rough body.", customColor: "Olive/Brown", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Lead eyes.", customSize: "Medium", required: true, position: 5 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Legs.", customColor: "Olive", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Tie in eyes, claws, and legs", instruction: "Add dumbbell eyes. Tie in rabbit strip claws at the bend. Add rubber legs along the body." },
      { position: 2, title: "Dub body and finish", instruction: "Dub a bulky body. Whip finish and apply head cement." },
    ],
  },
  {
    name: "Bend Back",
    slug: "bend-back",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.beginner,
    waterType: WaterType.saltwater,
    description: "The Bend Back is a weedless saltwater pattern where the hook point rides up due to a bent shank. This simple modification makes it perfect for fishing over grass flats, oyster bars, and mangrove shorelines where standard flies would snag constantly.",
    origin: "Developed by Chico Fernandez, one of the pioneers of saltwater fly fishing. The bent-back concept has been applied to many pattern styles.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook (bent).", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "White", required: true, position: 2 },
      { name: "Bucktail", type: MaterialType.wing, description: "Bucktail wing.", customColor: "White/Chartreuse", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: true, position: 4 },
    ],
    steps: [
      { position: 1, title: "Bend the hook and build wing", instruction: "Bend the hook shank 20 degrees behind the eye using pliers. Tie in bucktail wing and flash so the wing rides above the hook point." },
      { position: 2, title: "Finish", instruction: "Build a tapered thread head. Apply head cement. The hook point should ride up, protected by the wing." },
    ],
  },
  {
    name: "Half and Half",
    slug: "half-and-half",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description: "The Half and Half combines the front half of a Clouser Minnow with the rear half of a Lefty's Deceiver. This marriage creates a fly with the Deceiver's flowing tail action and the Clouser's weighted jigging head. It is one of the most versatile saltwater patterns ever devised.",
    origin: "Created by Bob Popovics as a logical combination of the two most famous saltwater flies. The result exceeded either parent pattern in versatility.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 1/0-4", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "White", required: true, position: 2 },
      { name: "White Saddle Hackle", type: MaterialType.tail, description: "Deceiver-style hackle tail.", customColor: "White", required: true, position: 3 },
      { name: "Bucktail", type: MaterialType.wing, description: "Clouser-style bucktail collar.", customColor: "White/Chartreuse", required: true, position: 4 },
      { name: "Dumbbell Eyes (Lead)", type: MaterialType.weight, description: "Clouser-style lead eyes.", customSize: "Medium", required: true, position: 5 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build Deceiver tail", instruction: "Tie in 4-6 white saddle hackles at the bend. Add flash along the sides." },
      { position: 2, title: "Add Clouser front", instruction: "Tie in dumbbell eyes at the front. Build bucktail collar behind and around the eyes in Clouser style. Build head and apply cement." },
    ],
  },
  {
    name: "Popovic's Banger",
    slug: "popovics-banger",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description: "Popovic's Banger is a foam-headed popper that creates an explosive surface disturbance. The cupped foam head pushes water and makes a 'bang' sound when stripped, triggering aggressive surface strikes from stripers, bluefish, and other predators.",
    origin: "Created by Bob Popovics of New Jersey, who pioneered many innovative saltwater fly designs including epoxy flies and the Surf Candy.",
    materials: [
      { name: "Gamakatsu B10S Stinger Hook", type: MaterialType.hook, description: "Strong hook.", customSize: "Size 1/0-3/0", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "White", required: true, position: 2 },
      { name: "Bucktail", type: MaterialType.tail, description: "Bucktail tail.", customColor: "White", required: true, position: 3 },
      { name: "Flashabou", type: MaterialType.other, description: "Flash.", customColor: "Silver", required: true, position: 4 },
      { name: "Foam Cylinder", type: MaterialType.other, description: "Pre-shaped foam popper head.", customColor: "White/Chartreuse", required: true, position: 5 },
    ],
    steps: [
      { position: 1, title: "Build tail", instruction: "Tie in bucktail tail and flash at the bend." },
      { position: 2, title: "Add foam head", instruction: "Thread a pre-shaped foam cylinder onto the hook. Secure with thread and super glue. Add eyes. Apply a coat of epoxy or UV resin over the head." },
    ],
  },
  {
    name: "Peterson's Spawning Shrimp",
    slug: "petersons-spawning-shrimp",
    category: FlyCategory.saltwater,
    difficulty: Difficulty.intermediate,
    waterType: WaterType.saltwater,
    description: "Peterson's Spawning Shrimp uses a combination of craft fur, rubber legs, and EP fibers to create a realistic shrimp imitation with egg sack. It is especially effective during shrimp spawning season when bonefish and permit actively seek out egg-laden shrimp.",
    origin: "Created by saltwater tier Erik Peterson for the shrimp spawning season on tropical flats, when egg-bearing shrimp are a primary food source.",
    materials: [
      { name: "Mustad 34007 Saltwater Hook", type: MaterialType.hook, description: "Saltwater hook.", customSize: "Size 2-6", required: true, position: 1 },
      { name: "Danville Flat Waxed Nylon", type: MaterialType.thread, description: "Thread.", customColor: "Orange", required: true, position: 2 },
      { name: "Craft Fur", type: MaterialType.body, description: "Body and antennae.", customColor: "Tan", required: true, position: 3 },
      { name: "EP Fiber", type: MaterialType.other, description: "Egg sack.", customColor: "Orange/Peach", required: true, position: 4 },
      { name: "Rubber Legs (Medium)", type: MaterialType.other, description: "Shrimp legs.", customColor: "Clear/Tan", required: true, position: 5 },
      { name: "Bead Chain Eyes", type: MaterialType.weight, description: "Eyes.", customSize: "Small", required: true, position: 6 },
    ],
    steps: [
      { position: 1, title: "Build body and legs", instruction: "Tie in bead chain eyes. Build shrimp body from craft fur with rubber legs tied in along the body. Add orange EP fiber egg sack at the belly." },
      { position: 2, title: "Add antennae and finish", instruction: "Tie in long craft fur antennae at the head. Trim body to a curved shrimp shape. Apply head cement." },
    ],
  },
];

// ─── Combined array ──────────────────────────────────────────────────────────

const ALL_REMAINING_PATTERNS: PatternDef[] = [
  ...DRY_FLIES,
  ...NYMPHS,
  ...STREAMERS,
  ...EMERGERS,
  ...SALTWATER,
];

// ─── Seed function ───────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Seeding ${ALL_REMAINING_PATTERNS.length} remaining fly patterns...`
  );

  let created = 0;
  let skipped = 0;

  for (const patternDef of ALL_REMAINING_PATTERNS) {
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
        const material = await prisma.material.upsert({
          where: { name_type: { name: matDef.name, type: matDef.type } },
          update: {},
          create: {
            name: matDef.name,
            type: matDef.type,
            description: matDef.description,
          },
        });

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
    `\nDone! Created ${created}, updated ${skipped} (${ALL_REMAINING_PATTERNS.length} total patterns)`
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
