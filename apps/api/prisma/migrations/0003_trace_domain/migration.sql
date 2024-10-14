-- CreateEnum
CREATE TYPE "TraceStatus" AS ENUM ('in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE "EventType" AS ENUM ('prompt', 'completion', 'tool_call', 'retrieval', 'approval', 'custom');

-- CreateTable
CREATE TABLE "traces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "environment_id" UUID,
    "external_trace_id" TEXT NOT NULL,
    "workflow_name" TEXT NOT NULL,
    "status" "TraceStatus" NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "chain_hash" TEXT,
    "chain_version" INTEGER NOT NULL DEFAULT 1,
    "actor" JSONB NOT NULL,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permission_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trace_id" UUID NOT NULL,
    "policy_version" TEXT NOT NULL,
    "roles" TEXT[],
    "scopes" TEXT[],
    "resource_ids" TEXT[],
    "denied_resources" TEXT[],
    "captured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trace_id" UUID NOT NULL,
    "external_span_id" TEXT NOT NULL,
    "parent_span_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "span_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "sequence_index" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "chain_hash" TEXT NOT NULL,
    "payload_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traces_organization_id_external_trace_id_key" ON "traces"("organization_id", "external_trace_id");
CREATE INDEX "traces_organization_id_project_id_started_at_idx" ON "traces"("organization_id", "project_id", "started_at");
CREATE INDEX "traces_tags_gin_idx" ON "traces" USING GIN ("tags");
CREATE UNIQUE INDEX "permission_snapshots_trace_id_key" ON "permission_snapshots"("trace_id");
CREATE UNIQUE INDEX "spans_trace_id_external_span_id_key" ON "spans"("trace_id", "external_span_id");
CREATE UNIQUE INDEX "events_organization_id_external_event_id_key" ON "events"("organization_id", "external_event_id");
CREATE INDEX "events_span_id_sequence_index_idx" ON "events"("span_id", "sequence_index");

-- AddForeignKey
ALTER TABLE "traces" ADD CONSTRAINT "traces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "traces" ADD CONSTRAINT "traces_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "traces" ADD CONSTRAINT "traces_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permission_snapshots" ADD CONSTRAINT "permission_snapshots_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spans" ADD CONSTRAINT "spans_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_span_id_fkey" FOREIGN KEY ("span_id") REFERENCES "spans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
