CREATE INDEX "traces_workflow_name_idx" ON "traces" ("workflow_name");
CREATE INDEX "traces_tags_gin_idx" ON "traces" USING GIN ("tags");
CREATE INDEX "traces_actor_gin_idx" ON "traces" USING GIN ("actor");
