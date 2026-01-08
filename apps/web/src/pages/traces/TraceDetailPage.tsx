import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTraceDetail } from '../../api/hooks';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { Badge } from '../../components/ui/badge';
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-semibold">{data.trace_id}</h1>
          <p className="text-sm text-muted-foreground">{data.workflow_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{data.status}</Badge>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent"
          >
            Export
          </button>
          <Link
            to={`/traces/${data.trace_id}/replay`}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent"
          >
            Open replay
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Event timeline</h2>
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
