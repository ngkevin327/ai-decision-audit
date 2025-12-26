-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID,
    "requested_by_user_id" UUID,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'pending',
    "format" TEXT NOT NULL DEFAULT 'zip',
    "filters" JSONB NOT NULL,
    "artifact_key" TEXT,
    "manifest_hash" TEXT,
    "chain_hash" TEXT,
    "trace_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "download_expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_jobs_organization_id_status_created_at_idx" ON "export_jobs"("organization_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
