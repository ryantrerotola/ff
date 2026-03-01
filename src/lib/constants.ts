const DEFAULT_APP_URL = "http://localhost:3000";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "FlyArchive";

export function resolveAppUrl(
  appUrl: string | undefined,
  vercelUrl: string | undefined,
): string {
  const raw = appUrl?.trim() || vercelUrl?.trim();

  if (!raw) {
    return DEFAULT_APP_URL;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}

export const APP_URL = resolveAppUrl(
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL,
);

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

export const TECHNIQUE_CATEGORY_LABELS: Record<string, string> = {
  fundamentals: "Fundamentals",
  thread_work: "Thread Work",
  materials_prep: "Materials Prep",
  body_techniques: "Body Techniques",
  hackle_techniques: "Hackle Techniques",
  wing_techniques: "Wing Techniques",
  head_finishing: "Head & Finishing",
  specialty: "Specialty",
};

export const TECHNIQUE_DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
