import type { Resource } from "@/lib/types";

interface ResourceListProps {
  resources: Resource[];
}

const TYPE_ICONS: Record<string, string> = {
  video: "Video",
  blog: "Article",
  pdf: "PDF",
};

function QualityStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i < score ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Extract a YouTube video ID from a URL.
 * Handles youtube.com/watch?v=ID and youtu.be/ID formats.
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      return parsed.searchParams.get("v");
    }

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id || null;
    }

    // youtube.com/embed/VIDEO_ID (already embed format)
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return parsed.pathname.replace("/embed/", "");
    }

    return null;
  } catch {
    return null;
  }
}

function isYouTubeResource(resource: Resource): boolean {
  return (
    resource.type === "video" &&
    (resource.url.includes("youtube.com") ||
      resource.url.includes("youtu.be"))
  );
}

function YouTubeEmbed({ resource }: { resource: Resource }) {
  const videoId = extractYouTubeVideoId(resource.url);

  if (!videoId) {
    // Fallback to link-style display if ID extraction fails
    return <ResourceLink resource={resource} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={resource.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {resource.title}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {resource.creatorName} &middot; {resource.platform}
          </p>
          <div className="mt-1">
            <QualityStars score={resource.qualityScore} />
          </div>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Open
        </a>
      </div>
    </div>
  );
}

function ResourceLink({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:shadow-gray-900/30"
    >
      <span className="inline-flex shrink-0 items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {TYPE_ICONS[resource.type] ?? resource.type}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">{resource.title}</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {resource.creatorName} &middot; {resource.platform}
        </p>
        <div className="mt-1">
          <QualityStars score={resource.qualityScore} />
        </div>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  );
}

export function ResourceList({ resources }: ResourceListProps) {
  if (resources.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Instructional Resources
      </h2>
      <div className="space-y-3">
        {resources.map((resource) =>
          isYouTubeResource(resource) ? (
            <YouTubeEmbed key={resource.id} resource={resource} />
          ) : (
            <ResourceLink key={resource.id} resource={resource} />
          ),
        )}
      </div>
    </section>
  );
}
