import { Link } from 'react-router-dom';
import { useTraceSearch, useSelectedProject } from '../api/hooks';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Recent traces and ingest health for the selected project.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ingest quota</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground">Quota widget (Stage 10)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent traces</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data?.traces.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Loaded in this view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Explorer</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/traces" className="text-sm font-medium text-primary hover:underline">
              Open trace explorer →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent traces</CardTitle>
        </CardHeader>
        <CardContent>
          {!projectId && (
            <p className="text-sm text-muted-foreground">
              Select a project in the header to load traces.
            </p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading traces…</p>}
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          {data && data.traces.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No traces yet. Ingest your first envelope via the SDK.
            </p>
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
                  <TableRow key={trace.trace_id}>
                    <TableCell>
                      <Link
                        to={`/traces/${trace.trace_id}`}
                        className="font-mono text-xs text-primary"
                      >
                        {trace.trace_id}
                      </Link>
                    </TableCell>
                    <TableCell>{trace.workflow_name}</TableCell>
                    <TableCell>
                      <Badge>{trace.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(trace.started_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
