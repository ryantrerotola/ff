// ─── Raw Scraped Data ───────────────────────────────────────────────────────

export interface RawYouTubeResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  transcript: string | null;
}

export interface RawBlogResult {
  url: string;
  title: string;
  siteName: string;
  author: string | null;
  content: string;
  materialsHtml: string | null;
}

// ─── LLM Extracted Data ────────────────────────────────────────────────────

export interface ExtractedMaterial {
  name: string;
  type: string;
  color: string | null;
  size: string | null;
  required: boolean;
  position: number;
}

export interface ExtractedVariation {
  name: string;
  description: string;
  materialChanges: {
    original: string;
    replacement: string;
  }[];
}

export interface ExtractedSubstitution {
  originalMaterial: string;
  substituteMaterial: string;
  substitutionType: string;
  notes: string;
}

export interface ExtractedPattern {
  patternName: string;
  alternateNames: string[];
  category: string;
  difficulty: string;
  waterType: string;
  description: string;
  origin: string | null;
  materials: ExtractedMaterial[];
  variations: ExtractedVariation[];
  substitutions: ExtractedSubstitution[];
}

// ─── Normalization Types ────────────────────────────────────────────────────

export interface NormalizedMaterial {
  canonicalName: string;
  type: string;
  aliases: string[];
  confidence: number;
}

export interface ConsensusEntry {
  field: string;
  value: string;
  sourceCount: number;
  totalSources: number;
  confidence: number;
}

export interface ConsensusMaterial {
  name: string;
  type: string;
  color: string | null;
  size: string | null;
  required: boolean;
  position: number;
  confidence: number;
  sourceCount: number;
}

export interface ConsensusPattern {
  patternName: string;
  slug: string;
  category: ConsensusEntry;
  difficulty: ConsensusEntry;
  waterType: ConsensusEntry;
  description: string;
  origin: string | null;
  materials: ConsensusMaterial[];
  variations: ExtractedVariation[];
  substitutions: ExtractedSubstitution[];
  overallConfidence: number;
  sourceCount: number;
}

// ─── Pipeline State ─────────────────────────────────────────────────────────

export interface PipelineStats {
  sources: {
    discovered: number;
    scraped: number;
    extracted: number;
  };
  extractions: {
    total: number;
    highConfidence: number;
    lowConfidence: number;
  };
  patterns: {
    normalized: number;
    approved: number;
    rejected: number;
    ingested: number;
  };
}

// ─── Site Configuration ─────────────────────────────────────────────────────

export interface BlogSiteConfig {
  name: string;
  baseUrl: string;
  searchUrlTemplate: string;
  selectors: {
    resultLinks: string;
    title: string;
    content: string;
    materials: string | null;
    author: string | null;
  };
  maxPages: number;
}
