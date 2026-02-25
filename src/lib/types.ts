import type {
  FlyPattern,
  Material,
  FlyPatternMaterial,
  MaterialSubstitution,
  Variation,
  VariationOverride,
  Resource,
  AffiliateLink,
  Feedback,
  TyingStep,
  PatternImage,
  FlyCategory,
  Difficulty,
  WaterType,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  FlyPattern,
  Material,
  FlyPatternMaterial,
  MaterialSubstitution,
  Variation,
  VariationOverride,
  Resource,
  AffiliateLink,
  Feedback,
  TyingStep,
  PatternImage,
  FlyCategory,
  Difficulty,
  WaterType,
};

// ─── Composite types for API responses ──────────────────────────────────────

export interface MaterialWithSubstitutions extends Material {
  substitutionsFrom: (MaterialSubstitution & {
    substituteMaterial: Material & {
      affiliateLinks: AffiliateLink[];
    };
  })[];
  affiliateLinks: AffiliateLink[];
}

export interface FlyPatternMaterialWithDetails extends FlyPatternMaterial {
  material: MaterialWithSubstitutions;
}

export interface VariationWithOverrides extends Variation {
  overrides: (VariationOverride & {
    originalMaterial: Material;
    replacementMaterial: Material;
  })[];
}

export interface FlyPatternDetail extends FlyPattern {
  materials: FlyPatternMaterialWithDetails[];
  variations: VariationWithOverrides[];
  resources: Resource[];
  feedback: Feedback[];
  tyingSteps: TyingStep[];
  images: (PatternImage & { uploadedBy: { username: string } | null })[];
}

export interface FlyPatternListItem
  extends Pick<
    FlyPattern,
    | "id"
    | "name"
    | "slug"
    | "category"
    | "difficulty"
    | "waterType"
    | "description"
  > {
  _count: {
    materials: number;
    variations: number;
  };
  primaryImage?: { url: string; caption: string | null } | null;
}

// ─── API query params ───────────────────────────────────────────────────────

export interface PatternSearchParams {
  search?: string;
  category?: FlyCategory;
  difficulty?: Difficulty;
  waterType?: WaterType;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Feedback input ─────────────────────────────────────────────────────────

export interface FeedbackInput {
  flyPatternId: string;
  helpful: boolean;
  comment: string;
}
