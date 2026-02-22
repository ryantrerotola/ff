import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPatternBySlug,
  getAllPatternSlugs,
} from "@/services/pattern.service";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
  APP_NAME,
  APP_URL,
} from "@/lib/constants";
import { MaterialList } from "@/components/MaterialList";
import { VariationSection } from "@/components/VariationSection";
import { ResourceList } from "@/components/ResourceList";
import { FeedbackForm } from "@/components/FeedbackForm";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { PatternActions } from "@/components/PatternActions";
import { StarRating } from "@/components/StarRating";
import { CommentSection } from "@/components/CommentSection";
import { TyingSteps } from "@/components/TyingSteps";
import { JsonLd } from "@/components/JsonLd";
import { ReportButton } from "@/components/ReportButton";
import { SaveOfflineButton } from "@/components/SaveOfflineButton";
import { PrintButton } from "@/components/PrintButton";
import { SimilarPatterns } from "@/components/SimilarPatterns";
import { PhotoGallery } from "@/components/PhotoGallery";

interface PatternPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPatternSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Database not available at build time; pages will be generated on demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: PatternPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return { title: "Pattern Not Found" };
  }

  const title = `${pattern.name} Fly Pattern`;
  const description = `${pattern.name} fly pattern — ${pattern.description.slice(0, 150)}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description,
      url: `${APP_URL}/patterns/${pattern.slug}`,
      type: "article",
      siteName: APP_NAME,
    },
  };
}

const DIFFICULTY_BADGE_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export default async function PatternPage({ params }: PatternPageProps) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  const difficultyColor =
    DIFFICULTY_BADGE_COLORS[pattern.difficulty] ?? "bg-gray-100 text-gray-800";

  const hasAffiliateLinks = pattern.materials.some(
    (pm) =>
      pm.material.affiliateLinks.length > 0 ||
      pm.material.substitutionsFrom.some(
        (sub) => sub.substituteMaterial.affiliateLinks.length > 0
      )
  );

  return (
    <>
      <JsonLd pattern={pattern} />

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {pattern.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${difficultyColor}`}
            >
              {DIFFICULTY_LABELS[pattern.difficulty]}
            </span>
            <span className="inline-flex items-center rounded-md bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {CATEGORY_LABELS[pattern.category]}
            </span>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {WATER_TYPE_LABELS[pattern.waterType]}
            </span>
          </div>

          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            {pattern.description}
          </p>

          {pattern.origin && (
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium">Origin:</span> {pattern.origin}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <PatternActions flyPatternId={pattern.id} />
            <StarRating flyPatternId={pattern.id} />
            <SaveOfflineButton
              pattern={{
                id: pattern.id,
                slug: pattern.slug,
                name: pattern.name,
                category: pattern.category,
                difficulty: pattern.difficulty,
                waterType: pattern.waterType,
                description: pattern.description,
                origin: pattern.origin,
                materials: pattern.materials,
                variations: pattern.variations,
                resources: pattern.resources,
              }}
            />
            <PrintButton slug={pattern.slug} />
            <ReportButton targetType="pattern" targetId={pattern.id} />
          </div>
        </header>

        {/* Photo Gallery */}
        {pattern.images.length > 0 && (
          <div className="mb-10">
            <PhotoGallery flyPatternId={pattern.id} images={pattern.images} />
          </div>
        )}

        {/* Affiliate disclosure */}
        {hasAffiliateLinks && (
          <div className="mb-8">
            <AffiliateDisclosure />
          </div>
        )}

        {/* Materials */}
        <div className="mb-10">
          <MaterialList materials={pattern.materials} />
        </div>

        {/* Tying Instructions */}
        {pattern.tyingSteps.length > 0 && (
          <div className="mb-10">
            <TyingSteps steps={pattern.tyingSteps} />
          </div>
        )}

        {/* Variations */}
        <div className="mb-10">
          <VariationSection variations={pattern.variations} />
        </div>

        {/* Resources */}
        <div className="mb-10">
          <ResourceList resources={pattern.resources} />
        </div>

        {/* Comments */}
        <div className="mb-10">
          <CommentSection flyPatternId={pattern.id} />
        </div>

        {/* Feedback */}
        <div className="mb-10">
          <FeedbackForm flyPatternId={pattern.id} />
        </div>

        {/* Similar Patterns */}
        <div className="mb-10">
          <SimilarPatterns
            flyPatternId={pattern.id}
            category={pattern.category}
            difficulty={pattern.difficulty}
          />
        </div>
      </article>
    </>
  );
}
