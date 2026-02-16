-- Load-test driven indexes for search, quota counting, and export job listing
CREATE INDEX "events_organization_id_created_at_idx" ON "events"("organization_id", "created_at");

CREATE INDEX "traces_org_project_status_started_at_idx" ON "traces"(
    "organization_id",
    "project_id",
    "status",
    "started_at" DESC
);
