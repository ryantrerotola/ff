import { prisma } from "@/lib/prisma";
import { APP_NAME, APP_URL, APP_DESCRIPTION } from "@/lib/constants";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const patterns = await prisma.flyPattern.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      name: true,
      slug: true,
      description: true,
      category: true,
      difficulty: true,
      createdAt: true,
    },
  });

  const items = patterns
    .map(
      (pattern) => `    <item>
      <title>${escapeXml(pattern.name)}</title>
      <link>${APP_URL}/patterns/${escapeXml(pattern.slug)}</link>
      <description>${escapeXml(pattern.description)}</description>
      <category>${escapeXml(pattern.category)}</category>
      <pubDate>${pattern.createdAt.toUTCString()}</pubDate>
      <guid isPermaLink="true">${APP_URL}/patterns/${escapeXml(pattern.slug)}</guid>
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(APP_NAME)}</title>
    <link>${APP_URL}</link>
    <description>${escapeXml(APP_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
