-- CreateEnum
CREATE TYPE "TechniqueCategory" AS ENUM ('fundamentals', 'thread_work', 'materials_prep', 'body_techniques', 'hackle_techniques', 'wing_techniques', 'head_finishing', 'specialty');

-- CreateEnum
CREATE TYPE "TechniqueDifficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateTable
CREATE TABLE "tying_techniques" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TechniqueCategory" NOT NULL,
    "difficulty" "TechniqueDifficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "key_points" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tying_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technique_videos" (
    "id" UUID NOT NULL,
    "technique_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'YouTube',
    "creator_name" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "duration" TEXT,
    "quality_score" SMALLINT NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technique_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tying_techniques_name_key" ON "tying_techniques"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tying_techniques_slug_key" ON "tying_techniques"("slug");

-- CreateIndex
CREATE INDEX "tying_techniques_category_idx" ON "tying_techniques"("category");

-- CreateIndex
CREATE INDEX "tying_techniques_difficulty_idx" ON "tying_techniques"("difficulty");

-- CreateIndex
CREATE INDEX "tying_techniques_slug_idx" ON "tying_techniques"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "technique_videos_url_key" ON "technique_videos"("url");

-- CreateIndex
CREATE INDEX "technique_videos_technique_id_idx" ON "technique_videos"("technique_id");

-- AddForeignKey
ALTER TABLE "technique_videos" ADD CONSTRAINT "technique_videos_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "tying_techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
