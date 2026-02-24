-- AlterTable
ALTER TABLE "hatch_entries" ADD COLUMN IF NOT EXISTS "target_fish" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hatch_entries_target_fish_idx" ON "hatch_entries"("target_fish");
