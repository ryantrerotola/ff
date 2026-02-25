import { PrismaClient, ResourceType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Resource definitions for the 50 extended fly patterns ──────────────────

interface ResourceDef {
  slug: string;
  video: {
    title: string;
    creatorName: string;
    platform: string;
    url: string;
    qualityScore: number;
  };
  blog: {
    title: string;
    creatorName: string;
    platform: string;
    url: string;
    qualityScore: number;
  };
}

const resourceDefs: ResourceDef[] = [
  // ─── Dry Flies ──────────────────────────────────────────────────────────────
  {
    slug: "stimulator",
    video: { title: "How to Tie a Stimulator — The Ultimate Attractor Dry Fly", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-stimulator", qualityScore: 5 },
    blog: { title: "Fishing the Stimulator: Stoneflies, Caddis, and Hoppers All in One", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-stimulator", qualityScore: 4 },
  },
  {
    slug: "comparadun",
    video: { title: "Tying the Comparadun — No-Hackle Mastery", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-comparadun", qualityScore: 5 },
    blog: { title: "The Comparadun: Al Caucci's Gift to Selective Trout Fishing", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-comparadun", qualityScore: 4 },
  },
  {
    slug: "humpy",
    video: { title: "Tying the Humpy — A Classic Western Attractor", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-humpy", qualityScore: 4 },
    blog: { title: "The Humpy: A High-Floating Dry Fly for Fast Water", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-humpy", qualityScore: 4 },
  },
  {
    slug: "light-cahill",
    video: { title: "How to Tie the Light Cahill — Traditional Dry Fly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-light-cahill", qualityScore: 5 },
    blog: { title: "The Light Cahill: A Timeless Catskill Classic", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-light-cahill", qualityScore: 4 },
  },
  {
    slug: "hendrickson",
    video: { title: "Tying the Hendrickson — Eastern Mayfly Essential", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-hendrickson", qualityScore: 5 },
    blog: { title: "Fishing the Hendrickson Hatch: Timing and Tactics", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-hendrickson", qualityScore: 5 },
  },
  {
    slug: "march-brown",
    video: { title: "How to Tie the March Brown — A Classic Wet and Dry Pattern", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-march-brown", qualityScore: 5 },
    blog: { title: "The March Brown: History of Fly Fishing's Oldest Pattern", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-march-brown", qualityScore: 4 },
  },
  {
    slug: "pale-morning-dun",
    video: { title: "Pale Morning Dun — Tying the Perfect PMD Imitation", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-pale-morning-dun", qualityScore: 5 },
    blog: { title: "The PMD Hatch: Everything You Need to Know", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-pale-morning-dun", qualityScore: 4 },
  },
  {
    slug: "trico-spinner",
    video: { title: "Tying a Trico Spinner — Tiny Flies, Big Results", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-trico-spinner", qualityScore: 5 },
    blog: { title: "Mastering the Trico Spinner Fall on Spring Creeks", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-trico-spinner", qualityScore: 4 },
  },
  {
    slug: "quill-gordon",
    video: { title: "How to Tie the Quill Gordon — Stripped Peacock Quill Body", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-quill-gordon", qualityScore: 5 },
    blog: { title: "The Quill Gordon: Theodore Gordon's Legendary Dry Fly", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-quill-gordon", qualityScore: 5 },
  },
  {
    slug: "x-caddis",
    video: { title: "Tying the X-Caddis — Craig Mathews' Caddis Emerger", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-x-caddis", qualityScore: 5 },
    blog: { title: "The X-Caddis: A Deadly Trailing Shuck Pattern", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-x-caddis", qualityScore: 4 },
  },

  // ─── Nymphs ─────────────────────────────────────────────────────────────────
  {
    slug: "hares-ear-flashback",
    video: { title: "Flashback Hare's Ear Nymph — Step by Step", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-hares-ear-flashback", qualityScore: 5 },
    blog: { title: "Why the Flashback Hare's Ear Outperforms the Original", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-hares-ear-flashback", qualityScore: 4 },
  },
  {
    slug: "perdigon",
    video: { title: "Tying the Perdigon Nymph — Euro Nymphing Essential", creatorName: "Lance Egan", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-perdigon", qualityScore: 5 },
    blog: { title: "Perdigon Nymphs: The Spanish Competition Fly That Changed Everything", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-perdigon", qualityScore: 5 },
  },
  {
    slug: "walts-worm",
    video: { title: "How to Tie Walt's Worm — Simplicity at Its Best", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-walts-worm", qualityScore: 4 },
    blog: { title: "Walt's Worm: The Unassuming Crane Fly Larva Imitation", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-walts-worm", qualityScore: 4 },
  },
  {
    slug: "pats-rubber-legs",
    video: { title: "Pat's Rubber Legs — The Ultimate Stonefly Nymph", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-pats-rubber-legs", qualityScore: 5 },
    blog: { title: "Pat's Rubber Legs: A Guide's Favorite Big Nymph", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-pats-rubber-legs", qualityScore: 4 },
  },
  {
    slug: "frenchie",
    video: { title: "Tying the Frenchie Nymph — A Modern Euro Classic", creatorName: "Lance Egan", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-frenchie", qualityScore: 5 },
    blog: { title: "The Frenchie: Lance Egan's Go-To Competition Nymph", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-frenchie", qualityScore: 5 },
  },
  {
    slug: "kaufmanns-stonefly",
    video: { title: "Kaufmann's Stonefly Nymph — Detailed Tying Tutorial", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-kaufmanns-stonefly", qualityScore: 5 },
    blog: { title: "Randall Kaufmann's Stonefly: The Western Nymph Standard", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-kaufmanns-stonefly", qualityScore: 4 },
  },
  {
    slug: "mop-fly",
    video: { title: "How to Tie the Mop Fly — Love It or Hate It", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-mop-fly", qualityScore: 4 },
    blog: { title: "The Mop Fly Controversy: Is It Really Fly Fishing?", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-mop-fly", qualityScore: 4 },
  },
  {
    slug: "lightning-bug",
    video: { title: "Tying the Lightning Bug — A Flashy Nymph That Produces", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-lightning-bug", qualityScore: 5 },
    blog: { title: "The Lightning Bug: A Versatile Flashback Nymph for All Seasons", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-lightning-bug", qualityScore: 4 },
  },
  {
    slug: "squirmy-wormy",
    video: { title: "How to Tie the Squirmy Wormy — The Fly They Love to Ban", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-squirmy-wormy", qualityScore: 4 },
    blog: { title: "Squirmy Wormy: A Controversial Fly That Flat-Out Catches Fish", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-squirmy-wormy", qualityScore: 3 },
  },
  {
    slug: "jig-cdc-pheasant-tail",
    video: { title: "Jig CDC Pheasant Tail — Modern Euro Nymphing Staple", creatorName: "Lance Egan", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-jig-cdc-pheasant-tail", qualityScore: 5 },
    blog: { title: "Why Jig Hooks Changed Pheasant Tail Nymphs Forever", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-jig-cdc-pheasant-tail", qualityScore: 4 },
  },

  // ─── Streamers ──────────────────────────────────────────────────────────────
  {
    slug: "zonker",
    video: { title: "Tying the Zonker — Rabbit Strip Streamer Mastery", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-zonker", qualityScore: 5 },
    blog: { title: "The Zonker: Dan Byford's Revolutionary Rabbit Strip Fly", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-zonker", qualityScore: 4 },
  },
  {
    slug: "sculpzilla",
    video: { title: "How to Tie the Sculpzilla — A Deadly Simple Sculpin Pattern", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-sculpzilla", qualityScore: 4 },
    blog: { title: "Sculpzilla: The Minimalist Sculpin That Slays Big Trout", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-sculpzilla", qualityScore: 4 },
  },
  {
    slug: "circus-peanut",
    video: { title: "Tying the Circus Peanut — Articulated Streamer Madness", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-circus-peanut", qualityScore: 5 },
    blog: { title: "Kelly Galloup's Circus Peanut: The Articulated Fly That Started a Movement", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-circus-peanut", qualityScore: 5 },
  },
  {
    slug: "slump-buster",
    video: { title: "How to Tie the Slump Buster — Pine Squirrel Streamer", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-slump-buster", qualityScore: 5 },
    blog: { title: "John Barr's Slump Buster: Breaking Out of a Fishing Slump", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-slump-buster", qualityScore: 5 },
  },
  {
    slug: "kreelex",
    video: { title: "Tying the Kreelex — The Flash Minnow That Catches Everything", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-kreelex", qualityScore: 4 },
    blog: { title: "The Kreelex: A Simple Flashy Streamer for All Species", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-kreelex", qualityScore: 3 },
  },
  {
    slug: "conehead-bunny-leech",
    video: { title: "Conehead Bunny Leech — A Deadly Rabbit Strip Streamer", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-conehead-bunny-leech", qualityScore: 5 },
    blog: { title: "Tying and Fishing the Conehead Bunny Leech for Trophy Trout", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-conehead-bunny-leech", qualityScore: 4 },
  },
  {
    slug: "bead-head-olive-woolly-bugger",
    video: { title: "Bead Head Olive Woolly Bugger — The Versatile Classic", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-bead-head-olive-woolly-bugger", qualityScore: 5 },
    blog: { title: "Why the Olive Woolly Bugger Deserves a Spot in Every Box", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-bead-head-olive-woolly-bugger", qualityScore: 4 },
  },
  {
    slug: "micro-bugger",
    video: { title: "Tying the Micro Bugger — Small Streamer, Big Results", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-micro-bugger", qualityScore: 4 },
    blog: { title: "The Micro Bugger: A Downsized Woolly Bugger for Pressured Fish", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-micro-bugger", qualityScore: 4 },
  },
  {
    slug: "sex-dungeon",
    video: { title: "How to Tie the Sex Dungeon — Kelly Galloup's Trophy Streamer", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-sex-dungeon", qualityScore: 5 },
    blog: { title: "The Sex Dungeon: An Articulated Streamer Built for Brown Trout", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-sex-dungeon", qualityScore: 5 },
  },
  {
    slug: "white-zonker",
    video: { title: "Tying the White Zonker — A Baitfish Imitator for All Waters", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-white-zonker", qualityScore: 4 },
    blog: { title: "White Zonker Variations for Lake and River Fishing", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-white-zonker", qualityScore: 4 },
  },

  // ─── Emergers ───────────────────────────────────────────────────────────────
  {
    slug: "rs2",
    video: { title: "How to Tie the RS2 — Rim Chung's Masterpiece", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-rs2", qualityScore: 5 },
    blog: { title: "The RS2: A Tiny Emerger That Fools the Smartest Trout", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-rs2", qualityScore: 5 },
  },
  {
    slug: "klinkhamer-special",
    video: { title: "Tying the Klinkhamer Special — Hans van Klinken's Emerger", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-klinkhamer-special", qualityScore: 5 },
    blog: { title: "The Klinkhamer Special: The European Emerger That Conquered the World", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-klinkhamer-special", qualityScore: 5 },
  },
  {
    slug: "cdc-biot-emerger",
    video: { title: "CDC Biot Emerger — A Delicate and Deadly Pattern", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-cdc-biot-emerger", qualityScore: 5 },
    blog: { title: "Tying and Fishing CDC Biot Emergers for Selective Risers", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-cdc-biot-emerger", qualityScore: 4 },
  },
  {
    slug: "sparkle-dun",
    video: { title: "How to Tie the Sparkle Dun — Craig Mathews' Emerger Classic", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-sparkle-dun", qualityScore: 5 },
    blog: { title: "The Sparkle Dun: A Z-lon Trailing Shuck That Triggers Strikes", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-sparkle-dun", qualityScore: 4 },
  },
  {
    slug: "barr-emerger-bwo",
    video: { title: "Tying Barr's BWO Emerger — Blue-Winged Olive Specialist", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-barr-emerger-bwo", qualityScore: 5 },
    blog: { title: "John Barr's BWO Emerger: The Pattern That Changed Emerger Fishing", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-barr-emerger-bwo", qualityScore: 5 },
  },
  {
    slug: "soft-hackle-partridge-orange",
    video: { title: "Partridge and Orange Soft Hackle — A Centuries-Old Killer", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-soft-hackle-partridge-orange", qualityScore: 5 },
    blog: { title: "Soft Hackle Flies: Why the Partridge and Orange Still Works After 500 Years", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-soft-hackle-partridge-orange", qualityScore: 5 },
  },
  {
    slug: "cdc-loop-wing-emerger",
    video: { title: "CDC Loop Wing Emerger — Tying a Deadly Surface Film Pattern", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-cdc-loop-wing-emerger", qualityScore: 5 },
    blog: { title: "CDC Loop Wing Emergers: Matching the Hatch in the Film", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-cdc-loop-wing-emerger", qualityScore: 4 },
  },
  {
    slug: "snowshoe-emerger",
    video: { title: "How to Tie a Snowshoe Emerger — Rabbit Foot Fiber Magic", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-snowshoe-emerger", qualityScore: 4 },
    blog: { title: "Snowshoe Rabbit Emergers: Buoyant Flies for Picky Fish", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-snowshoe-emerger", qualityScore: 4 },
  },
  {
    slug: "quigley-cripple",
    video: { title: "Tying the Quigley Cripple — Bob Quigley's Legendary Pattern", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-quigley-cripple", qualityScore: 5 },
    blog: { title: "The Quigley Cripple: Imitating the Vulnerable Mayfly", creatorName: "Charlie Craven", platform: "Charlie's Fly Box", url: "https://www.charliesflybox.com/example-quigley-cripple", qualityScore: 5 },
  },
  {
    slug: "iris-caddis",
    video: { title: "How to Tie the Iris Caddis — A Must-Have Caddis Emerger", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-iris-caddis", qualityScore: 5 },
    blog: { title: "The Iris Caddis: Craig Mathews' Answer to Caddis Emergers", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-iris-caddis", qualityScore: 4 },
  },

  // ─── Saltwater ──────────────────────────────────────────────────────────────
  {
    slug: "gotcha",
    video: { title: "Tying the Gotcha — The Bahamas Bonefish Staple", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-gotcha", qualityScore: 5 },
    blog: { title: "The Gotcha: A Simple Bonefish Fly That Never Fails", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-gotcha", qualityScore: 4 },
  },
  {
    slug: "bonefish-bitter",
    video: { title: "How to Tie the Bonefish Bitter — A Flats Favorite", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-bonefish-bitter", qualityScore: 5 },
    blog: { title: "Bonefish Bitter: A Proven Shrimp Pattern for Spooky Bones", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-bonefish-bitter", qualityScore: 4 },
  },
  {
    slug: "ep-baitfish",
    video: { title: "Tying the EP Baitfish — Enrico Puglisi's Synthetic Masterpiece", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-ep-baitfish", qualityScore: 5 },
    blog: { title: "EP Baitfish Patterns: Building Realistic Profiles with Synthetic Fibers", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-ep-baitfish", qualityScore: 4 },
  },
  {
    slug: "merkin-crab",
    video: { title: "How to Tie the Merkin Crab — The Permit Fly Legend", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-merkin-crab", qualityScore: 5 },
    blog: { title: "Del Brown's Merkin Crab: The Fly That Cracked the Permit Code", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-merkin-crab", qualityScore: 5 },
  },
  {
    slug: "surf-candy",
    video: { title: "Tying the Surf Candy — Bob Popovics' Epoxy Baitfish", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-surf-candy", qualityScore: 5 },
    blog: { title: "Surf Candy: The Epoxy Fly That Revolutionized Saltwater Tying", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-surf-candy", qualityScore: 4 },
  },
  {
    slug: "gurgler",
    video: { title: "How to Tie the Gurgler — Jack Gartside's Surface Fly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-gurgler", qualityScore: 5 },
    blog: { title: "The Gurgler: A Topwater Fly for Stripers, Snook, and More", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-gurgler", qualityScore: 4 },
  },
  {
    slug: "tarpon-toad",
    video: { title: "Tying the Tarpon Toad — A Big Game Topwater Fly", creatorName: "InTheRiffle", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-tarpon-toad", qualityScore: 4 },
    blog: { title: "The Tarpon Toad: A Gurgler-Style Fly for the Silver King", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-tarpon-toad", qualityScore: 4 },
  },
  {
    slug: "avalon-permit-fly",
    video: { title: "How to Tie the Avalon Permit Fly — Crab Imitation for Permit", creatorName: "Tightline Productions", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-avalon-permit-fly", qualityScore: 5 },
    blog: { title: "The Avalon Permit Fly: A Cuban Crab Pattern That Travels the World", creatorName: "Orvis", platform: "Orvis News", url: "https://news.orvis.com/example-avalon-permit-fly", qualityScore: 4 },
  },
  {
    slug: "seaducer",
    video: { title: "Tying the Seaducer — A Classic Saltwater Hackle Fly", creatorName: "Davie McPhail", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-seaducer", qualityScore: 4 },
    blog: { title: "The Seaducer: Chico Fernandez's All-Purpose Saltwater Fly", creatorName: "Hatch Magazine", platform: "Hatch Magazine", url: "https://www.hatchmag.com/example-seaducer", qualityScore: 4 },
  },
  {
    slug: "puglisi-spawning-shrimp",
    video: { title: "How to Tie Puglisi's Spawning Shrimp — EP Fiber Saltwater Fly", creatorName: "Tim Flagler", platform: "YouTube", url: "https://www.youtube.com/watch?v=example-puglisi-spawning-shrimp", qualityScore: 5 },
    blog: { title: "Puglisi Spawning Shrimp: A Realistic Shrimp Pattern for Bonefish and Permit", creatorName: "Fly Fisherman Magazine", platform: "Fly Fisherman", url: "https://www.flyfisherman.com/example-puglisi-spawning-shrimp", qualityScore: 4 },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding extended resources for 50 fly patterns...\n");

  let created = 0;
  let skipped = 0;

  for (const def of resourceDefs) {
    const pattern = await prisma.flyPattern.findUnique({
      where: { slug: def.slug },
    });

    if (!pattern) {
      console.warn(`  Pattern not found for slug "${def.slug}" — skipping.`);
      skipped += 2;
      continue;
    }

    // Video resource
    const existingVideo = await prisma.resource.findFirst({
      where: { flyPatternId: pattern.id, url: def.video.url },
    });
    if (!existingVideo) {
      await prisma.resource.create({
        data: {
          flyPatternId: pattern.id,
          type: ResourceType.video,
          title: def.video.title,
          creatorName: def.video.creatorName,
          platform: def.video.platform,
          url: def.video.url,
          qualityScore: def.video.qualityScore,
        },
      });
      created++;
    } else {
      skipped++;
    }

    // Blog resource
    const existingBlog = await prisma.resource.findFirst({
      where: { flyPatternId: pattern.id, url: def.blog.url },
    });
    if (!existingBlog) {
      await prisma.resource.create({
        data: {
          flyPatternId: pattern.id,
          type: ResourceType.blog,
          title: def.blog.title,
          creatorName: def.blog.creatorName,
          platform: def.blog.platform,
          url: def.blog.url,
          qualityScore: def.blog.qualityScore,
        },
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone! Created ${created} resources, skipped ${skipped} (already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
