-- CreateTable
CREATE TABLE "technique_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "technique_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "image_url" TEXT,
    "tip" TEXT,

    CONSTRAINT "technique_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_bodies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "water_type" TEXT NOT NULL DEFAULT 'river',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "technique_steps_technique_id_idx" ON "technique_steps"("technique_id");

-- CreateIndex
CREATE UNIQUE INDEX "water_bodies_slug_key" ON "water_bodies"("slug");

-- CreateIndex
CREATE INDEX "water_bodies_region_idx" ON "water_bodies"("region");

-- CreateIndex
CREATE INDEX "water_bodies_state_idx" ON "water_bodies"("state");

-- CreateIndex
CREATE INDEX "water_bodies_slug_idx" ON "water_bodies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "water_bodies_name_region_key" ON "water_bodies"("name", "region");

-- AddForeignKey
ALTER TABLE "technique_steps" ADD CONSTRAINT "technique_steps_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "tying_techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
