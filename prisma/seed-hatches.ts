import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface HatchDef {
  waterBody: string;
  region: string;
  state: string;
  month: number;
  species: string;
  insectName: string;
  insectType: string;
  patternName: string;
  timeOfDay: string;
  notes?: string;
}

/**
 * Comprehensive hatch chart data for major US fly fishing waters.
 * Based on publicly available hatch charts from fly shops and guide services.
 */
const hatches: HatchDef[] = [
  // ─── South Platte River, CO ──────────────────────────────────────────────────
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 1, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Year-round staple. Size 18-24. Most active during warmest part of winter days." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 2, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Griffith's Gnat", timeOfDay: "midday", notes: "Midge clusters on surface during sunny winter days. Fish Griffith's Gnat or Zebra Midge." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "First major spring hatch. Size 18-22. Best on overcast, drizzly days." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Peak BWO activity. Nymphs and emergers very productive." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Massive caddis emergence mid-May. Size 14-16. One of the best hatches of the year." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs hatch morning through midday. Size 16-18." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfall at dawn. Size 20-24. Fish spinner patterns in slow water." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Woolly Bugger", timeOfDay: "afternoon", notes: "Terrestrial season. Hopper-dropper rigs are deadly." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 9, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO hatch returns. Often the best dry fly fishing of the year." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Peak fall BWO hatch continues through October." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 11, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Transition back to midge fishing as temperatures drop." },
  { waterBody: "South Platte River", region: "Rocky Mountains", state: "CO", month: 12, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Winter midge fishing. Size 20-24. Focus on slow, deep pools." },

  // ─── Arkansas River, CO ──────────────────────────────────────────────────────
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Early spring BWOs. Size 18-20." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Excellent caddis hatch through the canyon section." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "Salmonflies migrate upstream. Size 4-8. Fish large stonefly patterns tight to banks." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs overlap with stonefly activity. Size 16-18." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 7, species: "Isoperla", insectName: "Yellow Sally", insectType: "stonefly", patternName: "Prince Nymph", timeOfDay: "afternoon", notes: "Little yellow stoneflies. Size 14-16." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Bank-side hopper fishing. Terrestrials are key August through September." },
  { waterBody: "Arkansas River", region: "Rocky Mountains", state: "CO", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Fall BWO hatch. Excellent nymphing with PT Nymphs." },

  // ─── Frying Pan River, CO ────────────────────────────────────────────────────
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 1, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Legendary midge fishery. Size 20-26. Patient, precise presentations required." },
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Spring BWOs mix with midge activity. Size 18-22." },
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Good caddis hatch below Ruedi Reservoir. Size 14-16." },
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs bring selective fish to the surface." },
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 7, species: "Drunella grandis", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "morning", notes: "Green Drakes on the Frying Pan. Size 10-12. Sporadic but exciting." },
  { waterBody: "Frying Pan River", region: "Rocky Mountains", state: "CO", month: 9, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO season. Some of the best technical dry fly fishing in Colorado." },

  // ─── Colorado River, CO ──────────────────────────────────────────────────────
  { waterBody: "Colorado River", region: "Rocky Mountains", state: "CO", month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Pre-runoff BWOs. Size 18-20." },
  { waterBody: "Colorado River", region: "Rocky Mountains", state: "CO", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "Salmonfly hatch in the canyon section. Size 4-8." },
  { waterBody: "Colorado River", region: "Rocky Mountains", state: "CO", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs after runoff subsides." },
  { waterBody: "Colorado River", region: "Rocky Mountains", state: "CO", month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Early morning Trico spinnerfall. Size 20-24." },
  { waterBody: "Colorado River", region: "Rocky Mountains", state: "CO", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Excellent fall BWO fishing." },

  // ─── Madison River, MT ───────────────────────────────────────────────────────
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Early season BWOs. Best on cloudy days. Size 18-20." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Massive Mother's Day caddis hatch. One of Montana's premier hatches." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "Legendary salmonfly hatch moves upstream. Size 2-6. Fish close to banks with big patterns." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 6, species: "Perlidae", insectName: "Golden Stonefly", insectType: "stonefly", patternName: "Prince Nymph", timeOfDay: "all day", notes: "Golden stones follow salmonflies. Size 6-10." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs in the slower sections. Size 14-16." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 7, species: "Hydropsychidae", insectName: "Spotted Sedge Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Evening caddis activity. Size 14-16." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Prime hopper season. Bank-side fishing with foam hoppers and dropper nymphs." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 9, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Large orange October caddis. Size 8-10. Fish near dark." },
  { waterBody: "Madison River", region: "Rocky Mountains", state: "MT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs provide excellent dry fly action." },

  // ─── Yellowstone River, MT ───────────────────────────────────────────────────
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "World-famous salmonfly hatch. Follows the river upstream through June." },
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 6, species: "Perlidae", insectName: "Golden Stonefly", insectType: "stonefly", patternName: "Prince Nymph", timeOfDay: "all day", notes: "Golden stones emerge shortly after salmonflies." },
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs in the park section. Selective trout in slower water." },
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Outstanding hopper fishing along grassy banks." },
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfalls in slower sections. Size 20-24." },
  { waterBody: "Yellowstone River", region: "Rocky Mountains", state: "MT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO hatch. Brown trout become very active pre-spawn." },

  // ─── Missouri River, MT ──────────────────────────────────────────────────────
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 2, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Consistent midge fishing all winter below Holter Dam." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Spring BWOs start in April. Size 18-20." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Heavy caddis hatch. Size 14-16." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs are the premier hatch on the Mo. Size 14-16. Can be highly selective." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Dense Trico spinnerfalls. Extremely technical fishing. Size 20-24." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Hopper-dropper along banks. Also ants and beetles." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 9, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "October Caddis begin in late September. Size 8-10." },
  { waterBody: "Missouri River", region: "Rocky Mountains", state: "MT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Excellent fall BWO fishing continues into November." },

  // ─── Big Horn River, MT ──────────────────────────────────────────────────────
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 2, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Productive tailwater midge fishing year-round. Size 18-22." },
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Spring BWOs. Size 18-20." },
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Caddis hatch. Size 14-16." },
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs from June through July. Size 16-18." },
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfall. Size 20-24. Dawn fishing." },
  { waterBody: "Big Horn River", region: "Rocky Mountains", state: "MT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Fall BWOs trigger excellent nymphing and dry fly opportunities." },

  // ─── Henry's Fork, ID ────────────────────────────────────────────────────────
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Early season BWOs. Highly selective trout in the Ranch section." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 6, species: "Drunella grandis", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "morning", notes: "Famous Green Drake hatch. Size 10-12. One of the premier dry fly events in North America." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 6, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs overlap with Green Drakes. Size 16-18." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 7, species: "Callibaetis", insectName: "Callibaetis", insectType: "mayfly", patternName: "Adams", timeOfDay: "morning", notes: "Callibaetis on Harriman Ranch. Size 14-16. Speckled-wing spinners." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfalls. Extremely technical. Size 20-24." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Hopper fishing along grassy banks. Also flying ants in August." },
  { waterBody: "Henry's Fork", region: "Rocky Mountains", state: "ID", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Fall BWOs. Some of the year's best dry fly fishing." },

  // ─── Green River, UT ─────────────────────────────────────────────────────────
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 1, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Consistent winter midge fishing below Flaming Gorge Dam." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 4, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Spring BWOs. Size 18-20. Excellent dry fly opportunities." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 5, species: "Hydropsychidae", insectName: "Spotted Sedge Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Caddis emerge through summer. Size 14-16." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMD hatch in summer. Size 16-18." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 8, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfalls. Technical dry fly fishing." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 9, species: "Formicidae", insectName: "Flying Ants", insectType: "terrestrial", patternName: "Griffith's Gnat", timeOfDay: "afternoon", notes: "Flying ant falls in late summer. Fish go wild for them." },
  { waterBody: "Green River", region: "Rocky Mountains", state: "UT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Fall BWOs. Brown trout are active pre-spawn." },

  // ─── Delaware River, NY/PA ───────────────────────────────────────────────────
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Adams", timeOfDay: "afternoon", notes: "Classic eastern hatch. Size 12-14. April-May. Marks the start of dry fly season." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 5, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "evening", notes: "Sulphur hatch. Size 14-16. Evening spinner falls can be incredible." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 5, species: "Ephemera guttulata", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "evening", notes: "Eastern Green Drake. Size 8-10. The most anticipated hatch on the Delaware." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 6, species: "Isonychia", insectName: "Isonychia (Slate Drake)", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "evening", notes: "Slate Drakes emerge from fast water. Size 10-12. June through October." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Summer Trico spinnerfalls. Size 22-26. Dawn ritual." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 9, species: "Isonychia", insectName: "Isonychia (Slate Drake)", insectType: "mayfly", patternName: "Prince Nymph", timeOfDay: "evening", notes: "Fall Isonychia emergence. Size 10-12." },
  { waterBody: "Delaware River", region: "Northeast", state: "NY", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs. Overcast days are best." },

  // ─── Ausable River, NY ───────────────────────────────────────────────────────
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Adams", timeOfDay: "afternoon", notes: "Hendrickson hatch opens the season. Size 12-14." },
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 5, species: "Stenonema vicarium", insectName: "March Brown", insectType: "mayfly", patternName: "Gold Ribbed Hare's Ear", timeOfDay: "afternoon", notes: "March Browns in May. Size 10-12." },
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 6, species: "Ephemera guttulata", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "evening", notes: "Green Drake emergence. Size 8-10. Brief but intense." },
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 7, species: "Isonychia", insectName: "Isonychia (Slate Drake)", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "evening", notes: "Slate Drakes through summer and fall." },
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 8, species: "Hydropsychidae", insectName: "Caddis (various)", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Various caddis species throughout summer." },
  { waterBody: "Ausable River", region: "Northeast", state: "NY", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs. Best on overcast days." },

  // ─── Battenkill River, VT ────────────────────────────────────────────────────
  { waterBody: "Battenkill River", region: "Northeast", state: "VT", month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Adams", timeOfDay: "afternoon", notes: "Traditional Hendrickson hatch. Size 12-14." },
  { waterBody: "Battenkill River", region: "Northeast", state: "VT", month: 5, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "evening", notes: "Sulphur duns and spinners. Size 14-16." },
  { waterBody: "Battenkill River", region: "Northeast", state: "VT", month: 6, species: "Ephemera guttulata", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "evening", notes: "Green Drake hatch. Size 8-10. June evenings." },
  { waterBody: "Battenkill River", region: "Northeast", state: "VT", month: 7, species: "Hydropsychidae", insectName: "Caddis (various)", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Caddis hatches through summer." },
  { waterBody: "Battenkill River", region: "Northeast", state: "VT", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs on the storied Battenkill." },

  // ─── Deschutes River, OR ─────────────────────────────────────────────────────
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 3, species: "Rhithrogena", insectName: "March Brown", insectType: "mayfly", patternName: "Gold Ribbed Hare's Ear", timeOfDay: "afternoon", notes: "March Browns kick off the season. Size 12-14." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Huge caddis emergence. One of Oregon's best hatches." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "Salmonfly hatch moves upstream. Size 4-8. Big fish eat big flies." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 6, species: "Perlidae", insectName: "Golden Stonefly", insectType: "stonefly", patternName: "Prince Nymph", timeOfDay: "all day", notes: "Golden stones follow the salmonflies." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMDs in the lower river. Size 16-18." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 9, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Giant October caddis. Size 6-10. Swinging soft hackles is deadly." },
  { waterBody: "Deschutes River", region: "Pacific Northwest", state: "OR", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs." },

  // ─── Yakima River, WA ────────────────────────────────────────────────────────
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Spring BWOs. Size 18-20." },
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Prolific caddis hatch." },
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 6, species: "Pteronarcys californica", insectName: "Salmonfly", insectType: "stonefly", patternName: "Woolly Bugger", timeOfDay: "all day", notes: "Salmonflies in the canyon section." },
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 7, species: "Ephemerella", insectName: "Pale Morning Dun", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "morning", notes: "PMD hatches through July." },
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Prime hopper season." },
  { waterBody: "Yakima River", region: "Pacific Northwest", state: "WA", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs are reliable." },

  // ─── McKenzie River, OR ──────────────────────────────────────────────────────
  { waterBody: "McKenzie River", region: "Pacific Northwest", state: "OR", month: 3, species: "Rhithrogena", insectName: "March Brown", insectType: "mayfly", patternName: "Gold Ribbed Hare's Ear", timeOfDay: "afternoon", notes: "March Browns in early spring." },
  { waterBody: "McKenzie River", region: "Pacific Northwest", state: "OR", month: 5, species: "Brachycentrus", insectName: "Mother's Day Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "afternoon", notes: "Heavy caddis emergence." },
  { waterBody: "McKenzie River", region: "Pacific Northwest", state: "OR", month: 6, species: "Drunella grandis", insectName: "Green Drake", insectType: "mayfly", patternName: "Adams", timeOfDay: "morning", notes: "Western Green Drake. Size 10-12." },
  { waterBody: "McKenzie River", region: "Pacific Northwest", state: "OR", month: 9, species: "Dicosmoecus", insectName: "October Caddis", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "October Caddis. Size 6-10." },
  { waterBody: "McKenzie River", region: "Pacific Northwest", state: "OR", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs." },

  // ─── White River, AR ─────────────────────────────────────────────────────────
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 1, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Year-round midge fishing below Bull Shoals Dam. Size 18-22." },
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "BWOs in spring. Size 18-20." },
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 5, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "evening", notes: "Sulphur hatch. Size 14-16." },
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 7, species: "Hydropsychidae", insectName: "Caddis (various)", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Summer caddis activity." },
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 9, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWO hatch." },
  { waterBody: "White River", region: "Mid-South", state: "AR", month: 11, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Griffith's Gnat", timeOfDay: "midday", notes: "Winter midge patterns. Sowbugs and scuds also very effective." },

  // ─── South Holston River, TN ─────────────────────────────────────────────────
  { waterBody: "South Holston River", region: "Mid-South", state: "TN", month: 2, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "midday", notes: "Year-round midge fishing. Size 20-24." },
  { waterBody: "South Holston River", region: "Mid-South", state: "TN", month: 5, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "evening", notes: "World-class Sulphur hatch. Some of the best dry fly fishing in the Southeast." },
  { waterBody: "South Holston River", region: "Mid-South", state: "TN", month: 6, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "evening", notes: "Sulphur hatch continues through June. Very selective trout." },
  { waterBody: "South Holston River", region: "Mid-South", state: "TN", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs." },

  // ─── San Juan River, NM ──────────────────────────────────────────────────────
  { waterBody: "San Juan River", region: "Mid-South", state: "NM", month: 1, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Zebra Midge", timeOfDay: "all day", notes: "Legendary midge fishing. Size 22-28. Year-round below Navajo Dam." },
  { waterBody: "San Juan River", region: "Mid-South", state: "NM", month: 3, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "BWOs emerge spring and fall. Size 20-22." },
  { waterBody: "San Juan River", region: "Mid-South", state: "NM", month: 5, species: "Lumbriculidae", insectName: "San Juan Worm", insectType: "other", patternName: "San Juan Worm", timeOfDay: "all day", notes: "Aquatic worms are a major food source. The pattern was named after this river." },
  { waterBody: "San Juan River", region: "Mid-South", state: "NM", month: 7, species: "Chironomidae", insectName: "Midges", insectType: "midge", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Midge clusters on the surface. Size 20-26." },
  { waterBody: "San Juan River", region: "Mid-South", state: "NM", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Fall BWOs. Some of the best nymphing in the Southwest." },

  // ─── Au Sable River, MI ──────────────────────────────────────────────────────
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Adams", timeOfDay: "afternoon", notes: "The Hendrickson hatch that opens the season. Size 12-14." },
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 5, species: "Ephemerella dorothea", insectName: "Sulphur", insectType: "mayfly", patternName: "Parachute Adams", timeOfDay: "evening", notes: "Sulphur hatches bring up good fish." },
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 6, species: "Hexagenia limbata", insectName: "Hex Hatch", insectType: "mayfly", patternName: "Woolly Bugger", timeOfDay: "evening", notes: "The legendary Hex hatch. Size 4-8. Starts at dusk, continues after dark. The biggest dry fly fishing event in the Midwest." },
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 7, species: "Tricorythodes", insectName: "Trico", insectType: "mayfly", patternName: "Griffith's Gnat", timeOfDay: "morning", notes: "Trico spinnerfalls. Size 20-24." },
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 8, species: "Acrididae", insectName: "Grasshoppers", insectType: "terrestrial", patternName: "Royal Wulff", timeOfDay: "afternoon", notes: "Hopper and terrestrial fishing through summer." },
  { waterBody: "Au Sable River", region: "Great Lakes", state: "MI", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs. Excellent fishing for large browns." },

  // ─── Pere Marquette River, MI ────────────────────────────────────────────────
  { waterBody: "Pere Marquette River", region: "Great Lakes", state: "MI", month: 4, species: "Ephemerella subvaria", insectName: "Hendrickson", insectType: "mayfly", patternName: "Adams", timeOfDay: "afternoon", notes: "Hendrickson hatch starts the season." },
  { waterBody: "Pere Marquette River", region: "Great Lakes", state: "MI", month: 5, species: "Leptophlebia", insectName: "Black Quill", insectType: "mayfly", patternName: "Pheasant Tail Nymph", timeOfDay: "afternoon", notes: "Black Quill mayflies. Size 12-14." },
  { waterBody: "Pere Marquette River", region: "Great Lakes", state: "MI", month: 6, species: "Hexagenia limbata", insectName: "Hex Hatch", insectType: "mayfly", patternName: "Woolly Bugger", timeOfDay: "evening", notes: "Hex hatch. Large mouse and hex patterns after dark." },
  { waterBody: "Pere Marquette River", region: "Great Lakes", state: "MI", month: 7, species: "Hydropsychidae", insectName: "Caddis (various)", insectType: "caddis", patternName: "Elk Hair Caddis", timeOfDay: "evening", notes: "Summer caddis activity." },
  { waterBody: "Pere Marquette River", region: "Great Lakes", state: "MI", month: 10, species: "Baetis", insectName: "Blue-Winged Olive", insectType: "mayfly", patternName: "Blue-Winged Olive", timeOfDay: "afternoon", notes: "Fall BWOs coincide with salmon and steelhead runs." },

  // ─── Florida Keys Flats, FL ──────────────────────────────────────────────────
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 1, species: "Various baitfish", insectName: "Baitfish (various)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "Winter bonefish and permit on the flats. Clouser and Gotcha patterns." },
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 3, species: "Alpheus spp.", insectName: "Shrimp (various)", insectType: "other", patternName: "Crazy Charlie", timeOfDay: "morning", notes: "Peak bonefish season. Sight fishing on the flats." },
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 4, species: "Megalops atlanticus", insectName: "Tarpon migration", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Tarpon migration begins. Large streamer patterns. The Keys' most anticipated season." },
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 5, species: "Megalops atlanticus", insectName: "Tarpon (peak)", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Peak tarpon season. Fish 2/0-4/0 patterns in channels and on flats." },
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 7, species: "Trachinotus falcatus", insectName: "Permit (crab patterns)", insectType: "other", patternName: "Crazy Charlie", timeOfDay: "morning", notes: "Summer permit fishing. Crab and shrimp patterns on the flats." },
  { waterBody: "Florida Keys Flats", region: "Saltwater", state: "FL", month: 10, species: "Various baitfish", insectName: "Baitfish (fall run)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "all day", notes: "Fall baitfish migration. Excellent variety fishing for snook, redfish, and jacks." },

  // ─── Outer Banks, NC ─────────────────────────────────────────────────────────
  { waterBody: "Outer Banks", region: "Saltwater", state: "NC", month: 4, species: "Various baitfish", insectName: "Baitfish (spring)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "Spring striped bass and bluefish. Clouser Minnows in chartreuse/white." },
  { waterBody: "Outer Banks", region: "Saltwater", state: "NC", month: 5, species: "Brevoortia tyrannus", insectName: "Menhaden schools", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Menhaden runs bring bluefish, stripers, and false albacore." },
  { waterBody: "Outer Banks", region: "Saltwater", state: "NC", month: 9, species: "Euthynnus alletteratus", insectName: "False Albacore run", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "False albacore blitz. Sight-cast to busting fish. The most exciting fly fishing on the East Coast." },
  { waterBody: "Outer Banks", region: "Saltwater", state: "NC", month: 10, species: "Various baitfish", insectName: "Baitfish (fall)", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "all day", notes: "Fall run of stripers and bluefish chasing bait." },
  { waterBody: "Outer Banks", region: "Saltwater", state: "NC", month: 11, species: "Sciaenops ocellatus", insectName: "Redfish (fall)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "Late fall redfish on the sound side. Sight fishing for tailing reds." },

  // ─── Louisiana Marsh, LA ─────────────────────────────────────────────────────
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 1, species: "Sciaenops ocellatus", insectName: "Redfish (winter)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "midday", notes: "Winter redfish on warm days. Sight fishing in shallow marsh." },
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 3, species: "Sciaenops ocellatus", insectName: "Redfish (spring)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "morning", notes: "Spring redfish. Fish copper and gold Clouser patterns." },
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 5, species: "Sciaenops ocellatus", insectName: "Redfish (tailing)", insectType: "other", patternName: "Crazy Charlie", timeOfDay: "morning", notes: "Tailing redfish on grass flats. Crab and shrimp patterns." },
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 8, species: "Various baitfish", insectName: "Baitfish (summer)", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Summer bull redfish and jack crevalle on baitfish patterns." },
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 10, species: "Sciaenops ocellatus", insectName: "Redfish (fall)", insectType: "other", patternName: "Clouser Minnow", timeOfDay: "all day", notes: "Peak fall redfish season. Schools of bull reds on the outside. Best fishing of the year." },
  { waterBody: "Louisiana Marsh", region: "Saltwater", state: "LA", month: 11, species: "Sciaenops ocellatus", insectName: "Redfish (late fall)", insectType: "other", patternName: "Lefty's Deceiver", timeOfDay: "morning", notes: "Late fall sight fishing for redfish. Cooler water pushes fish shallow." },
];

async function main() {
  console.log("Seeding hatch chart data...");

  // Check if hatch entries already exist (from a previous seed run)
  const existingCount = await prisma.hatchEntry.count({
    where: { submittedById: null }, // only count seed data, not user-submitted
  });

  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing seed hatch entries — skipping to avoid duplicates.`);
    console.log("To re-seed, first delete existing entries with: DELETE FROM hatch_entries WHERE submitted_by_id IS NULL;");
    return;
  }

  // Insert all hatch entries
  await prisma.hatchEntry.createMany({
    data: hatches.map((h) => ({
      waterBody: h.waterBody,
      region: h.region,
      state: h.state,
      month: h.month,
      species: h.species,
      insectName: h.insectName,
      insectType: h.insectType,
      patternName: h.patternName,
      timeOfDay: h.timeOfDay,
      notes: h.notes ?? null,
    })),
  });

  console.log(`Seeded ${hatches.length} hatch entries across ${new Set(hatches.map(h => h.waterBody)).size} water bodies!`);

  // Print summary by region
  const regions = [...new Set(hatches.map(h => h.region))];
  for (const region of regions) {
    const waters = [...new Set(hatches.filter(h => h.region === region).map(h => h.waterBody))];
    console.log(`  ${region}: ${waters.join(", ")}`);
  }
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
