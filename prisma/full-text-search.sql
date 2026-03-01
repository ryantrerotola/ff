-- Full-text search indexes for FlyArchive
-- Run this after `prisma db push` to add PostgreSQL full-text search capabilities.
--
-- Usage: psql $DATABASE_URL -f prisma/full-text-search.sql

-- Pattern search: name + description with weighted ranking (name ranked higher)
ALTER TABLE fly_patterns ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_fly_patterns_search ON fly_patterns USING gin(search_vector);

-- Forum post search: title + content
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_forum_posts_search ON forum_posts USING gin(search_vector);

-- News article search: title + summary
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_news_articles_search ON news_articles USING gin(search_vector);
