CREATE TABLE "index_job_dlq" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "trace_id" UUID NOT NULL,
    "job_payload" JSONB NOT NULL,
    "error_message" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL,
    "failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "index_job_dlq_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "index_job_dlq_organization_id_failed_at_idx" ON "index_job_dlq"("organization_id", "failed_at");

ALTER TABLE "index_job_dlq" ADD CONSTRAINT "index_job_dlq_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
