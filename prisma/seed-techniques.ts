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
  steps: {
    position: number;
    title: string;
    instruction: string;
    tip?: string;
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
    steps: [
      {
        position: 1,
        title: "Choose your mounting method",
        instruction:
          "Decide between a pedestal base or a clamp mount. A pedestal base works on any flat surface and is easy to move, while a clamp mount locks to the edge of a table and provides a more stable platform. If you have a dedicated tying desk, the clamp is preferable.",
        tip: "If using a pedestal, place a rubber mat underneath to prevent it from sliding during tying.",
      },
      {
        position: 2,
        title: "Set the vise height",
        instruction:
          "Adjust the stem height so the jaws sit approximately at your eye level when you are seated in your normal tying position. You should be able to look directly at the hook without hunching over or craning your neck. Most vises have a collet or set screw on the post for this adjustment.",
        tip: "Err on the side of slightly too high rather than too low. Hunching over the vise for long sessions leads to neck and back strain.",
      },
      {
        position: 3,
        title: "Adjust the jaw angle",
        instruction:
          "Tilt the vise head so the jaws hold the hook shank roughly parallel to the table surface, or angled slightly downward toward you. This gives you the best access to wrap thread and materials around the hook. If your vise has a true rotary feature, ensure the axis of rotation aligns with the hook shank.",
      },
      {
        position: 4,
        title: "Set the jaw tension",
        instruction:
          "Open the jaws and insert a hook of the size you plan to tie on. Tighten the jaw adjustment knob until the hook is held firmly in place. Test by pressing gently on the hook bend — it should not slip or rotate. Be careful not to over-tighten, which can crush the hook bend or damage the jaws.",
        tip: "For very small hooks (size 18 and below), use just enough tension to hold the hook. Over-tightening tiny hooks can snap them.",
      },
      {
        position: 5,
        title: "Position the hook in the jaws",
        instruction:
          "Insert the hook so that the jaws grip the lower portion of the hook bend. The hook point should be partially hidden inside or just below the jaws. This prevents your thread from catching on the hook point while you tie, which is one of the most common frustrations for beginners.",
      },
      {
        position: 6,
        title: "Organize your workspace",
        instruction:
          "Position your bobbin, scissors, hackle pliers, and other tools within easy reach of your dominant hand. Place your materials trays or bags on your off-hand side. Good organization reduces fumbling and makes your tying sessions more productive and enjoyable.",
        tip: "A magnetic tool holder mounted on the vise stem keeps scissors and bodkins instantly accessible.",
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
    steps: [
      {
        position: 1,
        title: "Position the thread against the hook shank",
        instruction:
          "Hold the bobbin in your dominant hand and the tag end of the thread in your off hand. Lay the thread against the near side of the hook shank about one-third of the way back from the hook eye. The tag end should point toward you and slightly upward, while the bobbin thread runs over the top of the shank to the far side.",
      },
      {
        position: 2,
        title: "Cross the thread to form an X",
        instruction:
          "Bring the bobbin thread behind the hook shank and over the top to create an X-shaped cross over the tag end. This initial cross is what locks the thread in place. Hold the tag end taut at roughly a 45-degree angle above the shank while you make this first crossing wrap.",
        tip: "Keep tension on both the tag end and the bobbin thread. If either goes slack, the thread will not grip the shank.",
      },
      {
        position: 3,
        title: "Make locking wraps over the tag end",
        instruction:
          "Continue wrapping the bobbin thread toward the rear of the hook, laying each wrap directly over the tag end. Make 5-7 firm, touching wraps. Each wrap further locks the tag end under the thread, creating a secure jam knot that will not slip.",
      },
      {
        position: 4,
        title: "Trim the tag end",
        instruction:
          "Once you have made enough locking wraps, pull the tag end taut and trim it as close to the shank as possible with your scissors. The remaining thread base should be smooth and flat against the shank with no visible tag sticking up.",
        tip: "Use fine-tipped scissors for a clean trim. Leaving a long tag stump creates a bump that will show through thin body materials.",
      },
      {
        position: 5,
        title: "Build a thread base",
        instruction:
          "Continue wrapping the thread in smooth, touching turns rearward to the point where the fly body will begin (usually above the hook barb). Then wrap forward to the starting point. This double layer of thread creates a slightly rough surface that helps materials grip the hook shank and prevents them from spinning.",
        tip: "A good thread base is the foundation of a durable fly. Skipping this step is the most common cause of materials rotating around the hook.",
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
    steps: [
      {
        position: 1,
        title: "Position your thread at the head",
        instruction:
          "Before starting the whip finish, make sure your thread is hanging directly behind the hook eye where you want the final knot to sit. The thread head should be smooth and tapered. Remove the bobbin from any material holders and let it hang freely below the hook.",
        tip: "Complete all other tying steps and build a neat thread head before whip finishing. The whip finish is always the very last thing you do.",
      },
      {
        position: 2,
        title: "Form the initial triangle",
        instruction:
          "Raise your hand and catch the thread across the back of your index and middle fingers, creating a triangular shape between your fingers and the hook. Your fingers should be spread about two inches apart. The thread should form a clear V shape with one leg going to the hook and the other to the bobbin.",
      },
      {
        position: 3,
        title: "Rotate and make the first wrap",
        instruction:
          "Rotate your hand forward and down so that the thread crossing your fingers rolls over the top of the hook shank. The loop should now encircle the shank with the tag side of the thread laying under the wrapping thread. Keep tension consistent as you make this first pass around the shank.",
        tip: "Practice this motion slowly. The key is maintaining tension on both legs of the thread loop so the wraps are tight against the shank.",
      },
      {
        position: 4,
        title: "Make 4-5 wrapping turns",
        instruction:
          "Continue the wrapping motion, rotating the loop around the shank 4-5 times. Each wrap should lay neatly against the previous one, working slightly rearward. The wrapping thread is trapping the tag end under each successive turn. Keep your fingers spread to maintain the loop shape.",
      },
      {
        position: 5,
        title: "Pull the loop closed",
        instruction:
          "After completing your wraps, carefully slip your fingers out of the loop. Use a bodkin or dubbing needle inserted into the remaining loop to maintain control. Slowly pull the bobbin to close the loop, drawing the tag end tight under the wraps. Pull firmly to seat the knot.",
        tip: "Insert a bodkin tip into the loop before removing your fingers. This gives you precise control over where the knot seats as you pull it closed.",
      },
      {
        position: 6,
        title: "Trim the thread and apply cement",
        instruction:
          "Once the whip finish knot is tight, trim the thread close to the head with sharp scissors. Apply a small drop of head cement or Sally Hansen Hard as Nails to the finished head using a bodkin tip. The cement will wick into the thread wraps and lock everything permanently in place.",
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
    steps: [
      {
        position: 1,
        title: "Position the thread",
        instruction:
          "Let the bobbin hang below the hook at the point where you want to place the half hitch. This is typically at the head of the fly, but half hitches can be used anywhere along the shank to lock materials in place during the tying process.",
      },
      {
        position: 2,
        title: "Form a loop over your finger",
        instruction:
          "Place your index finger against the thread near the hook. Push the thread forward and over your fingertip toward the hook eye, creating a small loop. The loop should be large enough to slip over the hook eye but not so large that it becomes unmanageable.",
        tip: "Some tiers prefer using a half-hitch tool or the tip of a pen barrel instead of their finger. This can produce more consistent results on small flies.",
      },
      {
        position: 3,
        title: "Slide the loop over the hook eye",
        instruction:
          "Transfer the loop from your finger onto the hook eye by sliding it forward. Guide the loop so it passes cleanly over the eye and seats on the hook shank right behind the eye. Keep light tension on the bobbin as you position the loop.",
      },
      {
        position: 4,
        title: "Cinch the knot tight",
        instruction:
          "Pull the bobbin straight down and slightly rearward to tighten the loop flat against the shank. The knot should close neatly at the point where you want it to sit. Apply firm but not excessive tension — you want the knot snug but not so tight that it distorts the thread underbody.",
        tip: "Alternate the direction of successive half hitches (one from the near side, the next from the far side) for a more secure hold that resists loosening.",
      },
      {
        position: 5,
        title: "Repeat for security",
        instruction:
          "A single half hitch can slip under pressure. For a reliable tie-off, make 3-4 half hitches in succession, each one seating snugly against the last. While not as secure as a whip finish, multiple half hitches provide a reliable knot, especially useful when learning or when tying mid-fly.",
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
    steps: [
      {
        position: 1,
        title: "Understand thread twist and its effects",
        instruction:
          "Every wrap you make around the hook adds twist to the thread. A clockwise-spinning bobbin cords the thread into a tight rope, which is useful for strong tie-down wraps. A counter-clockwise spin flattens the thread into a ribbon, which lays smoother and creates less bulk. Learn to feel the difference by watching how the thread behaves as it contacts the shank.",
        tip: "Hold the bobbin still and let it dangle to see which way it spins — this tells you whether your thread is currently corded or flat.",
      },
      {
        position: 2,
        title: "Practice light tension positioning wraps",
        instruction:
          "When initially placing a material on the hook, use light tension wraps to hold it in position. These are gentle turns that let you adjust the material placement before committing. Wrap 2-3 light turns, check the position of the material, and only then apply firm tension to lock it down.",
      },
      {
        position: 3,
        title: "Apply firm lock-down wraps",
        instruction:
          "Once a material is positioned where you want it, apply 3-4 wraps with firm, deliberate tension. Pull straight down or toward you to apply maximum force. These wraps should compress and lock the material in place permanently. The difference between a positioning wrap and a lock-down wrap is significant — practice both.",
        tip: "If the thread breaks during a lock-down wrap, you were pulling too hard. Fine threads (8/0 and smaller) require a lighter touch. Switch to 6/0 thread while learning tension control.",
      },
      {
        position: 4,
        title: "Flatten thread for smooth bodies",
        instruction:
          "Before building body layers or wrapping over quill bodies, counter-spin your bobbin to flatten the thread into a wide ribbon. Flat thread covers more area per wrap, creates smoother underbodies, and adds less bulk. This is critical for thin-bodied patterns like comparaduns and many dry flies.",
      },
      {
        position: 5,
        title: "Cord thread for material tie-ins",
        instruction:
          "When tying in materials that need to be firmly secured — like hair wings, heavy lead wraps, or bead-chain eyes — spin your bobbin clockwise to cord the thread. Corded thread bites into materials with a smaller contact point and delivers more holding power per wrap.",
      },
      {
        position: 6,
        title: "Maintain consistent bobbin angle",
        instruction:
          "Keep the bobbin tube at a consistent angle as you wrap. Sudden direction changes cause the thread to jump or create uneven wraps. Develop a smooth, rhythmic wrapping motion where the bobbin travels in a consistent arc around the hook shank. Let gravity help — the weight of the bobbin provides natural tension when it hangs below the hook.",
        tip: "The ideal bobbin drop distance is 4-6 inches below the hook. Too short and you lose leverage; too long and you lose control.",
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
    steps: [
      {
        position: 1,
        title: "Cut a bundle of hair from the hide",
        instruction:
          "Using sharp scissors, cut a pencil-diameter bundle of elk or deer hair close to the hide. Cut from an area with straight, even-length fibers. Avoid patches where the hair is kinked, wavy, or has broken tips. Hold the bundle by the tips after cutting to keep the orientation consistent.",
        tip: "For elk hair caddis wings, select hair from the cow elk body patch, which has finer and straighter fibers than bull elk hair.",
      },
      {
        position: 2,
        title: "Remove underfur and short fibers",
        instruction:
          "Hold the bundle firmly by the tips and use a fine-toothed comb or your fingers to pull out all the soft underfur and short, broken hairs from the butt ends. This debris creates bulk at the tie-in point and prevents the hair from stacking cleanly. Work through the bundle until only the long, clean guard hairs remain.",
      },
      {
        position: 3,
        title: "Insert the hair into the stacker tips-down",
        instruction:
          "Place the cleaned bundle into the stacker tube with the tips pointing downward. The tips are the ends that were farthest from the hide. Gravity and the tapping action will cause the tips to settle to the bottom of the tube, aligning them evenly regardless of fiber length.",
      },
      {
        position: 4,
        title: "Tap the stacker firmly on a hard surface",
        instruction:
          "Hold the stacker upright and tap the bottom firmly on the table or a book 8-12 times. Each tap allows the hair tips to settle and align. You should hear the hairs shuffling inside the tube with each tap. Firm, consistent taps work better than rapid, light tapping.",
        tip: "If the tips are not aligning evenly, the bundle may be too large. Remove some hair and try again with a smaller batch.",
      },
      {
        position: 5,
        title: "Remove the stacked hair",
        instruction:
          "Carefully separate the two halves of the stacker. Tilt the bottom section on its side and slide the hair bundle out, gripping the now-perfectly-aligned tips between your thumb and forefinger. Keep a firm hold on the tips so the alignment is not disturbed as you transfer the bundle to the hook.",
      },
      {
        position: 6,
        title: "Measure and prepare for tie-in",
        instruction:
          "Hold the stacked bundle against the hook with the tips extending rearward to your desired wing length. For an elk hair caddis, the tips should extend just past the hook bend. Mark the tie-in point mentally, then transfer the bundle to your tying hand, keeping the tips aligned and ready for your pinch wraps.",
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
    steps: [
      {
        position: 1,
        title: "Select the right feather size",
        instruction:
          "Choose a hackle feather with barb length appropriate for your hook size. Hold the feather perpendicular to the hook shank and bend a few barbs outward at 90 degrees. For a standard dry fly, the barbs should be approximately 1.5 times the hook gap width. For wet flies, choose slightly longer and softer hackle.",
        tip: "Hackle gauge cards are inexpensive tools that take the guesswork out of sizing. They are well worth the investment for consistent flies.",
      },
      {
        position: 2,
        title: "Strip the base fibers",
        instruction:
          "Grab the fluffy, webby fibers near the base of the feather stem and strip them away. Pull them downward toward the butt of the feather. Remove enough to expose a clean section of bare stem about 3-4 millimeters long. This bare stem is what you will tie onto the hook shank.",
      },
      {
        position: 3,
        title: "Stroke the fibers rearward",
        instruction:
          "Starting from the stripped tie-in area, stroke all the remaining fibers rearward (toward the tip of the feather) so they are swept back and out of the way. This prevents fibers from being trapped during the first wraps. Moistening your fingers slightly helps the fibers stay in position.",
      },
      {
        position: 4,
        title: "Identify the shiny and dull sides",
        instruction:
          "Hackle feathers have a shiny (convex) side and a dull (concave) side. For most dry fly applications, tie the feather in with the shiny side facing you and the dull side facing the hook eye. When wrapped, the fibers will naturally curve forward, which helps them splay outward for better flotation.",
        tip: "For wet fly hackle, reverse the orientation so the fibers sweep rearward along the body, mimicking the profile of legs or emerging wings.",
      },
      {
        position: 5,
        title: "Tie in the hackle by the bare stem",
        instruction:
          "Position the stripped stem against the hook shank at the tie-in point. Secure it with 4-5 tight wraps of thread over the bare stem. The stem should lay flat along the shank. Trim any excess stem that extends past the tie-in wraps to keep the underbody smooth.",
      },
      {
        position: 6,
        title: "Verify before wrapping",
        instruction:
          "Before committing to wrapping the hackle, give the feather a gentle test pull to ensure it is securely anchored. Check that the first usable fibers begin right where the tie-in wraps end, with no gap. The feather should be oriented correctly so the first wrap will fold fibers in the desired direction.",
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
    steps: [
      {
        position: 1,
        title: "Apply dubbing wax to the thread",
        instruction:
          "Pull a few inches of thread out from the bobbin and lightly coat it with dubbing wax by pressing the wax stick against the thread and sliding it along. The wax creates a tacky surface that helps the dubbing fibers grip. You only need a thin, even coating — too much wax makes a clumpy mess.",
        tip: "Dubbing wax is optional with some modern sticky dubbing materials, but it makes a significant difference with natural furs like rabbit or hare's ear.",
      },
      {
        position: 2,
        title: "Pull a small amount of dubbing material",
        instruction:
          "Take a tiny pinch of dubbing from the bag. For beginners, the most common mistake is using too much. The amount should be barely visible between your fingertips — a sparse wisp of fiber. You can always add more, but removing excess dubbing from the thread is difficult and wastes time.",
      },
      {
        position: 3,
        title: "Spin the dubbing onto the thread",
        instruction:
          "Place the dubbing fibers against the waxed thread and, using only your thumb and forefinger, roll them in one direction (typically away from you) to twist the fibers around the thread. Work in one direction only — rolling back and forth simply undoes your work. The goal is a thin, tight noodle with no gaps and no lumps.",
        tip: "Apply just enough pressure to catch the fibers. Pressing too hard creates a flat, crushed noodle that won't have a natural appearance on the fly.",
      },
      {
        position: 4,
        title: "Build a tapered dubbing noodle",
        instruction:
          "Start with the thinnest dubbing at the hook bend and gradually add slightly more material as you move forward. This creates a body that tapers naturally from thin at the tail to thicker at the thorax, which mimics the shape of real aquatic insects. Apply dubbing to 2-3 inches of thread at a time.",
      },
      {
        position: 5,
        title: "Wrap the dubbed thread onto the hook",
        instruction:
          "Wrap the dubbed thread around the hook shank in smooth, touching turns, working from the rear of the body toward the front. Let each wrap lay gently against the previous one. If you see the thread showing between wraps, your noodle is too thin at that point — add a touch more dubbing and continue.",
      },
      {
        position: 6,
        title: "Pick out fibers for a buggy look",
        instruction:
          "For nymph and wet fly patterns that benefit from a shaggy appearance, use a dubbing needle or a small piece of Velcro to gently tease out individual fibers from the dubbed body. This creates a buggy, lifelike silhouette that suggests legs and movement in the water. For dry flies and smooth-bodied nymphs, skip this step and keep the body tight.",
        tip: "A strip of male Velcro wrapped around a pencil makes an excellent dubbing brush for picking out fibers evenly.",
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
    steps: [
      {
        position: 1,
        title: "Create the thread loop",
        instruction:
          "At the point on the hook where you want to begin the dubbed section, pull 4-6 inches of thread downward from the shank. Bring the bobbin back up to the hook and secure the loop with one wrap so that two parallel strands of thread now hang below the hook. Clip a dubbing spinner or hackle pliers onto the bottom of the loop to keep it weighted and under tension.",
        tip: "The loop length should be roughly twice the length of the body section you plan to cover, since the material compresses significantly when twisted.",
      },
      {
        position: 2,
        title: "Advance the thread and prepare for loading",
        instruction:
          "Wrap your bobbin thread forward on the hook shank to the point where the dubbed section will end. This secures the base of the loop and positions your thread for tying off the finished rope later. The loop should be hanging freely below the hook with the spinner tool at the bottom.",
      },
      {
        position: 3,
        title: "Load dubbing into the loop",
        instruction:
          "Separate the two strands of the loop with your fingers. Place a thin, even layer of dubbing fibers between the two strands, distributing the material along the full length of the loop. For buggy nymphs, use longer fibers like hare's ear guard hairs. For smoother bodies, use shorter, finer dubbing. Keep the layer thin — it will bulk up considerably when twisted.",
      },
      {
        position: 4,
        title: "Spin the loop into a rope",
        instruction:
          "Release the two strands and let them come together with the dubbing sandwiched between them. Spin the dubbing spinner tool to twist the loop into a tight, chenille-like rope. Spin until the fibers flare outward from the twisted core. The rope should hold together firmly when you stop spinning.",
        tip: "Spin in one direction only. If you let the tool unwind, you lose all your work. Keep tension on the tool weight at all times.",
      },
      {
        position: 5,
        title: "Wrap the dubbing rope forward",
        instruction:
          "Wrap the twisted dubbing rope forward around the hook shank like you would wrap hackle or chenille. Stroke the fibers rearward before each wrap to avoid trapping them under the next turn. Make touching or slightly overlapping wraps depending on how full you want the body to be.",
      },
      {
        position: 6,
        title: "Tie off and trim",
        instruction:
          "When the rope reaches the tie-off point, secure it with several tight wraps of thread. Trim the excess rope close to the tie-in. Use a dubbing needle to pick out any fibers that were trapped under wraps, restoring the full buggy profile of the body.",
      },
      {
        position: 7,
        title: "Shape the final profile",
        instruction:
          "Use a dubbing brush or piece of Velcro to brush out the fibers and blend the body into a cohesive shape. Trim any fibers that are drastically longer than the rest. The finished dubbing loop body should have an even, radiating profile of fibers that suggests legs and movement.",
        tip: "For nymph thoraxes, concentrate more material in the dubbing loop to create a pronounced, bulky thorax that contrasts with the thinner abdomen.",
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
    steps: [
      {
        position: 1,
        title: "Prepare the chenille for tie-in",
        instruction:
          "Strip approximately half an inch of the fuzzy fibers from one end of the chenille to expose the bare core threads. You can do this by pinching the fibers and pulling them away, or by scraping with your thumbnail. The exposed core is thin and flat, which creates a much cleaner tie-in point with minimal bulk.",
        tip: "If using yarn instead of chenille, no stripping is needed. Simply trim the end to a tapered point to reduce bulk at the tie-in.",
      },
      {
        position: 2,
        title: "Tie in at the rear of the body",
        instruction:
          "Position the exposed core against the hook shank at the rear tie-in point (usually just above the barb or where the tail ends). Secure it with 5-6 firm thread wraps over the core. Advance your thread forward to the point where the body will end, typically just behind the thorax area.",
      },
      {
        position: 3,
        title: "Wrap the chenille forward in even turns",
        instruction:
          "Grip the chenille with your fingers or hackle pliers and begin wrapping forward around the hook shank. For a full, even body, make each wrap directly against the previous one with no gaps between turns. For a segmented appearance, leave small, consistent gaps between wraps so the underlying thread base shows through.",
        tip: "Keep consistent tension on each wrap. Uneven tension creates a lumpy body with thin and thick spots.",
      },
      {
        position: 4,
        title: "Tie off the chenille",
        instruction:
          "When you reach the tie-off point where your thread is waiting, hold the chenille taut and make 4-5 tight wraps of thread over the chenille to lock it down. Before trimming, make sure the chenille is fully secured by giving it a gentle tug. Trim the excess chenille close to the tie-off point at a slight angle.",
      },
      {
        position: 5,
        title: "Cover the tag end and smooth the transition",
        instruction:
          "Make several wraps of thread over the trimmed chenille stump to create a smooth transition between the body and the next section of the fly. If there is a visible bump, build up thread wraps around it to taper the profile. The goal is a seamless transition from the chenille body to the thorax or head area.",
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
    steps: [
      {
        position: 1,
        title: "Select and align the herl fibers",
        instruction:
          "Choose 3-5 peacock herls from an eye feather, selecting strands with thick, iridescent flue. Align the tips together so they are even. The herls should come from the same section of the feather so their fibers are roughly the same length and density. Avoid herls with sparse or broken flue.",
        tip: "Herls from just below the eye of the peacock feather have the thickest, most iridescent flue. Those from the top of the feather are thinner and more fragile.",
      },
      {
        position: 2,
        title: "Tie in by the tips",
        instruction:
          "Tie the herl bundle in by the tips at the rear of the body. Position the tips along the top of the shank and secure them with 5-6 tight thread wraps, working forward. The butt ends with the full flue should be hanging rearward, ready to be wrapped forward. Advance your tying thread to the front of the body area.",
      },
      {
        position: 3,
        title: "Create a reinforced herl rope",
        instruction:
          "This is the key to a durable peacock herl body. Gather the herl bundle and your tying thread together and twist them into a rope by spinning them between your fingers. Twist tightly so the thread spirals around and through the herl fibers. This thread reinforcement makes the body dramatically more durable against fish teeth.",
        tip: "Without the rope technique, peacock herl bodies fall apart after one or two fish. With it, they can last a dozen or more.",
      },
      {
        position: 4,
        title: "Wrap the herl rope forward",
        instruction:
          "Wrap the twisted herl rope forward around the hook shank in touching turns. Keep the rope under consistent tension as you wrap, making sure each turn sits snugly against the previous one. The herl fibers should flare outward from the shank, creating a full, iridescent body with no visible gaps.",
      },
      {
        position: 5,
        title: "Tie off and secure the herl",
        instruction:
          "When you reach the tie-off point, untwist the rope slightly so the thread separates from the herl. Use the thread to tie off the herl with 4-5 firm wraps. Trim the excess herl close to the shank. Build a few thread wraps over the stub to smooth the transition to the next section of the fly.",
      },
      {
        position: 6,
        title: "Inspect and adjust the body",
        instruction:
          "Examine the finished body from all angles. The herl should form a consistent, fuzzy, iridescent cylinder around the shank. If any spots look thin, you can wrap a single additional herl over that area. Gently stroke any errant fibers into position with your fingers or a dubbing needle.",
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
    steps: [
      {
        position: 1,
        title: "Select and prepare the hackle feather",
        instruction:
          "Choose a hackle feather with barbs slightly longer than you would use for a collar hackle, since palmered hackle gets trimmed down by the body material. A saddle hackle works well for palmering because of its consistent barb length along the stem. Strip the base fibers and prepare the feather for tie-in as you would for any hackle application.",
      },
      {
        position: 2,
        title: "Tie in the hackle at the rear",
        instruction:
          "Secure the hackle feather by its stripped stem at the rear of the body, right where the tail is tied in. The feather tip should be pointing rearward. Make 4-5 firm wraps over the stem and trim any excess. The butt end of the feather with the full barbs should be pointing forward, ready to wrap after the body is complete.",
        tip: "Tie in the hackle before the body material. The body is then wrapped over the hackle stem, further securing it.",
      },
      {
        position: 3,
        title: "Wrap the body material first",
        instruction:
          "Wrap your body material (chenille, dubbing, or yarn) forward over the hackle stem in the usual manner. This covers the hackle tie-in and creates the body that the palmered hackle will be wrapped over. Leave the hackle feather hanging at the rear, out of the way, while you complete the body.",
      },
      {
        position: 4,
        title: "Palmer the hackle forward in open spirals",
        instruction:
          "Grip the hackle butt with hackle pliers and begin wrapping it forward over the body in an evenly spaced open spiral. Space the wraps so you get 4-6 turns over the entire body length. As you wrap, gently stroke the barbs rearward with your off hand so they are not trapped under the next turn of hackle.",
        tip: "Wrap the hackle in the opposite direction of the body material. If the body was wrapped clockwise, palmer the hackle counter-clockwise. This prevents the hackle from nesting into the body wraps and creates better fiber separation.",
      },
      {
        position: 5,
        title: "Tie off the hackle at the front",
        instruction:
          "When the hackle reaches the front of the body, secure the feather with 3-4 tight thread wraps. The barbs near the tie-off may be shorter and webby — this is fine since they will be covered by the thorax. Trim the excess hackle stem cleanly and cover the stump with thread wraps.",
      },
      {
        position: 6,
        title: "Counter-wrap with wire for durability",
        instruction:
          "If you tied in a piece of fine copper or gold wire at the rear of the body alongside the hackle, now wrap it forward through the palmered hackle in an open spiral following the same gaps between hackle turns. This wire crosses over the hackle stem at each turn, locking the hackle in place so that if a fish tooth cuts one wrap, the entire hackle does not unravel.",
        tip: "Wiggle the wire back and forth slightly as you wrap to avoid trapping hackle barbs under the wire. Tie off the wire at the front with several firm wraps, then helicopter the tag end to break it cleanly.",
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
    steps: [
      {
        position: 1,
        title: "Prepare and tie in the hackle feather",
        instruction:
          "Select a dry fly quality hackle feather sized to match your hook. The barbs should be stiff and uniform, approximately 1.5 times the width of the hook gap. Strip the base fibers to expose the stem and tie it in just behind the hook eye, leaving enough room for the thread head. Secure the stripped stem with firm wraps, shiny side facing you.",
        tip: "High-quality genetic hackle from brands like Whiting or Metz makes a significant difference in collar hackle performance. Budget hackle often has soft, uneven barbs that collapse on the water.",
      },
      {
        position: 2,
        title: "Make the first wrap directly behind the eye",
        instruction:
          "Grip the hackle tip with hackle pliers and make the first wrap directly against the thread wraps behind the hook eye. This first wrap should be the farthest forward. Pull the hackle perpendicular to the shank as you wrap, keeping firm, even tension. The barbs should flare outward in a starburst pattern around the shank.",
      },
      {
        position: 3,
        title: "Continue wrapping rearward in tight turns",
        instruction:
          "Make 3-5 additional wraps, each one sitting directly behind the previous turn. Each wrap should touch the prior wrap without overlapping. As you wind, gently stroke the barbs rearward with your free hand to prevent trapping them under the next turn. The hackle collar should build into a dense ring of fibers.",
      },
      {
        position: 4,
        title: "Wrap behind and in front of wings if present",
        instruction:
          "If your pattern has upright wings, make one or two wraps behind the wings and one or two wraps in front of the wings. This distributes hackle fibers evenly around the wing posts and helps stabilize the wings in an upright position. The wings should emerge from the center of the hackle collar.",
      },
      {
        position: 5,
        title: "Tie off the hackle",
        instruction:
          "After the final wrap, hold the hackle tip forward over the hook eye and secure it with 3-4 firm thread wraps directly on top of the hackle stem. Pull the hackle barbs rearward with your off hand to keep them clear while you make the tie-off wraps. Trim the hackle tip close to the wraps.",
      },
      {
        position: 6,
        title: "Clean up and finish the head",
        instruction:
          "Clear any stray hackle fibers from the hook eye area. Build a small, neat thread head in front of the hackle collar. Whip finish and apply head cement. When viewed from the front, the hackle should form a complete, even ring of fibers radiating outward from the shank.",
        tip: "For a flush-floating fly, trim a small V-shape from the bottom of the hackle so the body sits directly on the water surface. This is the Thorax style variation popularized by Vince Marinaro.",
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
    steps: [
      {
        position: 1,
        title: "Build a sturdy wing post",
        instruction:
          "Tie in the post material (white calf tail, poly yarn, or a foam strip) at the wing position on the hook shank, roughly one-third back from the eye. Secure it with firm thread wraps, then post it upright by wrapping thread around the base in a clockwise direction, building a small thread dam. The post must be stiff and upright to support the hackle wraps.",
        tip: "White or hi-vis post materials make parachute flies much easier to see on the water. Use bright colors even on natural-looking patterns.",
      },
      {
        position: 2,
        title: "Prepare and position the hackle",
        instruction:
          "Select a hackle feather sized so the barbs are about 1.5 times the hook gap. Strip the base fibers and tie the feather in at the base of the post with the shiny side facing up. The stripped stem should be secured against the post with several horizontal thread wraps going around the base of the post.",
      },
      {
        position: 3,
        title: "Complete the body and thorax",
        instruction:
          "Before winding the parachute hackle, finish all other fly components — the tail, body, and thorax. The hackle is the last thing you wrap on a parachute pattern. Bring your thread to the base of the post, ready to secure the hackle after winding.",
      },
      {
        position: 4,
        title: "Wind the hackle around the post from top to bottom",
        instruction:
          "Grip the hackle tip with hackle pliers. Starting at the top of the post wraps, wind the hackle horizontally around the post. Work downward with each successive turn, making 4-6 wraps. Each turn should sit below the previous one, building a stack of hackle wraps that descend toward the hook shank. Keep firm, even tension throughout.",
        tip: "Winding top-to-bottom is easier because each wrap locks the previous one in place. Some tiers wind bottom-to-top, but this requires more skill to prevent unraveling.",
      },
      {
        position: 5,
        title: "Secure the hackle tip beneath the shank",
        instruction:
          "After the final wrap around the post, pull the hackle tip downward and rearward, tucking it under the hook shank. Secure it with 3-4 tight thread wraps against the underside of the shank directly below the post. Trim the excess hackle tip. These securing wraps should be neat and tight to prevent the hackle from unraveling.",
      },
      {
        position: 6,
        title: "Whip finish and inspect the hackle disc",
        instruction:
          "Build a small thread head in front of the post and whip finish. Apply head cement. Examine the fly from above — the hackle should form a flat, horizontal disc around the post, with barbs radiating outward in all directions. The fly should sit flat on a table with the hackle barbs splayed on the surface and the body hanging slightly below.",
        tip: "If the hackle disc tilts to one side, the post was not straight or the wraps were uneven. Practice keeping uniform tension on every wrap around the post.",
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
    steps: [
      {
        position: 1,
        title: "Cut, clean, and stack the elk hair",
        instruction:
          "Cut a bundle of elk hair from the patch, remove all underfur with a fine comb, and even the tips using a hair stacker. The cleaned bundle should be about the diameter of a wooden matchstick for a size 14-16 fly. Keep a firm grip on the aligned tips after stacking so they do not become disordered.",
      },
      {
        position: 2,
        title: "Measure the wing length",
        instruction:
          "Hold the stacked bundle along the top of the hook shank with the tips extending rearward over the body. The tips should reach just past the bend of the hook, roughly equal to the full shank length. Note where the tie-in point falls — this is where the butt ends will be secured. Transfer your grip without disturbing the alignment.",
        tip: "A wing that is too long catches air and spins the fly during casting. A wing that is too short reduces flotation. Shank length is the safe default.",
      },
      {
        position: 3,
        title: "Apply soft pinch wraps",
        instruction:
          "Hold the measured bundle on top of the shank at the tie-in point with your off hand. With the bobbin, bring the thread up and over the bundle in a soft, loose wrap. Pinch the hair between your thumb and forefinger to prevent it from spinning around the shank. Tighten the thread slowly by pulling straight down. Make 2-3 of these soft pinch wraps, progressively tightening each one.",
        tip: "The pinch-and-loop method is the single most important technique for preventing elk hair from spinning around the shank. Never release your pinch until the wraps are tight.",
      },
      {
        position: 4,
        title: "Lock down with firm wraps",
        instruction:
          "Once the wing is positioned correctly on top of the shank, make 4-5 very firm wraps directly on the tie-in point. These wraps should be tight enough to slightly flare the butt ends of the hair. The wing should now be firmly secured and should not rotate when you release your pinch.",
      },
      {
        position: 5,
        title: "Trim the butt ends",
        instruction:
          "Lift the butt ends of the elk hair upward and trim them at a 45-degree angle with sharp scissors. The angled cut creates a tapered transition rather than an abrupt step. The trimmed butts should blend smoothly into the hook shank, forming the foundation for the thread head.",
      },
      {
        position: 6,
        title: "Build the thread head over the butts",
        instruction:
          "Cover the trimmed butt ends with smooth, overlapping thread wraps to form a neat, tapered head. Start at the front of the wing tie-in point and work forward to just behind the hook eye. The finished head should taper smoothly from the wing to the eye with no bumps or exposed hair ends. Whip finish and apply head cement.",
        tip: "If the head is lumpy, you used too much hair or did not taper the butt cut enough. Reduce the bundle size on your next fly.",
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
    steps: [
      {
        position: 1,
        title: "Select matched wing materials",
        instruction:
          "Choose two matched hackle tips, hen feather tips, or matched slips from duck wing quills. The two pieces should be identical in size, shape, and curvature. If using quill slips, cut equal-width strips from a left and right wing feather so they curve symmetrically away from each other when paired.",
        tip: "Hold the two wing pieces together and look at them against the light. They should be mirror images of each other. Mismatched wings cause the fly to spin during casting.",
      },
      {
        position: 2,
        title: "Tie in the wings on top of the shank",
        instruction:
          "Position both wings together on top of the hook shank at the wing position, about one-third back from the eye. The tips should point upward and slightly forward. Use pinch wraps to secure them — bring the thread up and over the wings, pinching with your off hand, then slowly tighten. Make 5-6 firm wraps to lock the wings in place.",
      },
      {
        position: 3,
        title: "Post the wings upright",
        instruction:
          "Pull the wings into an upright position and build a small dam of thread wraps in front of the wing base. These forward wraps push the wings into a vertical stance. Then make several wraps behind the wing base to further brace them upright. The wings should now stand straight up from the shank without flopping forward or backward.",
      },
      {
        position: 4,
        title: "Separate the wings with figure-eight wraps",
        instruction:
          "Divide the wing bundle into two equal halves, one on each side of the shank. Pass the thread between the wings from front to back on one side, then from back to front on the other, creating a figure-eight pattern. Repeat this figure-eight 3-4 times, pulling each pass snug. This forces the wings apart into a V shape when viewed from the front.",
        tip: "Keep consistent tension during figure-eight wraps. If one side is tighter than the other, the wings will be asymmetric. Post each wing individually with a few wraps around its base for extra stability.",
      },
      {
        position: 5,
        title: "Set the wing angle",
        instruction:
          "The wings should be separated at roughly a 45-degree angle from each other when viewed from the front, forming a narrow V. Adjust the angle by adding more figure-eight wraps or posting wraps around the base of each individual wing. A tiny drop of head cement at the base of each wing adds long-term stability.",
      },
      {
        position: 6,
        title: "Trim excess and verify symmetry",
        instruction:
          "Trim any excess wing butt material extending rearward along the shank. Cover the trimmed butts with smooth thread wraps. View the fly from the front, top, and each side to verify the wings are symmetric, evenly posted, and at the correct angle. Adjust with additional thread wraps if needed before moving on to the hackle and body.",
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
    steps: [
      {
        position: 1,
        title: "Secure all material tag ends",
        instruction:
          "Before building the head, ensure all material butts and tag ends from hackle, wings, and other components are trimmed close and covered with thread wraps. The area behind the hook eye should be as smooth as possible. Any protruding stubs create bumps that show through the finished head.",
      },
      {
        position: 2,
        title: "Flatten your thread",
        instruction:
          "Counter-spin your bobbin to untwist and flatten the thread into a wide ribbon. Flat thread lays down in smooth, thin layers that build a more uniform head. Corded thread creates ridges and a lumpy appearance. Each wrap of flat thread covers more area and adds less diameter than corded thread.",
        tip: "If you are using pre-waxed thread, it may resist flattening. Slightly unwaxed thread or GSP thread flattens more readily.",
      },
      {
        position: 3,
        title: "Start wraps at the front and work rearward",
        instruction:
          "Begin your first head wraps just behind the hook eye, leaving a clear gap for the tippet to pass through the eye. Make smooth, slightly overlapping wraps working rearward toward the body or hackle collar. Continue until you reach the transition point where the body materials begin.",
      },
      {
        position: 4,
        title: "Build layers working forward again",
        instruction:
          "Now wrap forward again, laying a second layer of thread over the first. This builds the tapered shape of the head. The head should be widest where it meets the body or hackle collar and taper to its narrowest point right behind the hook eye. The taper is what gives the head its professional appearance.",
      },
      {
        position: 5,
        title: "Check proportions and symmetry",
        instruction:
          "Examine the head from above and from each side. The head should be a smooth, symmetrical oval that is proportional to the size of the fly. On small flies (size 16 and below), the head should be tiny — just 5-6 wraps. On larger flies, it can be more pronounced. Avoid making the head too bulky, which is the most common beginner mistake.",
        tip: "The ideal head length is approximately one-eighth to one-sixth of the total hook shank length. Any longer and it looks out of proportion.",
      },
      {
        position: 6,
        title: "Whip finish cleanly at the front",
        instruction:
          "Position your thread at the very front of the head, just behind the hook eye, and execute a whip finish. The whip finish wraps should nestle into the front taper of the head without adding bulk. Trim the thread close with sharp scissors. The finished head should be smooth and clean with no visible thread tag.",
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
    steps: [
      {
        position: 1,
        title: "Choose between head cement and UV resin",
        instruction:
          "Head cement (or Sally Hansen Hard as Nails) is thin, penetrates into thread wraps, and dries on its own in 30-60 seconds. UV resin is thicker, builds a glossy shell on the surface, and cures instantly with a UV light. Use thin head cement for delicate dry flies and most general finishing. Use UV resin when you want a thick, glossy, durable coating on nymph heads, streamer heads, or body coatings.",
        tip: "Many experienced tiers use both — a first coat of thin head cement to penetrate the wraps, followed by UV resin on top for a glossy shell.",
      },
      {
        position: 2,
        title: "Apply thin head cement with a bodkin",
        instruction:
          "Dip the tip of a bodkin needle or dubbing needle into the head cement bottle. Touch the loaded tip to the thread head, applying a small drop. The thin cement will wick into the thread wraps by capillary action, saturating and hardening them from within. Apply just enough to coat the head — excess cement runs into the hackle or the hook eye.",
      },
      {
        position: 3,
        title: "Clear the hook eye immediately",
        instruction:
          "After applying head cement, immediately check the hook eye. Even careful application can allow cement to flow into and block the eye. Insert a bodkin through the eye from the front to clear any obstruction before the cement dries. A hackle gauge or fine mono loop can also be used to ream the eye.",
        tip: "Run a piece of monofilament or fine wire through the hook eye as a preventive measure before applying cement. Remove it after the cement is touch-dry.",
      },
      {
        position: 4,
        title: "Apply UV resin if desired",
        instruction:
          "For UV resin application, squeeze a tiny drop onto a bodkin tip or directly onto the thread head. Use the bodkin to spread the resin evenly over the head surface, shaping it into a smooth, rounded profile. UV resin does not cure until exposed to UV light, so you have unlimited working time to get the shape perfect before curing.",
      },
      {
        position: 5,
        title: "Cure the UV resin",
        instruction:
          "Hold your UV torch 1-2 inches from the coated head and expose it for 10-15 seconds. Rotate the fly in the vise to cure all sides evenly. The resin should harden completely into a clear, rock-hard shell. If any spots remain tacky, give them an additional 10-second cure. Some resins benefit from a final wipe with an alcohol swab to remove surface tack.",
        tip: "Do not stare directly at the UV light. Position the light so you can see the fly from an angle. Inexpensive UV lights work fine — you do not need an expensive professional torch.",
      },
      {
        position: 6,
        title: "Final inspection",
        instruction:
          "Examine the finished head under good light. The cement or resin should form a smooth, glossy coating that covers all thread wraps without lumps, drips, or runs into the hackle or hook eye. The hook eye should be completely clear. If cement has dried in the eye, carefully ream it out with a bodkin before fishing the fly.",
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
    steps: [
      {
        position: 1,
        title: "Select the right hook and bead",
        instruction:
          "Choose a jig-style hook with a 60-degree offset eye, such as a Hanak 450 or Firehole 516 in sizes 12-18. Slide a slotted tungsten bead onto the hook with the small hole facing the hook point. The slot accommodates the offset jig bend. Tungsten is critical — brass beads are too light for effective euro nymphing.",
        tip: "Match your bead size to the hook: 2.0mm for size 18, 2.5mm for size 16, 3.0mm for size 14, 3.5mm for size 12. Heavier is almost always better for euro nymphs.",
      },
      {
        position: 2,
        title: "Build a thin thread underbody",
        instruction:
          "Start your thread behind the bead and wrap a smooth, thin underbody back to the hook bend. Use fine thread (8/0 or thinner). The underbody should create a slight taper — thinner at the rear and slightly thicker approaching the bead. A slim profile is essential for euro nymphs to cut through the water column quickly.",
      },
      {
        position: 3,
        title: "Create the body with minimal materials",
        instruction:
          "Build the body using a single material: thin flat tinsel, Ultrawire, stripped goose biot, or just tying thread. Wrap in touching turns from the bend to behind the bead. The body should be sleek and hydrodynamic with no bulk. Many effective Perdigon patterns use nothing more than thread and tinsel for the body.",
      },
      {
        position: 4,
        title: "Add a hot spot collar",
        instruction:
          "Tie in a short collar of fluorescent dubbing or thread directly behind the bead. Use hot orange, chartreuse, or fluorescent pink — colors that act as a trigger point for feeding fish. The hot spot should be only 2-3 wraps wide, forming a bright band between the body and the bead. This is a signature element of modern euro nymphs.",
        tip: "Fluorescent materials are visible in deeper water where natural colors wash out. Even a tiny hot spot can dramatically improve catch rates.",
      },
      {
        position: 5,
        title: "Coat the body with UV resin",
        instruction:
          "Apply a thin, even layer of UV resin over the entire body from behind the bead to the hook bend. Rotate the fly while applying so the resin distributes evenly. Cure with a UV light for 15-20 seconds. The resin creates a smooth, glassy shell that is extremely durable and allows the fly to sink through the water column with minimal resistance.",
      },
      {
        position: 6,
        title: "Whip finish behind the bead",
        instruction:
          "Build a tiny thread head between the hot spot and the bead. Whip finish cleanly and trim the thread. Apply a small drop of head cement to the whip finish to ensure it does not unravel during aggressive euro nymphing presentations where flies frequently contact rocks on the streambed.",
      },
      {
        position: 7,
        title: "Add optional tailing fibers",
        instruction:
          "For patterns that call for a tail, tie in 2-4 Coq de Leon fibers or short pheasant tail fibers at the hook bend before building the body. Keep the tail short — about half the shank length. Long tails increase air resistance during casting and add unnecessary drag in the water. Some of the most effective euro nymphs have no tail at all.",
        tip: "If you find the fly is not sinking fast enough, eliminate the tail entirely and use a heavier bead. Every fraction of a second matters in getting the fly into the strike zone.",
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
    steps: [
      {
        position: 1,
        title: "Select proper deer body hair",
        instruction:
          "Use hollow deer body hair, which spins and flares readily. Do not use deer tail or leg hair — these are solid and will not spin. The hair should be clean, straight, and about 1-2 inches long. Coastal blacktail deer hair is considered premium for spinning because of its fine texture and consistent hollow structure.",
        tip: "Test hair quality by compressing a small bundle between your fingers. Good spinning hair springs back and flares. Poor-quality hair stays compressed.",
      },
      {
        position: 2,
        title: "Cut and clean a bundle of hair",
        instruction:
          "Cut a pencil-diameter bundle of hair from the hide close to the skin. Remove all underfur and short fibers with a fine comb. The cleaned bundle should contain only the long, hollow guard hairs. Do not stack the hair in a stacker — you want the uneven tips to create a natural, tapered appearance when spun.",
      },
      {
        position: 3,
        title: "Position the hair bundle on the shank",
        instruction:
          "Lay the cleaned hair bundle across the top of the hook shank at the tie-in point. The bundle should be perpendicular to the shank. Hold it loosely in position with your off hand. Do not grip tightly — the hair needs to be able to spin freely around the shank when the thread tightens.",
      },
      {
        position: 4,
        title: "Make loose wraps and then pull tight to spin",
        instruction:
          "Bring the thread over the hair bundle with 2-3 loose wraps, making sure the thread is positioned in the middle of the bundle length. Then, in one smooth motion, pull the thread straight down with firm pressure. As the thread tightens, the hollow hair will flare outward and spin 360 degrees around the hook shank, creating a puff of radiating hair.",
        tip: "The key moment is the transition from loose to tight. Pulling too slowly lets the hair shift instead of spinning. A decisive, firm pull produces the best flare.",
      },
      {
        position: 5,
        title: "Pack the hair tightly",
        instruction:
          "Use a hair packing tool (a hollow tube that slides over the hook eye) to push the spun hair tightly rearward against the previously spun sections or the body. Pack firmly — the tighter you pack, the denser and more sculptable the finished head or body will be. Make 2-3 thread wraps in front of the packed hair to hold it in place.",
      },
      {
        position: 6,
        title: "Repeat with additional bundles",
        instruction:
          "Cut, clean, and spin another bundle of deer hair directly in front of the first. Pack it tightly against the previous section. Continue this process until the entire designated area of the hook shank is filled with spun and packed deer hair. Most Muddler Minnow heads require 4-6 bundles; bass bugs and mouse patterns may require 10 or more.",
      },
      {
        position: 7,
        title: "Whip finish and remove from the vise",
        instruction:
          "After the final bundle is spun and packed, whip finish the thread at the front of the hair. Apply a drop of head cement to the whip finish. Remove the fly from the vise for trimming. The fly will look like a wild, unruly ball of hair at this stage — this is normal.",
      },
      {
        position: 8,
        title: "Trim and sculpt to final shape",
        instruction:
          "Using sharp, straight scissors or a double-edged razor blade, carefully trim the spun deer hair to the desired shape. For a Muddler Minnow head, trim a rounded, bullet-shaped profile. For bass poppers, sculpt a flat face and rounded body. Work in small cuts, stepping back frequently to check the shape from all angles. You can always take more off, but you cannot put hair back.",
        tip: "A fresh razor blade produces the cleanest cuts. Trim the bottom flat first (parallel to the shank) to establish a baseline, then shape the sides and top. Rotate the fly frequently to maintain symmetry.",
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

    const existingSteps = await prisma.techniqueStep.count({ where: { techniqueId: technique.id } });
    if (existingSteps === 0 && tech.steps) {
      await prisma.techniqueStep.createMany({
        data: tech.steps.map((s) => ({ techniqueId: technique.id, ...s })),
      });
    }

    console.log(`  + ${tech.name} (${tech.videos.length} videos, ${tech.steps?.length ?? 0} steps)`);
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
