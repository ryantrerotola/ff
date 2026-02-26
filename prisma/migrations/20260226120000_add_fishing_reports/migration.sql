-- CreateTable
CREATE TABLE "fishing_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "water_body" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "conditions" TEXT,
    "source_urls" TEXT[],
    "source_titles" TEXT[],
    "report_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fishing_reports_water_body_region_key" ON "fishing_reports"("water_body", "region");

-- CreateIndex
CREATE INDEX "fishing_reports_region_idx" ON "fishing_reports"("region");

-- CreateIndex
CREATE INDEX "fishing_reports_state_idx" ON "fishing_reports"("state");

-- CreateIndex
CREATE INDEX "fishing_reports_report_date_idx" ON "fishing_reports"("report_date");
