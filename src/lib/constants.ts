export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "FlyPatternDB";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const APP_DESCRIPTION =
  "The structured database for fly fishing patterns. Browse fly tying recipes, materials, substitutes, and instructional resources.";

export const PATTERNS_PER_PAGE = 12;

export const CATEGORY_LABELS: Record<string, string> = {
  dry: "Dry Fly",
  nymph: "Nymph",
  streamer: "Streamer",
  emerger: "Emerger",
  saltwater: "Saltwater",
  other: "Other",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const WATER_TYPE_LABELS: Record<string, string> = {
  freshwater: "Freshwater",
  saltwater: "Saltwater",
  both: "Both",
};

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  hook: "Hook",
  thread: "Thread",
  tail: "Tail",
  body: "Body",
  rib: "Rib",
  thorax: "Thorax",
  wing: "Wing",
  hackle: "Hackle",
  bead: "Bead",
  weight: "Weight",
  other: "Other",
};

export const SUBSTITUTION_TYPE_LABELS: Record<string, string> = {
  equivalent: "Equivalent",
  budget: "Budget",
  aesthetic: "Aesthetic",
  availability: "Availability",
};
