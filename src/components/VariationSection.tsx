import type { VariationWithOverrides } from "@/lib/types";

interface VariationSectionProps {
  variations: VariationWithOverrides[];
}

export function VariationSection({ variations }: VariationSectionProps) {
  if (variations.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Variations</h2>
      <div className="space-y-4">
        {variations.map((variation) => (
          <div
            key={variation.id}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {variation.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {variation.description}
            </p>

            {variation.overrides.length > 0 && (
              <div className="mt-3">
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Material Changes:
                </h4>
                <ul className="space-y-1">
                  {variation.overrides.map((override) => (
                    <li
                      key={override.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-gray-500 line-through">
                        {override.originalMaterial.name}
                      </span>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                      <span className="font-medium text-gray-800">
                        {override.replacementMaterial.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
