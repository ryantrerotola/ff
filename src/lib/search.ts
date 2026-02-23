import { prisma } from "./prisma";

/**
 * Full-text search using PostgreSQL tsvector/tsquery.
 *
 * Falls back to ILIKE-based search if full-text indexes are not yet created.
 * Run `prisma/full-text-search.sql` against the database to enable ranked results.
 */

interface SearchResult {
  id: string;
  type: "pattern" | "forum_post" | "news";
  title: string;
  excerpt: string;
  slug?: string;
  rank: number;
}

export async function fullTextSearch(
  query: string,
  options: {
    types?: ("pattern" | "forum_post" | "news")[];
    limit?: number;
  } = {},
): Promise<SearchResult[]> {
  const { types = ["pattern", "forum_post", "news"], limit = 20 } = options;
  const results: SearchResult[] = [];

  // Sanitize the query for tsquery — replace special chars, create prefix-match terms
  const sanitized = query
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `${term}:*`)
    .join(" & ");

  if (!sanitized) return [];

  try {
    if (types.includes("pattern")) {
      const patterns = await prisma.$queryRawUnsafe<
        { id: string; name: string; description: string; slug: string; rank: number }[]
      >(
        `SELECT id, name, description, slug,
                ts_rank(search_vector, to_tsquery('english', $1)) as rank
         FROM fly_patterns
         WHERE search_vector @@ to_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT $2`,
        sanitized,
        limit,
      );

      for (const p of patterns) {
        results.push({
          id: p.id,
          type: "pattern",
          title: p.name,
          excerpt: p.description.slice(0, 200),
          slug: p.slug,
          rank: p.rank,
        });
      }
    }

    if (types.includes("forum_post")) {
      const posts = await prisma.$queryRawUnsafe<
        { id: string; title: string; content: string; rank: number }[]
      >(
        `SELECT id, title, content,
                ts_rank(search_vector, to_tsquery('english', $1)) as rank
         FROM forum_posts
         WHERE search_vector @@ to_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT $2`,
        sanitized,
        limit,
      );

      for (const p of posts) {
        results.push({
          id: p.id,
          type: "forum_post",
          title: p.title,
          excerpt: p.content.slice(0, 200),
          rank: p.rank,
        });
      }
    }

    if (types.includes("news")) {
      const articles = await prisma.$queryRawUnsafe<
        { id: string; title: string; summary: string; rank: number }[]
      >(
        `SELECT id, title, summary,
                ts_rank(search_vector, to_tsquery('english', $1)) as rank
         FROM news_articles
         WHERE search_vector @@ to_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT $2`,
        sanitized,
        limit,
      );

      for (const a of articles) {
        results.push({
          id: a.id,
          type: "news",
          title: a.title,
          excerpt: a.summary.slice(0, 200),
          rank: a.rank,
        });
      }
    }
  } catch {
    // Full-text indexes not available — fall back to ILIKE search
    return fallbackSearch(query, types, limit);
  }

  return results.sort((a, b) => b.rank - a.rank).slice(0, limit);
}

async function fallbackSearch(
  query: string,
  types: ("pattern" | "forum_post" | "news")[],
  limit: number,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (types.includes("pattern")) {
    const patterns = await prisma.flyPattern.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, description: true, slug: true },
      take: limit,
    });

    for (const p of patterns) {
      results.push({
        id: p.id,
        type: "pattern",
        title: p.name,
        excerpt: p.description.slice(0, 200),
        slug: p.slug,
        rank: 1,
      });
    }
  }

  if (types.includes("forum_post")) {
    const posts = await prisma.forumPost.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, content: true },
      take: limit,
    });

    for (const p of posts) {
      results.push({
        id: p.id,
        type: "forum_post",
        title: p.title,
        excerpt: p.content.slice(0, 200),
        rank: 1,
      });
    }
  }

  if (types.includes("news")) {
    const articles = await prisma.newsArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, summary: true },
      take: limit,
    });

    for (const a of articles) {
      results.push({
        id: a.id,
        type: "news",
        title: a.title,
        excerpt: a.summary.slice(0, 200),
        rank: 1,
      });
    }
  }

  return results.slice(0, limit);
}
