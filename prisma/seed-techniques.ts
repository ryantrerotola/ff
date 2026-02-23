import {
  PrismaClient,
  TechniqueCategory,
  TechniqueDifficulty,
} from "@prisma/client";

const prisma = new PrismaClient();

interface TechniqueDef {
  name: string;
  slug: string;
  category: TechniqueCategory;
  difficulty: TechniqueDifficulty;
  description: string;
  keyPoints: string[];
  videos: {
    title: string;
    url: string;
    creatorName: string;
    thumbnailUrl?: string;
    duration?: string;
    qualityScore: number;
  }[];
}

const TECHNIQUES: TechniqueDef[] = [
  // ─── Fundamentals ───────────────────────────────────────────────────────────
  {
    name: "Setting Up Your Vise",
    slug: "setting-up-your-vise",
    category: TechniqueCategory.fundamentals,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Properly setting up your fly tying vise is the foundation of everything. Learn how to adjust jaw tension, position the vise at the correct height and angle, and secure hooks properly so they don't slip during tying.",
    keyPoints: [
      "Position the vise at a comfortable height — jaws should be roughly at eye level when seated",
      "Adjust jaw tension so the hook is held firmly but doesn't crush the hook bend",
      "The hook point should be partially hidden in the jaws to prevent cutting your thread",
      "Angle the vise head so the hook shank is level or slightly angled down",
      "Use a pedestal base on smooth surfaces or a clamp mount on tables",
    ],
    videos: [
      {
        title: "Fly Tying Vise Setup for Beginners",
        url: "https://www.youtube.com/watch?v=tXWsbSF3fzU",
        creatorName: "Mad River Outfitters",
        duration: "8:42",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Starting Thread on the Hook",
    slug: "starting-thread-on-hook",
    category: TechniqueCategory.fundamentals,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "The first step in tying any fly is getting your thread started on the hook shank. This technique creates a secure thread base that won't slip, using the jam knot method.",
    keyPoints: [
      "Hold the thread tag end in your off hand and make an X over the hook shank",
      "Wrap the bobbin thread over the tag end 4-6 times to lock it in place",
      "Trim the tag end close — no knot is needed",
      "Maintain moderate tension to avoid breaking fine threads",
      "A tight thread base prevents materials from spinning on the hook",
    ],
    videos: [
      {
        title: "How to Start Thread on a Hook — Fly Tying Basics",
        url: "https://www.youtube.com/watch?v=KAk1G2N7Mh0",
        creatorName: "Tightline Productions",
        duration: "4:22",
        qualityScore: 5,
      },
    ],
  },

  // ─── Thread Work ────────────────────────────────────────────────────────────
  {
    name: "Whip Finish",
    slug: "whip-finish",
    category: TechniqueCategory.thread_work,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "The whip finish is the standard method for tying off your thread at the end of a fly. It creates a secure, neat knot that won't unravel. Every fly tier needs to master this technique, either by hand or with a whip finish tool.",
    keyPoints: [
      "The whip finish wraps the thread tag under several loops to lock it in place",
      "3-4 wraps is sufficient for most flies",
      "A whip finish tool makes consistent knots easier, especially on small flies",
      "Hand whip finishing gives more control once mastered",
      "Always apply a small drop of head cement after whip finishing",
    ],
    videos: [
      {
        title: "How to Whip Finish by Hand — Fly Tying Tutorial",
        url: "https://www.youtube.com/watch?v=9N2JpPmFaZo",
        creatorName: "InTheRiffle",
        duration: "7:35",
        qualityScore: 5,
      },
      {
        title: "Whip Finish Tool Tutorial for Beginners",
        url: "https://www.youtube.com/watch?v=RBnXMFH3jGY",
        creatorName: "Tim Flagler",
        duration: "6:14",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Half Hitch",
    slug: "half-hitch",
    category: TechniqueCategory.thread_work,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "The half hitch is a quick temporary knot used to secure thread at various points during tying. While not as secure as a whip finish for the final tie-off, it's invaluable for securing materials mid-fly and preventing unraveling if your thread breaks.",
    keyPoints: [
      "Loop the thread over your finger, then slide the loop over the hook eye",
      "Pull tight — the loop should cinch down on the shank",
      "Use 2-3 half hitches in succession for extra security",
      "Great for securing materials before switching to a different area of the fly",
      "Can be used as a final knot in a pinch, but a whip finish is preferred",
    ],
    videos: [
      {
        title: "Half Hitch Knot — Essential Fly Tying Technique",
        url: "https://www.youtube.com/watch?v=wE0F3qRmcTk",
        creatorName: "Fly Fish Food",
        duration: "3:47",
        qualityScore: 4,
      },
    ],
  },
  {
    name: "Thread Control and Tension",
    slug: "thread-control-tension",
    category: TechniqueCategory.thread_work,
    difficulty: TechniqueDifficulty.intermediate,
    description:
      "Mastering thread tension is what separates good fly tiers from great ones. Learn when to apply heavy wraps vs. loose wraps, how to flatten thread for smooth bodies, and how to spin thread for specific effects.",
    keyPoints: [
      "Spin the bobbin clockwise to cord the thread (stronger wraps, smaller diameter)",
      "Spin counter-clockwise to flatten the thread (smoother bodies, better coverage)",
      "Use light tension when positioning materials, then lock down with firm wraps",
      "Keep consistent tension to avoid a lumpy underbody",
      "Thread tension affects how materials flare, compress, and distribute around the shank",
    ],
    videos: [
      {
        title: "Thread Control Tips That Will Improve Your Flies",
        url: "https://www.youtube.com/watch?v=FxP_q3_X7pI",
        creatorName: "Davie McPhail",
        duration: "11:20",
        qualityScore: 5,
      },
    ],
  },

  // ─── Materials Prep ─────────────────────────────────────────────────────────
  {
    name: "Using a Hair Stacker",
    slug: "using-hair-stacker",
    category: TechniqueCategory.materials_prep,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "A hair stacker evens out the tips of hair fibers (elk, deer, etc.) so they form a clean, even wing or tail. This is essential for patterns like the Elk Hair Caddis and Comparadun.",
    keyPoints: [
      "Cut a small bunch of hair and remove the underfur with a fine comb",
      "Insert the hair tips-down into the stacker",
      "Tap the stacker firmly on the table 8-10 times",
      "Remove the bottom half to reveal perfectly aligned tips",
      "Work with small bunches — large clumps don't stack evenly",
    ],
    videos: [
      {
        title: "How to Use a Hair Stacker — Fly Tying Basics",
        url: "https://www.youtube.com/watch?v=w4k0KhqVCIA",
        creatorName: "Tightline Productions",
        duration: "5:02",
        qualityScore: 4,
      },
    ],
  },
  {
    name: "Preparing Hackle Feathers",
    slug: "preparing-hackle-feathers",
    category: TechniqueCategory.materials_prep,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Properly selecting and preparing hackle feathers before tying ensures cleaner flies and fewer frustrations. Learn to pick the right size, strip the base fibers, and prepare the stem for tie-in.",
    keyPoints: [
      "Size hackle by bending it perpendicular to the hook — fibers should equal 1.5x the hook gap",
      "Strip the fluffy base fibers to expose a clean stem for tie-in",
      "Stroke the fibers back to keep them out of the way during wrapping",
      "Wet hackle is more visible — good for checking fiber length",
      "Tie in by the stripped stem, shiny side facing you for proper wrap direction",
    ],
    videos: [
      {
        title: "Selecting and Preparing Hackle for Dry Flies",
        url: "https://www.youtube.com/watch?v=lRIikWMXJos",
        creatorName: "Tim Flagler",
        duration: "9:31",
        qualityScore: 5,
      },
    ],
  },

  // ─── Body Techniques ────────────────────────────────────────────────────────
  {
    name: "Dubbing",
    slug: "dubbing",
    category: TechniqueCategory.body_techniques,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Dubbing is the technique of applying fur or synthetic fibers to your thread to create fly bodies. It's one of the most fundamental and widely used body-building techniques in fly tying. Mastering a tight, even dubbing noodle takes practice but is essential.",
    keyPoints: [
      "Apply a thin layer of dubbing wax to the thread first (optional but helps grip)",
      "Use small amounts of dubbing — less is more",
      "Spin the dubbing onto the thread in one direction only",
      "The noodle should be thin and tight, not fluffy and loose",
      "Wrap the dubbed thread in touching turns for a smooth body, or leave gaps for a segmented look",
    ],
    videos: [
      {
        title: "How to Dub — Fly Tying Fundamentals",
        url: "https://www.youtube.com/watch?v=MP2OlPFWqlA",
        creatorName: "InTheRiffle",
        duration: "8:15",
        qualityScore: 5,
      },
      {
        title: "Dubbing Techniques — Touch Dubbing vs. Noodle Dubbing",
        url: "https://www.youtube.com/watch?v=jVPqChL-jsg",
        creatorName: "Davie McPhail",
        duration: "12:44",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Dubbing Loop",
    slug: "dubbing-loop",
    category: TechniqueCategory.body_techniques,
    difficulty: TechniqueDifficulty.intermediate,
    description:
      "A dubbing loop traps fibers between two strands of thread that are then twisted together, creating a thick, buggy rope of material. This is essential for creating shaggy nymph bodies, thoraxes, and collar hackles from dubbing or fur.",
    keyPoints: [
      "Create a loop of thread 3-4 inches long",
      "Insert dubbing material between the two thread strands",
      "Use a dubbing spinner tool to twist the loop into a tight rope",
      "Wrap the rope forward like hackle or chenille",
      "Pick out fibers with a dubbing needle for a buggy appearance",
    ],
    videos: [
      {
        title: "Dubbing Loop Technique — Step by Step",
        url: "https://www.youtube.com/watch?v=MN3XnIb7d3Y",
        creatorName: "Fly Fish Food",
        duration: "10:08",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Wrapping Chenille and Yarn",
    slug: "wrapping-chenille-yarn",
    category: TechniqueCategory.body_techniques,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Chenille and yarn are some of the easiest body materials to work with, making them perfect for beginners. Learn to tie in, wrap, and tie off these materials for full, even fly bodies like those on Woolly Buggers and San Juan Worms.",
    keyPoints: [
      "Expose the core thread at the tie-in point by stripping a small amount of chenille fibers",
      "Tie in by the exposed core to avoid bulk",
      "Wrap in touching turns for a full body, slight gaps for a segmented look",
      "Keep consistent tension to avoid a lumpy body",
      "Tie off securely and trim the excess at an angle",
    ],
    videos: [
      {
        title: "Chenille Body Techniques for Beginners",
        url: "https://www.youtube.com/watch?v=9aJ0gy-ZqFs",
        creatorName: "Tightline Productions",
        duration: "6:32",
        qualityScore: 4,
      },
    ],
  },
  {
    name: "Wrapping Peacock Herl",
    slug: "wrapping-peacock-herl",
    category: TechniqueCategory.body_techniques,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Peacock herl produces gorgeous iridescent bodies but is fragile on its own. Learn the rope technique (twisting herl with thread) to create durable, beautiful bodies for patterns like the Prince Nymph and Royal Coachman.",
    keyPoints: [
      "Select 3-4 herls and align the tips",
      "Tie in by the tips at the rear of the fly",
      "Twist the herls together with the tying thread to create a reinforced rope",
      "Wrap forward in touching turns to the thorax area",
      "The twisted rope method makes herl 10x more durable than wrapping single strands",
    ],
    videos: [
      {
        title: "Peacock Herl Body — The Right Way",
        url: "https://www.youtube.com/watch?v=Y8LJEP6OOnQ",
        creatorName: "Tim Flagler",
        duration: "7:44",
        qualityScore: 5,
      },
    ],
  },

  // ─── Hackle Techniques ──────────────────────────────────────────────────────
  {
    name: "Palmering Hackle",
    slug: "palmering-hackle",
    category: TechniqueCategory.hackle_techniques,
    difficulty: TechniqueDifficulty.intermediate,
    description:
      "Palmering is wrapping hackle in an open spiral from one end of the body to the other, creating a fuzzy, hackle-fiber-covered body. This is the key technique for Woolly Buggers, Stimulators, and palmered dry flies.",
    keyPoints: [
      "Tie in the hackle at the rear of the body, tip first",
      "Wrap the body material first, then palmer the hackle forward over it",
      "Space wraps evenly — 4-6 turns over the body length",
      "Counter-wrap wire or thread to reinforce the hackle and prevent fish teeth from pulling it loose",
      "Stroke fibers rearward as you wrap to avoid trapping them",
    ],
    videos: [
      {
        title: "How to Palmer Hackle — Fly Tying Tips",
        url: "https://www.youtube.com/watch?v=v5kqJ7wlb50",
        creatorName: "InTheRiffle",
        duration: "9:18",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Collar Hackle (Dry Fly Style)",
    slug: "collar-hackle-dry-fly",
    category: TechniqueCategory.hackle_techniques,
    difficulty: TechniqueDifficulty.intermediate,
    description:
      "Collar hackle is the classic dry fly technique where hackle is wound in tight turns at the thorax area, creating a dense ring of fibers that helps the fly float. This is used on the Adams, Royal Wulff, and countless other dry flies.",
    keyPoints: [
      "Tie hackle in just behind the eye, stripped stem first",
      "Make 3-5 tight wraps, each turn directly against the previous one",
      "Wrapping behind and in front of wing posts distributes fibers evenly",
      "Use quality hackle with stiff, uniform barbs for the best flotation",
      "Trim a V on the bottom for a flush-floating effect (optional)",
    ],
    videos: [
      {
        title: "Winding Dry Fly Hackle — Perfect Every Time",
        url: "https://www.youtube.com/watch?v=MHg2_B6Tlqo",
        creatorName: "Davie McPhail",
        duration: "8:56",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Parachute Hackle",
    slug: "parachute-hackle",
    category: TechniqueCategory.hackle_techniques,
    difficulty: TechniqueDifficulty.advanced,
    description:
      "Parachute hackle is wound horizontally around a vertical post (usually a wing post), causing the fly to land upright with the hackle splayed flat on the water surface. This creates a very natural, flush-sitting dry fly and is used on the Parachute Adams and many modern dry patterns.",
    keyPoints: [
      "Build a sturdy post first (calf tail, poly yarn, or foam) and secure with thread wraps at the base",
      "Tie the hackle in at the base of the post, shiny side up",
      "Wrap downward around the post (from top to bottom) for 3-5 turns",
      "Secure the hackle tip under the hook shank and whip finish below the hackle",
      "The hackle should form a horizontal disc around the post",
    ],
    videos: [
      {
        title: "Parachute Hackle Made Easy",
        url: "https://www.youtube.com/watch?v=EAaU3GCFR8Y",
        creatorName: "Tightline Productions",
        duration: "12:05",
        qualityScore: 5,
      },
    ],
  },

  // ─── Wing Techniques ────────────────────────────────────────────────────────
  {
    name: "Elk Hair Wings",
    slug: "elk-hair-wings",
    category: TechniqueCategory.wing_techniques,
    difficulty: TechniqueDifficulty.intermediate,
    description:
      "Elk hair wings are the defining feature of caddis-style dry flies. The hollow hair provides buoyancy while creating a realistic tent-wing silhouette. Getting the right length, density, and tie-in technique is critical.",
    keyPoints: [
      "Cut, clean, and stack the elk hair before measuring",
      "Measure the wing to extend just past the hook bend",
      "Use 2-3 soft pinch wraps before pulling tight to prevent the hair from spinning",
      "Trim the butts at an angle to form a smooth, tapered head",
      "Too much hair makes a bulky fly; too little won't float well",
    ],
    videos: [
      {
        title: "Tying Elk Hair Wings That Don't Spin",
        url: "https://www.youtube.com/watch?v=VIvfqDTYbIM",
        creatorName: "Fly Fish Food",
        duration: "7:28",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Upright Divided Wings",
    slug: "upright-divided-wings",
    category: TechniqueCategory.wing_techniques,
    difficulty: TechniqueDifficulty.advanced,
    description:
      "Upright divided wings (matched wing slips or hackle tips posted upright and separated) create the classic mayfly silhouette. This technique is used on traditional patterns like the Adams and Light Cahill.",
    keyPoints: [
      "Select matched feather tips or wing quill slips of equal size",
      "Tie them in on top of the shank with pinch wraps, tips pointing up",
      "Post them upright with wraps at the base",
      "Separate the wings with figure-eight thread wraps between them",
      "A tiny drop of head cement at the base adds durability",
    ],
    videos: [
      {
        title: "How to Tie Upright and Divided Wings",
        url: "https://www.youtube.com/watch?v=F3r-AaPcB8E",
        creatorName: "Tim Flagler",
        duration: "10:22",
        qualityScore: 5,
      },
    ],
  },

  // ─── Head & Finishing ───────────────────────────────────────────────────────
  {
    name: "Building a Thread Head",
    slug: "building-thread-head",
    category: TechniqueCategory.head_finishing,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "A clean thread head is the finishing touch that separates amateur flies from professional ones. Learn to build a smooth, tapered head that covers all the tag ends and transitions cleanly to the hook eye.",
    keyPoints: [
      "Start wraps at the front and work rearward, then forward again to build layers",
      "Use smooth, overlapping wraps — no gaps or bumps",
      "Keep the head proportional to the fly size (smaller flies = smaller heads)",
      "Leave the hook eye clear of thread and cement",
      "Apply head cement or UV resin for a glossy, durable finish",
    ],
    videos: [
      {
        title: "Fly Tying Tip: Building a Perfect Thread Head",
        url: "https://www.youtube.com/watch?v=q9PdqD3gkZk",
        creatorName: "InTheRiffle",
        duration: "5:10",
        qualityScore: 4,
      },
    ],
  },
  {
    name: "Applying Head Cement and UV Resin",
    slug: "head-cement-uv-resin",
    category: TechniqueCategory.head_finishing,
    difficulty: TechniqueDifficulty.beginner,
    description:
      "Head cement and UV resin protect the thread head and whip finish from unraveling. Learn when to use thin vs. thick cement, how to apply UV resin without flooding the hook eye, and how to get a glossy professional finish.",
    keyPoints: [
      "Thin head cement (like Sally Hansen Hard as Nails) penetrates into the thread wraps",
      "Thick cement or UV resin creates a glossy shell over the head",
      "Apply with a bodkin needle for precision — don't use too much",
      "UV resin cures in seconds with a UV light and is very durable",
      "Always clear the hook eye with a bodkin or hackle gauge after applying cement",
    ],
    videos: [
      {
        title: "Head Cement vs UV Resin — Which Should You Use?",
        url: "https://www.youtube.com/watch?v=DhH4LBWZ7xY",
        creatorName: "Tightline Productions",
        duration: "8:33",
        qualityScore: 4,
      },
    ],
  },

  // ─── Specialty ──────────────────────────────────────────────────────────────
  {
    name: "Euro Nymphing Fly Design",
    slug: "euro-nymphing-fly-design",
    category: TechniqueCategory.specialty,
    difficulty: TechniqueDifficulty.advanced,
    description:
      "Euro nymphing (also called tight-line or Czech nymphing) has specific fly design requirements. Learn to tie slim, heavy, fast-sinking nymphs with tungsten beads, thin profiles, and hot spots that are purpose-built for this technique.",
    keyPoints: [
      "Use slotted tungsten beads for maximum weight in a small profile",
      "Keep bodies very thin — the goal is to cut through the water column quickly",
      "Add a hot spot collar (fluorescent thread or dubbing) behind the bead",
      "Use UV resin to coat the body for a smooth, durable, fast-sinking fly",
      "Tie on jig hooks (60-degree bend) to ride hook point up and reduce snags",
    ],
    videos: [
      {
        title: "Tying Euro Nymphs — Perdigon and Waltz Worm",
        url: "https://www.youtube.com/watch?v=39OeAY1SdRo",
        creatorName: "Lance Egan",
        duration: "14:45",
        qualityScore: 5,
      },
    ],
  },
  {
    name: "Spinning Deer Hair",
    slug: "spinning-deer-hair",
    category: TechniqueCategory.specialty,
    difficulty: TechniqueDifficulty.advanced,
    description:
      "Spinning and stacking deer hair is an advanced technique used to create buoyant, sculpted fly heads and bodies. This is the technique behind iconic patterns like the Muddler Minnow, bass poppers, and mouse patterns.",
    keyPoints: [
      "Use hollow, properly prepared deer body hair (not leg or tail hair)",
      "Make 2-3 loose wraps, then pull tight to spin the hair 360 degrees around the shank",
      "Pack each bunch tightly against the previous one using a hair packer tool",
      "Repeat in bunches until the desired area is filled",
      "Trim to shape with sharp scissors or a razor blade after the fly is complete",
    ],
    videos: [
      {
        title: "How to Spin Deer Hair — Detailed Tutorial",
        url: "https://www.youtube.com/watch?v=P1C3RKr3AGk",
        creatorName: "Tim Flagler",
        duration: "16:20",
        qualityScore: 5,
      },
    ],
  },
];

async function main() {
  console.log("Seeding tying techniques...");

  for (const tech of TECHNIQUES) {
    const technique = await prisma.tyingTechnique.upsert({
      where: { slug: tech.slug },
      update: {
        description: tech.description,
        keyPoints: tech.keyPoints,
      },
      create: {
        name: tech.name,
        slug: tech.slug,
        category: tech.category,
        difficulty: tech.difficulty,
        description: tech.description,
        keyPoints: tech.keyPoints,
      },
    });

    for (const video of tech.videos) {
      await prisma.techniqueVideo.upsert({
        where: { url: video.url },
        update: {
          title: video.title,
          qualityScore: video.qualityScore,
        },
        create: {
          techniqueId: technique.id,
          title: video.title,
          url: video.url,
          creatorName: video.creatorName,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          qualityScore: video.qualityScore,
        },
      });
    }

    console.log(`  + ${tech.name} (${tech.videos.length} videos)`);
  }

  console.log(`\nSeeded ${TECHNIQUES.length} techniques!`);
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
