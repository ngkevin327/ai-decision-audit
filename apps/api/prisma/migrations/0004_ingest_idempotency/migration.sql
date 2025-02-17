-- CreateTable
CREATE TABLE "ingest_idempotency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "trace_id" UUID NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingest_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingest_idempotency_organization_id_idempotency_key_key" ON "ingest_idempotency"("organization_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "ingest_idempotency" ADD CONSTRAINT "ingest_idempotency_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
