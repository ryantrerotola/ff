import type { TyingStep } from "@/lib/types";

interface TyingStepsProps {
  steps: TyingStep[];
}

export function TyingSteps({ steps }: TyingStepsProps) {
  if (steps.length === 0) return null;

  return (
    <section className="print:break-before-auto">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Tying Instructions
      </h2>

      <ol className="space-y-6">
        {steps.map((step) => (
          <li
            key={step.id}
            className="relative rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Step number + title */}
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step.position}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>

                {/* Instruction text */}
                <p className="mt-2 leading-relaxed text-gray-700 dark:text-gray-300">
                  {step.instruction}
                </p>

                {/* Optional image */}
                {step.imageUrl && (
                  <div className="mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={step.imageUrl}
                      alt={`Step ${step.position}: ${step.title}`}
                      className="max-h-72 rounded-md border border-gray-200 object-cover dark:border-gray-600"
                    />
                  </div>
                )}

                {/* Optional tip callout */}
                {step.tip && (
                  <div className="mt-4 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                    <svg
                      className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Pro Tip
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                        {step.tip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
