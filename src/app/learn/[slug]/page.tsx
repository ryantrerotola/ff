import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import {
  TECHNIQUE_CATEGORY_LABELS,
  TECHNIQUE_DIFFICULTY_LABELS,
  APP_NAME,
  APP_URL,
} from "@/lib/constants";

interface TechniquePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TechniquePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const technique = await withRetry(() =>
      prisma.tyingTechnique.findUnique({ where: { slug } }),
    );

    if (!technique) {
      return { title: "Technique Not Found" };
    }

    const title = `${technique.name} — Learn to Tie`;
    const description = technique.description.slice(0, 160);

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ${APP_NAME}`,
        description,
        url: `${APP_URL}/learn/${technique.slug}`,
        type: "article",
        siteName: APP_NAME,
      },
    };
  } catch {
    return { title: "Learn to Tie" };
  }
}

const DIFFICULTY_BADGE_COLORS: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * Extract a YouTube video ID from various URL formats.
 * Supports:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtu.be short links
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    // Standard youtube.com URLs
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      // /watch?v=ID
      const vParam = parsed.searchParams.get("v");
      if (vParam) return vParam;

      // /embed/ID or /shorts/ID
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (
        (segments[0] === "embed" || segments[0] === "shorts") &&
        segments[1]
      ) {
        return segments[1];
      }
    }
  } catch {
    // Invalid URL
  }
  return null;
}

function QualityStars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Quality: ${score}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < score
              ? "text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function TechniquePage({ params }: TechniquePageProps) {
  const { slug } = await params;

  let technique;
  try {
    technique = await withRetry(() =>
      prisma.tyingTechnique.findUnique({
        where: { slug },
        include: {
          videos: {
            orderBy: { qualityScore: "desc" },
          },
          steps: {
            orderBy: { position: "asc" },
          },
        },
      }),
    );
  } catch {
    notFound();
  }

  if (!technique) {
    notFound();
  }

  let relatedTechniques: Awaited<ReturnType<typeof prisma.tyingTechnique.findMany<{
    include: { _count: { select: { videos: true } } };
  }>>> = [];

  try {
    // Fetch related techniques (same category, excluding current)
    relatedTechniques = await withRetry(() => prisma.tyingTechnique.findMany({
      where: {
        category: technique.category,
        id: { not: technique.id },
      },
      include: {
        _count: { select: { videos: true } },
      },
      orderBy: { name: "asc" },
      take: 6,
    }));
  } catch {
    // Table query may fail if migration not applied
  }

  const difficultyColor =
    DIFFICULTY_BADGE_COLORS[technique.difficulty] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
        Back to Learn
      </Link>

      <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {technique.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${difficultyColor}`}
              >
                {TECHNIQUE_DIFFICULTY_LABELS[technique.difficulty]}
              </span>
              <span className="inline-flex items-center rounded-md bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {TECHNIQUE_CATEGORY_LABELS[technique.category]}
              </span>
            </div>

            <p className="mt-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {technique.description}
            </p>
          </header>

          {/* Key Points */}
          {technique.keyPoints.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Key Points
              </h2>
              <ul className="mt-4 space-y-3">
                {technique.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                      <svg
                        className="h-3 w-3 text-brand-600 dark:text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Step-by-Step Instructions */}
          {technique.steps.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step-by-Step Instructions
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {technique.steps.length} steps to master this technique.
              </p>

              <ol className="mt-6 space-y-6">
                {technique.steps.map((step) => (
                  <li key={step.id} className="relative flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {step.position}
                    </div>
                    <div className="flex-1 pb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {step.instruction}
                      </p>
                      {step.tip && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            <span className="font-semibold">Pro tip:</span>{" "}
                            {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Videos */}
          {technique.videos.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Video Tutorials
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {technique.videos.length} video
                {technique.videos.length !== 1 ? "s" : ""} curated for this
                technique.
              </p>

              <div className="mt-6 space-y-8">
                {technique.videos.map((video) => {
                  const youtubeId = extractYouTubeId(video.url);

                  return (
                    <div
                      key={video.id}
                      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {/* Embedded video */}
                      {youtubeId ? (
                        <div className="relative aspect-video w-full bg-black">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 h-full w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline"
                          >
                            Watch on {video.platform}
                          </a>
                        </div>
                      )}

                      {/* Video info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {video.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              by{" "}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {video.creatorName}
                              </span>
                              {video.duration && (
                                <>
                                  {" "}
                                  <span className="text-gray-400 dark:text-gray-500">
                                    &middot;
                                  </span>{" "}
                                  {video.duration}
                                </>
                              )}
                            </p>
                          </div>
                          <QualityStars score={video.qualityScore} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {technique.videos.length === 0 && (
            <section className="mt-10">
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No video tutorials yet for this technique. Check back soon!
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Related Techniques */}
        <aside className="mt-10 lg:mt-0">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Related Techniques
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              More in {TECHNIQUE_CATEGORY_LABELS[technique.category]}
            </p>

            {relatedTechniques.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {relatedTechniques.map((related) => {
                  const relBadge =
                    DIFFICULTY_BADGE_COLORS[related.difficulty] ??
                    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

                  return (
                    <li key={related.id}>
                      <Link
                        href={`/learn/${related.slug}`}
                        className="group block rounded-md p-2 -mx-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {related.name}
                          </span>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${relBadge}`}
                          >
                            {TECHNIQUE_DIFFICULTY_LABELS[related.difficulty]}
                          </span>
                        </div>
                        {related._count.videos > 0 && (
                          <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {related._count.videos} video
                            {related._count.videos !== 1 ? "s" : ""}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                No other techniques in this category yet.
              </p>
            )}

            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <Link
                href={`/learn?category=${technique.category}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all {TECHNIQUE_CATEGORY_LABELS[technique.category]} &rarr;
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
