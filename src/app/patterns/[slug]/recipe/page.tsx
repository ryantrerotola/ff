import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPatternBySlug } from "@/services/pattern.service";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  MATERIAL_TYPE_LABELS,
  APP_NAME,
  APP_URL,
} from "@/lib/constants";
import { RecipePrintButton } from "./RecipePrintButton";

export const dynamic = "force-dynamic";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return { title: "Recipe Not Found" };
  }

  return {
    title: `${pattern.name} — Recipe Card`,
    description: `Printable recipe card for the ${pattern.name} fly pattern.`,
  };
}

const DIFFICULTY_BADGE_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 print:border print:border-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 print:border print:border-yellow-300",
  advanced: "bg-red-100 text-red-800 print:border print:border-red-300",
};

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  const difficultyColor =
    DIFFICULTY_BADGE_COLORS[pattern.difficulty] ?? "bg-gray-100 text-gray-800";

  const patternUrl = `${APP_URL}/patterns/${pattern.slug}`;

  // Group materials by type for a cleaner layout
  const materialsByType = new Map<string, typeof pattern.materials>();
  for (const pm of pattern.materials) {
    const type = pm.material.type;
    if (!materialsByType.has(type)) {
      materialsByType.set(type, []);
    }
    materialsByType.get(type)!.push(pm);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
      {/* Print button - hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a
          href={`/patterns/${pattern.slug}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          &larr; Back to pattern
        </a>
        <RecipePrintButton />
      </div>

      {/* Recipe Card */}
      <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-4 print:shadow-none dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <header className="border-b border-gray-200 pb-4 print:border-gray-300 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 print:text-gray-500">
                {APP_NAME} Recipe Card
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 print:text-black dark:text-white">
                {pattern.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor}`}
              >
                {DIFFICULTY_LABELS[pattern.difficulty]}
              </span>
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 print:border print:border-brand-200">
                {CATEGORY_LABELS[pattern.category]}
              </span>
            </div>
          </div>

          {pattern.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600 print:text-gray-700 dark:text-gray-300">
              {pattern.description}
            </p>
          )}
        </header>

        {/* Materials Section */}
        <section className="mt-4">
          <h2 className="mb-3 text-lg font-bold text-gray-900 print:text-black dark:text-white">
            Materials
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 print:grid-cols-2">
            {pattern.materials
              .sort((a, b) => a.position - b.position)
              .map((pm) => {
                const typeLabel =
                  MATERIAL_TYPE_LABELS[pm.material.type] ?? pm.material.type;
                const details = [pm.customColor, pm.customSize]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={pm.id}
                    className="flex items-baseline gap-2 border-b border-dotted border-gray-200 py-1.5 text-sm print:border-gray-300 dark:border-gray-700"
                  >
                    <span className="shrink-0 text-xs font-semibold uppercase text-gray-400 print:text-gray-500">
                      {typeLabel}
                    </span>
                    <span className="font-medium text-gray-900 print:text-black dark:text-white">
                      {pm.material.name}
                    </span>
                    {details && (
                      <span className="text-xs text-gray-500 print:text-gray-600 dark:text-gray-400">
                        ({details})
                      </span>
                    )}
                    {!pm.required && (
                      <span className="text-xs italic text-gray-400">opt.</span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        {/* Tying Steps */}
        {pattern.tyingSteps.length > 0 && (
          <section className="mt-5 print:break-inside-avoid">
            <h2 className="mb-3 text-lg font-bold text-gray-900 print:text-black dark:text-white">
              Tying Steps
            </h2>
            <ol className="space-y-2">
              {pattern.tyingSteps
                .sort((a, b) => a.position - b.position)
                .map((step) => (
                  <li key={step.id} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 print:border print:border-gray-400 print:bg-transparent dark:bg-gray-700 dark:text-gray-300">
                      {step.position}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 print:text-black dark:text-white">
                        {step.title}:
                      </span>{" "}
                      <span className="text-gray-600 print:text-gray-700 dark:text-gray-300">
                        {step.instruction}
                      </span>
                      {step.tip && (
                        <span className="ml-1 text-xs italic text-amber-600 print:text-gray-500 dark:text-amber-400">
                          Tip: {step.tip}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        )}

        {/* Variations */}
        {pattern.variations.length > 0 && (
          <section className="mt-5 print:break-inside-avoid">
            <h2 className="mb-3 text-lg font-bold text-gray-900 print:text-black dark:text-white">
              Variations
            </h2>
            <div className="space-y-2">
              {pattern.variations.map((variation) => (
                <div key={variation.id} className="text-sm">
                  <span className="font-medium text-gray-900 print:text-black dark:text-white">
                    {variation.name}:
                  </span>{" "}
                  <span className="text-gray-600 print:text-gray-700 dark:text-gray-300">
                    {variation.description}
                  </span>
                  {variation.overrides.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      (
                      {variation.overrides
                        .map(
                          (o) =>
                            `${o.originalMaterial.name} → ${o.replacementMaterial.name}`,
                        )
                        .join("; ")}
                      )
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer with URL */}
        <footer className="mt-6 border-t border-gray-200 pt-4 print:border-gray-300 dark:border-gray-700">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 print:text-gray-500 dark:text-gray-500">
                Full pattern details and resources available at:
              </p>
              <p className="mt-0.5 text-xs font-medium text-brand-600 print:text-black dark:text-brand-400">
                {patternUrl}
              </p>
            </div>
            <p className="text-xs text-gray-300 print:text-gray-400 dark:text-gray-600">
              {APP_NAME}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
