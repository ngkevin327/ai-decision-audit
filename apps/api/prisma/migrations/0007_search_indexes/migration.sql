-- tags GIN index already created in 0003_trace_domain; add remaining search indexes idempotently
CREATE INDEX IF NOT EXISTS "traces_workflow_name_idx" ON "traces" ("workflow_name");
CREATE INDEX IF NOT EXISTS "traces_actor_gin_idx" ON "traces" USING GIN ("actor");
