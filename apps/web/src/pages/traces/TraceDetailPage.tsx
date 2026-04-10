import { useState } from 'react';
import { Download, Play } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTraceDetail } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageState } from '../../components/layout/PageState';
import { SectionTitle } from '../../components/layout/SectionTitle';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { Button } from '../../components/ui/button';
import { LinkButton } from '../../components/ui/link-button';
import { StatusBadge } from '../../components/ui/status-badge';
import { EventTimeline } from './EventTimeline';
import { ExportDialog } from './ExportDialog';

export function TraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [searchParams] = useSearchParams();
  const highlightEventId = searchParams.get('event_id') ?? undefined;
  const [exportOpen, setExportOpen] = useState(false);
  const { data, isLoading, error } = useTraceDetail(traceId);

  if (isLoading) {
    return (
      <PageState>
        <LoadingState label="Loading trace detail" />
      </PageState>
    );
  }
  if (error) {
    return (
      <PageState>
        <ErrorState message={error.message} />
      </PageState>
    );
  }
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
            <LinkButton to={`/traces/${data.trace_id}/replay`}>
              <Play className="h-4 w-4" aria-hidden />
              Replay
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <SectionTitle className="mb-4">Event timeline</SectionTitle>
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
