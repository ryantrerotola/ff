-- CreateEnum
CREATE TYPE "FlyCategory" AS ENUM ('dry', 'nymph', 'streamer', 'emerger', 'saltwater', 'other');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('freshwater', 'saltwater', 'both');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('hook', 'thread', 'tail', 'body', 'rib', 'thorax', 'wing', 'hackle', 'bead', 'weight', 'other');

-- CreateEnum
CREATE TYPE "SubstitutionType" AS ENUM ('equivalent', 'budget', 'aesthetic', 'availability');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('video', 'blog', 'pdf');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'flat');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('youtube', 'blog', 'pdf');

-- CreateEnum
CREATE TYPE "StagedStatus" AS ENUM ('discovered', 'scraped', 'extracted', 'normalized', 'approved', 'rejected', 'ingested');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'inappropriate', 'incorrect_info', 'copyright', 'harassment', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('pattern', 'comment', 'forum_post', 'forum_reply', 'message', 'news_comment');

-- CreateTable
CREATE TABLE "news_articles" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "author" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "news_article_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_votes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "news_article_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_patterns" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_ratings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pattern_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_images" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pattern_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_replies" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_submitted_patterns" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FlyCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "water_type" "WaterType" NOT NULL,
    "description" TEXT NOT NULL,
    "materials" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_submitted_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hatch_entries" (
    "id" UUID NOT NULL,
    "water_body" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "state" TEXT,
    "month" SMALLINT NOT NULL,
    "species" TEXT NOT NULL,
    "insect_name" TEXT NOT NULL,
    "insect_type" TEXT NOT NULL,
    "fly_pattern_id" UUID,
    "pattern_name" TEXT NOT NULL,
    "time_of_day" TEXT,
    "notes" TEXT,
    "submitted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hatch_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staged_sources" (
    "id" UUID NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "creator_name" TEXT,
    "platform" TEXT,
    "raw_content" TEXT,
    "pattern_query" TEXT NOT NULL,
    "status" "StagedStatus" NOT NULL DEFAULT 'discovered',
    "metadata" JSONB,
    "scraped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staged_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staged_extractions" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "pattern_name" TEXT NOT NULL,
    "normalized_slug" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "StagedStatus" NOT NULL DEFAULT 'extracted',
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "staged_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_materials" (
    "id" UUID NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "material_type" "MaterialType" NOT NULL,
    "aliases" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canonical_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fly_patterns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "FlyCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "water_type" "WaterType" NOT NULL,
    "description" TEXT NOT NULL,
    "origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fly_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fly_pattern_materials" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "custom_color" TEXT,
    "custom_size" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,

    CONSTRAINT "fly_pattern_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_substitutions" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "substitute_material_id" UUID NOT NULL,
    "substitution_type" "SubstitutionType" NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "material_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variations" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variation_overrides" (
    "id" UUID NOT NULL,
    "variation_id" UUID NOT NULL,
    "original_material_id" UUID NOT NULL,
    "replacement_material_id" UUID NOT NULL,

    CONSTRAINT "variation_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "creator_name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "quality_score" SMALLINT NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "retailer" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "commission_type" "CommissionType" NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tying_steps" (
    "id" UUID NOT NULL,
    "fly_pattern_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "image_url" TEXT,
    "tip" TEXT,

    CONSTRAINT "tying_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_materials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "quantity" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tying_challenges" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fly_pattern_id" UUID,
    "month" SMALLINT NOT NULL,
    "year" SMALLINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tying_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_entries" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_url_key" ON "news_articles"("url");

-- CreateIndex
CREATE INDEX "news_articles_published_at_idx" ON "news_articles"("published_at");

-- CreateIndex
CREATE INDEX "news_articles_scraped_at_idx" ON "news_articles"("scraped_at");

-- CreateIndex
CREATE INDEX "news_comments_news_article_id_idx" ON "news_comments"("news_article_id");

-- CreateIndex
CREATE INDEX "news_comments_user_id_idx" ON "news_comments"("user_id");

-- CreateIndex
CREATE INDEX "news_votes_news_article_id_idx" ON "news_votes"("news_article_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_votes_user_id_news_article_id_key" ON "news_votes"("user_id", "news_article_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "comments_fly_pattern_id_idx" ON "comments"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "likes_fly_pattern_id_idx" ON "likes"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_fly_pattern_id_key" ON "likes"("user_id", "fly_pattern_id");

-- CreateIndex
CREATE INDEX "saved_patterns_fly_pattern_id_idx" ON "saved_patterns"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "saved_patterns_user_id_idx" ON "saved_patterns"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_patterns_user_id_fly_pattern_id_key" ON "saved_patterns"("user_id", "fly_pattern_id");

-- CreateIndex
CREATE INDEX "pattern_ratings_fly_pattern_id_idx" ON "pattern_ratings"("fly_pattern_id");

-- CreateIndex
CREATE UNIQUE INDEX "pattern_ratings_user_id_fly_pattern_id_key" ON "pattern_ratings"("user_id", "fly_pattern_id");

-- CreateIndex
CREATE INDEX "pattern_images_fly_pattern_id_idx" ON "pattern_images"("fly_pattern_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_name_key" ON "forum_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_posts_user_id_idx" ON "forum_posts"("user_id");

-- CreateIndex
CREATE INDEX "forum_posts_category_id_idx" ON "forum_posts"("category_id");

-- CreateIndex
CREATE INDEX "forum_posts_created_at_idx" ON "forum_posts"("created_at");

-- CreateIndex
CREATE INDEX "forum_replies_post_id_idx" ON "forum_replies"("post_id");

-- CreateIndex
CREATE INDEX "forum_replies_user_id_idx" ON "forum_replies"("user_id");

-- CreateIndex
CREATE INDEX "direct_messages_sender_id_idx" ON "direct_messages"("sender_id");

-- CreateIndex
CREATE INDEX "direct_messages_receiver_id_idx" ON "direct_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "direct_messages_created_at_idx" ON "direct_messages"("created_at");

-- CreateIndex
CREATE INDEX "user_submitted_patterns_user_id_idx" ON "user_submitted_patterns"("user_id");

-- CreateIndex
CREATE INDEX "user_submitted_patterns_status_idx" ON "user_submitted_patterns"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "material_reviews_material_id_idx" ON "material_reviews"("material_id");

-- CreateIndex
CREATE INDEX "material_reviews_user_id_idx" ON "material_reviews"("user_id");

-- CreateIndex
CREATE INDEX "hatch_entries_water_body_idx" ON "hatch_entries"("water_body");

-- CreateIndex
CREATE INDEX "hatch_entries_region_idx" ON "hatch_entries"("region");

-- CreateIndex
CREATE INDEX "hatch_entries_month_idx" ON "hatch_entries"("month");

-- CreateIndex
CREATE INDEX "hatch_entries_species_idx" ON "hatch_entries"("species");

-- CreateIndex
CREATE UNIQUE INDEX "staged_sources_url_key" ON "staged_sources"("url");

-- CreateIndex
CREATE INDEX "staged_sources_status_idx" ON "staged_sources"("status");

-- CreateIndex
CREATE INDEX "staged_sources_pattern_query_idx" ON "staged_sources"("pattern_query");

-- CreateIndex
CREATE INDEX "staged_extractions_normalized_slug_idx" ON "staged_extractions"("normalized_slug");

-- CreateIndex
CREATE INDEX "staged_extractions_status_idx" ON "staged_extractions"("status");

-- CreateIndex
CREATE INDEX "staged_extractions_confidence_idx" ON "staged_extractions"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_materials_canonical_name_key" ON "canonical_materials"("canonical_name");

-- CreateIndex
CREATE INDEX "canonical_materials_material_type_idx" ON "canonical_materials"("material_type");

-- CreateIndex
CREATE UNIQUE INDEX "fly_patterns_name_key" ON "fly_patterns"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fly_patterns_slug_key" ON "fly_patterns"("slug");

-- CreateIndex
CREATE INDEX "fly_patterns_slug_idx" ON "fly_patterns"("slug");

-- CreateIndex
CREATE INDEX "fly_patterns_category_idx" ON "fly_patterns"("category");

-- CreateIndex
CREATE INDEX "fly_patterns_difficulty_idx" ON "fly_patterns"("difficulty");

-- CreateIndex
CREATE INDEX "fly_patterns_water_type_idx" ON "fly_patterns"("water_type");

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_type_key" ON "materials"("name", "type");

-- CreateIndex
CREATE INDEX "fly_pattern_materials_fly_pattern_id_idx" ON "fly_pattern_materials"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "fly_pattern_materials_material_id_idx" ON "fly_pattern_materials"("material_id");

-- CreateIndex
CREATE INDEX "variations_fly_pattern_id_idx" ON "variations"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "resources_fly_pattern_id_idx" ON "resources"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "affiliate_links_material_id_idx" ON "affiliate_links"("material_id");

-- CreateIndex
CREATE INDEX "feedback_fly_pattern_id_idx" ON "feedback"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_reporter_id_idx" ON "content_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "tying_steps_fly_pattern_id_idx" ON "tying_steps"("fly_pattern_id");

-- CreateIndex
CREATE INDEX "user_materials_user_id_idx" ON "user_materials"("user_id");

-- CreateIndex
CREATE INDEX "user_materials_material_id_idx" ON "user_materials"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_materials_user_id_material_id_key" ON "user_materials"("user_id", "material_id");

-- CreateIndex
CREATE INDEX "tying_challenges_active_idx" ON "tying_challenges"("active");

-- CreateIndex
CREATE UNIQUE INDEX "tying_challenges_month_year_key" ON "tying_challenges"("month", "year");

-- CreateIndex
CREATE INDEX "challenge_entries_challenge_id_idx" ON "challenge_entries"("challenge_id");

-- CreateIndex
CREATE INDEX "challenge_entries_user_id_idx" ON "challenge_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_entries_challenge_id_user_id_key" ON "challenge_entries"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "rate_limits_expires_at_idx" ON "rate_limits"("expires_at");

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_article_id_fkey" FOREIGN KEY ("news_article_id") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_votes" ADD CONSTRAINT "news_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_votes" ADD CONSTRAINT "news_votes_news_article_id_fkey" FOREIGN KEY ("news_article_id") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_patterns" ADD CONSTRAINT "saved_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_patterns" ADD CONSTRAINT "saved_patterns_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_ratings" ADD CONSTRAINT "pattern_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_ratings" ADD CONSTRAINT "pattern_ratings_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_images" ADD CONSTRAINT "pattern_images_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_images" ADD CONSTRAINT "pattern_images_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submitted_patterns" ADD CONSTRAINT "user_submitted_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reviews" ADD CONSTRAINT "material_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reviews" ADD CONSTRAINT "material_reviews_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hatch_entries" ADD CONSTRAINT "hatch_entries_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hatch_entries" ADD CONSTRAINT "hatch_entries_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_extractions" ADD CONSTRAINT "staged_extractions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "staged_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fly_pattern_materials" ADD CONSTRAINT "fly_pattern_materials_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fly_pattern_materials" ADD CONSTRAINT "fly_pattern_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_substitutions" ADD CONSTRAINT "material_substitutions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_substitutions" ADD CONSTRAINT "material_substitutions_substitute_material_id_fkey" FOREIGN KEY ("substitute_material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variations" ADD CONSTRAINT "variations_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_overrides" ADD CONSTRAINT "variation_overrides_variation_id_fkey" FOREIGN KEY ("variation_id") REFERENCES "variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_overrides" ADD CONSTRAINT "variation_overrides_original_material_id_fkey" FOREIGN KEY ("original_material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_overrides" ADD CONSTRAINT "variation_overrides_replacement_material_id_fkey" FOREIGN KEY ("replacement_material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tying_steps" ADD CONSTRAINT "tying_steps_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_materials" ADD CONSTRAINT "user_materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_materials" ADD CONSTRAINT "user_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tying_challenges" ADD CONSTRAINT "tying_challenges_fly_pattern_id_fkey" FOREIGN KEY ("fly_pattern_id") REFERENCES "fly_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "tying_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
