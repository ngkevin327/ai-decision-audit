import { useState } from 'react';
import { Download, Play } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTraceDetail } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { EventTimeline } from './EventTimeline';
import { ExportDialog } from './ExportDialog';

export function TraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [searchParams] = useSearchParams();
  const highlightEventId = searchParams.get('event_id') ?? undefined;
  const [exportOpen, setExportOpen] = useState(false);
  const { data, isLoading, error } = useTraceDetail(traceId);

  if (isLoading) return <LoadingState label="Loading trace detail" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="page-container">
      <PageHeader
        title={data.trace_id}
        description={data.workflow_name}
        actions={
          <>
            <StatusBadge status={data.status} />
            <Button type="button" variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            <Link
              to={`/traces/${data.trace_id}/replay`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Play className="h-4 w-4" aria-hidden />
              Replay
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Event timeline
          </h2>
          <EventTimeline events={data.events} highlightEventId={highlightEventId} />
        </div>
        <PermissionSnapshotPanel snapshot={data.permission_snapshot} />
      </div>

      <ExportDialog
        traceId={data.trace_id}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
