import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface WaterBodyDef {
  name: string;
  region: string;
  state: string;
  waterType: string;
  latitude?: number;
  longitude?: number;
  description: string;
}

const WATER_BODIES: WaterBodyDef[] = [
  // ─── Rocky Mountains ──────────────────────────────────────────────────────
  { name: "South Platte River", region: "Rocky Mountains", state: "CO", waterType: "tailwater", latitude: 39.22, longitude: -105.21, description: "Colorado's premier tailwater fishery below Cheesman Canyon. Known for technical fishing with tiny flies and selective trout." },
  { name: "Arkansas River", region: "Rocky Mountains", state: "CO", waterType: "river", latitude: 38.73, longitude: -106.04, description: "Colorado's longest river with diverse fishing from high mountain headwaters to the Brown's Canyon gold medal water." },
  { name: "Frying Pan River", region: "Rocky Mountains", state: "CO", waterType: "tailwater", latitude: 39.36, longitude: -106.82, description: "Famous tailwater below Ruedi Reservoir. Known for trophy trout and incredible midge hatches." },
  { name: "Colorado River", region: "Rocky Mountains", state: "CO", waterType: "river", latitude: 39.63, longitude: -106.52, description: "The upper Colorado through Glenwood Canyon offers excellent fishing for large rainbow and brown trout." },
  { name: "Madison River", region: "Rocky Mountains", state: "MT", waterType: "river", latitude: 45.56, longitude: -111.49, description: "One of Montana's most famous trout rivers. Fifty miles of blue-ribbon water with diverse hatches and large wild trout." },
  { name: "Yellowstone River", region: "Rocky Mountains", state: "MT", waterType: "river", latitude: 45.65, longitude: -110.39, description: "America's longest undammed river. Known for its Yellowstone cutthroat trout and spectacular salmonfly hatches." },
  { name: "Missouri River", region: "Rocky Mountains", state: "MT", waterType: "tailwater", latitude: 46.59, longitude: -111.92, description: "Montana's finest tailwater fishery below Holter Dam. Known for trophy rainbows and browns, and prolific hatches." },
  { name: "Big Horn River", region: "Rocky Mountains", state: "MT", waterType: "tailwater", latitude: 45.60, longitude: -107.94, description: "World-class tailwater with incredible trout populations. Known for large fish and consistent hatches year-round." },
  { name: "Henry's Fork", region: "Rocky Mountains", state: "ID", waterType: "spring_creek", latitude: 44.58, longitude: -111.38, description: "Idaho's legendary spring creek famous for its technical fishing, large selective trout, and prolific mayfly hatches." },
  { name: "Green River", region: "Rocky Mountains", state: "UT", waterType: "tailwater", latitude: 40.91, longitude: -109.42, description: "Utah's finest tailwater below Flaming Gorge Dam. Crystal-clear water with large trout and consistent year-round hatches." },
  { name: "San Juan River", region: "Rocky Mountains", state: "NM", waterType: "tailwater", latitude: 36.81, longitude: -107.68, description: "New Mexico's premier trout fishery. The Quality Waters section is famous for its dense population of large rainbow trout." },
  { name: "North Platte River", region: "Rocky Mountains", state: "WY", waterType: "river", latitude: 42.73, longitude: -106.32, description: "Wyoming's Grey Reef section is a world-class tailwater with trophy rainbow and brown trout." },
  { name: "Gunnison River", region: "Rocky Mountains", state: "CO", waterType: "river", latitude: 38.53, longitude: -107.17, description: "The Black Canyon of the Gunnison provides wilderness fishing for large brown and rainbow trout." },
  { name: "Rio Grande", region: "Rocky Mountains", state: "CO", waterType: "river", latitude: 37.68, longitude: -106.64, description: "Southern Colorado's underrated trout stream flowing through scenic mountain valleys." },
  { name: "Roaring Fork River", region: "Rocky Mountains", state: "CO", waterType: "river", latitude: 39.19, longitude: -107.00, description: "A tributary of the Colorado River known for excellent dry fly fishing and beautiful scenery." },

  // ─── Northeast ────────────────────────────────────────────────────────────
  { name: "Delaware River", region: "Northeast", state: "NY", waterType: "river", latitude: 41.75, longitude: -75.08, description: "The upper Delaware system is the finest wild trout fishery in the eastern United States. Known for prolific hatches and large wild brown trout." },
  { name: "Ausable River", region: "Northeast", state: "NY", waterType: "river", latitude: 44.34, longitude: -73.68, description: "The West Branch of the Ausable flows through the Adirondacks and offers some of the best wild brook trout and brown trout fishing in the East." },
  { name: "Battenkill River", region: "Northeast", state: "VT", waterType: "river", latitude: 43.14, longitude: -73.15, description: "Vermont's iconic trout stream, the birthplace of American fly fishing. Challenging fishing for wild brown and brook trout." },
  { name: "Au Sable River", region: "Northeast", state: "MI", waterType: "river", latitude: 44.67, longitude: -84.71, description: "Michigan's most famous trout stream. The Holy Water stretch is renowned for its evening Hex hatches." },
  { name: "Pere Marquette River", region: "Northeast", state: "MI", waterType: "river", latitude: 43.92, longitude: -85.96, description: "A beautiful Michigan river famous for its steelhead runs and resident brown trout population." },
  { name: "Penns Creek", region: "Northeast", state: "PA", waterType: "river", latitude: 40.87, longitude: -77.12, description: "Pennsylvania's premier limestone stream. Known for its Green Drake hatch and technical fishing." },
  { name: "Letort Spring Run", region: "Northeast", state: "PA", waterType: "spring_creek", latitude: 40.19, longitude: -77.19, description: "A legendary limestone spring creek that helped define modern nymph and terrestrial fishing." },
  { name: "Farmington River", region: "Northeast", state: "CT", waterType: "river", latitude: 41.86, longitude: -72.97, description: "Connecticut's best trout stream with excellent catch-and-release sections and diverse hatches." },

  // ─── Pacific Northwest ────────────────────────────────────────────────────
  { name: "Deschutes River", region: "Pacific Northwest", state: "OR", waterType: "river", latitude: 44.97, longitude: -121.26, description: "Oregon's premier trout and steelhead river. Known for its redsides (rainbow trout) and incredible stonefly hatches." },
  { name: "Yakima River", region: "Pacific Northwest", state: "WA", waterType: "river", latitude: 46.74, longitude: -120.47, description: "Washington's best blue-ribbon trout stream, flowing through the scenic Yakima Canyon." },
  { name: "McKenzie River", region: "Pacific Northwest", state: "OR", waterType: "river", latitude: 44.12, longitude: -122.35, description: "A beautiful Oregon river known for its native rainbow trout and the McKenzie drift boat tradition." },
  { name: "North Umpqua River", region: "Pacific Northwest", state: "OR", waterType: "river", latitude: 43.28, longitude: -122.72, description: "Oregon's legendary summer steelhead river, fished almost exclusively with flies on the Camp Water." },
  { name: "Skagit River", region: "Pacific Northwest", state: "WA", waterType: "river", latitude: 48.45, longitude: -121.75, description: "Washington's most productive steelhead river and birthplace of the Skagit casting technique." },
  { name: "Metolius River", region: "Pacific Northwest", state: "OR", waterType: "spring_creek", latitude: 44.55, longitude: -121.63, description: "A crystal-clear Oregon spring creek with challenging fishing for wild bull trout and rainbow trout." },

  // ─── Mid-South ────────────────────────────────────────────────────────────
  { name: "White River", region: "Mid-South", state: "AR", waterType: "tailwater", latitude: 36.42, longitude: -92.56, description: "Arkansas's world-famous tailwater below Bull Shoals Dam. Known for trophy brown and rainbow trout." },
  { name: "South Holston River", region: "Mid-South", state: "TN", waterType: "tailwater", latitude: 36.52, longitude: -82.10, description: "Tennessee's finest tailwater with incredible sulphur hatches and large wild brown trout." },
  { name: "Little Red River", region: "Mid-South", state: "AR", waterType: "tailwater", latitude: 35.55, longitude: -91.98, description: "Home of the former world-record brown trout. Excellent year-round tailwater fishing." },
  { name: "Clinch River", region: "Mid-South", state: "TN", waterType: "tailwater", latitude: 36.10, longitude: -84.08, description: "East Tennessee tailwater known for trophy brown trout and sulphur hatches." },

  // ─── Great Lakes ──────────────────────────────────────────────────────────
  { name: "Manistee River", region: "Great Lakes", state: "MI", waterType: "river", latitude: 44.38, longitude: -85.73, description: "Michigan's premier steelhead and salmon river with excellent year-round fishing opportunities." },
  { name: "Muskegon River", region: "Great Lakes", state: "MI", waterType: "river", latitude: 43.33, longitude: -85.97, description: "A large Michigan river famous for its steelhead, salmon, and resident brown trout." },
  { name: "Salmon River", region: "Great Lakes", state: "NY", waterType: "river", latitude: 43.56, longitude: -75.99, description: "New York's most famous steelhead and salmon river, drawing anglers from across the country." },

  // ─── Saltwater ────────────────────────────────────────────────────────────
  { name: "Florida Keys Flats", region: "Saltwater", state: "FL", waterType: "saltwater_flat", latitude: 24.66, longitude: -81.55, description: "The birthplace of saltwater fly fishing. Home to permit, bonefish, and tarpon on shallow turtle grass flats." },
  { name: "Outer Banks", region: "Saltwater", state: "NC", waterType: "ocean", latitude: 35.56, longitude: -75.47, description: "North Carolina's barrier islands offer excellent fly fishing for false albacore, striped bass, and redfish." },
  { name: "Louisiana Marsh", region: "Saltwater", state: "LA", waterType: "estuary", latitude: 29.30, longitude: -89.90, description: "Louisiana's vast coastal marshes provide world-class sight fishing for redfish on fly." },
  { name: "Montauk", region: "Saltwater", state: "NY", waterType: "ocean", latitude: 41.07, longitude: -71.86, description: "The tip of Long Island is a legendary destination for striped bass and false albacore on fly." },
  { name: "Biscayne Bay", region: "Saltwater", state: "FL", waterType: "saltwater_flat", latitude: 25.50, longitude: -80.22, description: "Miami's backyard bonefish and permit fishery with easy access and year-round opportunities." },
  { name: "Mosquito Lagoon", region: "Saltwater", state: "FL", waterType: "estuary", latitude: 28.85, longitude: -80.77, description: "Florida's Space Coast offers some of the best redfish sight fishing in the state." },
];

async function main() {
  console.log("Seeding water bodies...");

  let created = 0;
  let skipped = 0;

  for (const def of WATER_BODIES) {
    const slug = slugify(`${def.name} ${def.state}`);

    const existing = await prisma.waterBody.findUnique({
      where: { slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.waterBody.create({
      data: {
        name: def.name,
        slug,
        region: def.region,
        state: def.state,
        waterType: def.waterType,
        latitude: def.latitude ?? null,
        longitude: def.longitude ?? null,
        description: def.description,
      },
    });

    console.log(`  + ${def.name}, ${def.state} (${def.region})`);
    created++;
  }

  console.log(`\nDone: ${created} water bodies created, ${skipped} skipped.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
