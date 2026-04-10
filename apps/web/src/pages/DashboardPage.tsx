import { Activity, ArrowRight, FileSearch, FolderKanban, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTraceSearch, useSelectedProject } from '../api/hooks';
import { EmptyState } from '../components/layout/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { StatCard } from '../components/layout/StatCard';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { LinkButton } from '../components/ui/link-button';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export function DashboardPage() {
  const { projectId } = useSelectedProject();
  const { data, isLoading, error } = useTraceSearch({
    project_id: projectId,
    limit: 8,
  });

  const traceCount = data?.traces.length ?? 0;
  const completedCount = data?.traces.filter((t) => t.status === 'completed').length ?? 0;

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description="Monitor ingest health, review recent AI executions, and jump into forensic investigation."
        actions={
          <LinkButton to="/traces" size="lg">
            Explore traces
            <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Traces loaded"
          value={isLoading ? '—' : traceCount}
          hint="Recent activity in this project"
          icon={FileSearch}
          trend={traceCount > 0 ? 'up' : undefined}
        />
        <StatCard
          label="Completed"
          value={isLoading ? '—' : completedCount}
          hint="Sealed and indexed traces"
          icon={Shield}
        />
        <StatCard
          label="Pipeline"
          value="Live"
          hint="Ingest → index → explore"
          icon={Activity}
          trend="up"
        />
      </div>

      <div className="surface-card overflow-hidden">
        <SectionHeader
          title="Recent traces"
          description="Latest ingested workflows"
          action={{ label: 'View all →', to: '/traces' }}
        />
        <div className="p-5">
          {!projectId && (
            <EmptyState
              icon={FolderKanban}
              title="Select a project"
              description="Choose a project in the header to load traces and start your forensic review."
            />
          )}
          {projectId && isLoading && <LoadingState label="Loading traces" />}
          {error && (
            <Alert variant="error" title="Failed to load traces">
              {error.message}
            </Alert>
          )}
          {projectId && !isLoading && data && data.traces.length === 0 && !error && (
            <EmptyState
              icon={FileSearch}
              title="No traces yet"
              description="Ingest your first copilot execution with the SDK or run pnpm seed:demo locally."
              action={
                <Button variant="outline" type="button">
                  Run pnpm seed:demo
                </Button>
              }
            />
          )}
          {data && data.traces.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.traces.map((trace) => (
                  <TableRow key={trace.trace_id} className="group">
                    <TableCell>
                      <Link
                        to={`/traces/${trace.trace_id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {trace.trace_id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{trace.workflow_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={trace.status} />
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {new Date(trace.started_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
