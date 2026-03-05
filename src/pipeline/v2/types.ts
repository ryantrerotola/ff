// ─── V2 Pipeline Types ─────────────────────────────────────────────────────
// Extended types for the rebuilt pipeline with richer data and quality tracking.

// Re-export shared types from v1 that are still useful
export type {
  RawYouTubeResult,
  RawBlogResult,
  ExtractedSubstitution,
  ConsensusEntry,
  BlogSiteConfig,
} from "../types";

// ─── Variation Types ──────────────────────────────────────────────────────

/**
 * Variation categories describe the axis along which a pattern varies.
 * - color: Same materials, different color scheme (e.g., olive vs chartreuse Woolly Bugger)
 * - weight: Bead head, cone head, lead wraps, or unweighted (primarily nymph patterns)
 * - wing_style: Parachute vs upright wings (dry flies only)
 * - hackle: Soft hackle vs standard or no hackle (nymph and wet fly patterns)
 * - size: Different hook sizes targeting different species/conditions
 * - regional: Geographic adaptations (e.g., Western vs Eastern variations)
 * - material: Fundamentally different material choices (not just color swaps)
 */
export const VARIATION_CATEGORIES = [
  "color", "weight", "wing_style", "hackle", "size", "regional", "material",
] as const;

export type VariationCategory = (typeof VARIATION_CATEGORIES)[number];

export interface V2ExtractedVariation {
  name: string;
  description: string;
  category: VariationCategory;
  materialChanges: {
    original: string;
    replacement: string;
  }[];
}

export interface V2ConsensusVariation {
  name: string;
  description: string;
  category: VariationCategory;
  materialChanges: {
    original: string;
    replacement: string;
  }[];
  /** How many sources explicitly mention this variation */
  sourceCount: number;
  /** Whether this was detected from source disagreements vs explicitly mentioned */
  detectedFromDisagreement: boolean;
}

// ─── Discovery ─────────────────────────────────────────────────────────────

export interface DiscoveredSource {
  url: string;
  title: string;
  sourceType: "youtube" | "web";
  /** Brave search result description */
  snippet: string;
  /** Relevance score from discovery (0-100) */
  discoveryScore: number;
  /** Which query found this result */
  query: string;
}

// ─── Scraping ──────────────────────────────────────────────────────────────

export interface ScrapedSource {
  url: string;
  title: string;
  sourceType: "youtube" | "web";
  /** Main text content for extraction */
  content: string;
  /** Raw HTML of materials section if found */
  materialsHtml: string | null;
  /** Author/creator name */
  creator: string | null;
  /** Platform name (e.g. "YouTube", "charliesflybox.com") */
  platform: string;
  /** YouTube video ID if applicable */
  videoId: string | null;
  /** Whether this source had a full transcript (YouTube) */
  hasTranscript: boolean;
  /** Images found inline in the source content */
  inlineImages: InlineImage[];
  /** Flag if this source likely has thin/unreliable data */
  lowConfidence: boolean;
}

export interface InlineImage {
  url: string;
  alt: string;
  caption: string;
}

// ─── Extraction (Enhanced) ─────────────────────────────────────────────────

export interface V2ExtractedMaterial {
  name: string;
  type: string;
  color: string | null;
  size: string | null;
  required: boolean;
  position: number;
  /** Brand name if mentioned (e.g., "Tiemco", "Whiting Farms") */
  brand: string | null;
  /** Specific product number if mentioned (e.g., "TMC 100") */
  productCode: string | null;
}

export interface V2ExtractedStep {
  position: number;
  title: string;
  instruction: string;
  tip: string | null;
}

export interface V2ExtractedPattern {
  patternName: string;
  alternateNames: string[];
  category: string;
  difficulty: string;
  waterType: string;
  description: string;
  origin: string | null;
  materials: V2ExtractedMaterial[];
  variations: V2ExtractedVariation[];
  substitutions: import("../types").ExtractedSubstitution[];
  tyingSteps: V2ExtractedStep[];
}

// ─── Enrichment (Sonnet Pass) ──────────────────────────────────────────────

export interface EnrichmentResult {
  /** The enriched extraction (materials validated, steps improved) */
  enriched: V2ExtractedPattern;
  /** Quality flags from Sonnet review */
  qualityFlags: QualityFlag[];
  /** LLM-generated substitution suggestions */
  suggestedSubstitutions: import("../types").ExtractedSubstitution[];
  /** Completeness scores (0-1) */
  scores: {
    materials: number;
    steps: number;
    description: number;
    overall: number;
  };
}

export interface QualityFlag {
  severity: "error" | "warning" | "info";
  message: string;
  field: string;
}

// ─── Consensus (Enhanced) ──────────────────────────────────────────────────

export interface V2ConsensusMaterial {
  name: string;
  type: string;
  color: string | null;
  size: string | null;
  brand: string | null;
  productCode: string | null;
  required: boolean;
  /** Whether this appears in <50% of sources but ≥2 */
  optional: boolean;
  position: number;
  confidence: number;
  /** How many sources include this material */
  sourceCount: number;
  /** What % of sources include it */
  sourceAgreement: number;
}

export interface V2ConsensusPattern {
  patternName: string;
  slug: string;
  category: import("../types").ConsensusEntry;
  difficulty: import("../types").ConsensusEntry;
  waterType: import("../types").ConsensusEntry;
  description: string;
  origin: string | null;
  materials: V2ConsensusMaterial[];
  /** Variations detected from source disagreements + explicitly mentioned */
  variations: V2ConsensusVariation[];
  /** Source-mentioned + LLM-generated substitutions merged */
  substitutions: import("../types").ExtractedSubstitution[];
  /** Sonnet-merged/enhanced tying steps */
  tyingSteps: V2ExtractedStep[];
  overallConfidence: number;
  sourceCount: number;
}

// ─── Product Links ─────────────────────────────────────────────────────────

export interface ProductLink {
  materialName: string;
  retailer: "j_stockard" | "trident";
  productUrl: string;
  productName: string;
  price: string | null;
}

// ─── Image Pipeline ────────────────────────────────────────────────────────

export interface ValidatedImage {
  url: string;
  caption: string;
  source: string;
  relevanceScore: number;
  visionValidated: boolean;
}

// ─── Quality Gate ──────────────────────────────────────────────────────────

export type QualityGateResult = {
  decision: "pass" | "fail" | "review";
  reasons: string[];
  warnings: string[];
  scores: {
    materials: number;
    steps: number;
    photos: number;
    sources: number;
    overall: number;
  };
};

// ─── Pipeline Run State ────────────────────────────────────────────────────

export interface V2PipelineState {
  patternName: string;
  discovered: DiscoveredSource[];
  scraped: ScrapedSource[];
  extractions: V2ExtractedPattern[];
  enrichments: EnrichmentResult[];
  consensus: V2ConsensusPattern | null;
  productLinks: ProductLink[];
  images: ValidatedImage[];
  qualityGate: QualityGateResult | null;
}
