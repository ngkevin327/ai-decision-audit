import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useReplay } from '../../api/hooks';
import { EmptyState } from '../../components/layout/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageState } from '../../components/layout/PageState';
import { JsonViewer } from '../../components/JsonViewer';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { LinkButton } from '../../components/ui/link-button';
import { StatusBadge } from '../../components/ui/status-badge';
import { ReplayControls } from './ReplayControls';

export function ReplayPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error } = useReplay(traceId);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const eventId = searchParams.get('event_id');
    if (!eventId || !data) return;
    const found = data.steps.findIndex((step) => step.event_id === eventId);
    if (found >= 0) setIndex(found);
  }, [data, searchParams]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!data) return;
      if (event.key === 'j') {
        event.preventDefault();
        setIndex((i) => Math.min(i + 1, data.steps.length - 1));
      }
      if (event.key === 'k') {
        event.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [data]);

  useEffect(() => {
    const step = data?.steps[index];
    if (!step) return;
    setSearchParams({ event_id: step.event_id }, { replace: true });
  }, [index, data, setSearchParams]);

  if (isLoading) {
    return (
      <PageState>
        <LoadingState label="Loading replay timeline" />
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

  if (!data || data.steps.length === 0) {
    return (
      <PageState>
        <EmptyState
          icon={Film}
          title="No replay steps"
          description="This trace has no replayable events yet. Ingest more events or open the trace detail view."
          action={
            traceId ? (
              <LinkButton to={`/traces/${traceId}`} variant="outline">
                Back to trace
              </LinkButton>
            ) : undefined
          }
        />
      </PageState>
    );
  }

  const step = data.steps[index];

  return (
    <div className="page-container">
      <PageHeader
        title={`Replay · ${data.trace_id}`}
        description={`${data.workflow_name} — step ${index + 1} of ${data.steps.length}. Use j/k to navigate.`}
        actions={
          <LinkButton to={`/traces/${data.trace_id}`} variant="ghost">
            ← Back to detail
          </LinkButton>
        }
      />

      <ReplayControls
        index={index}
        total={data.steps.length}
        onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setIndex((i) => Math.min(i + 1, data.steps.length - 1))}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="highlight-panel space-y-4 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={step.type} />
            <span className="font-mono text-xs text-foreground">{step.event_id}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {new Date(step.occurred_at).toLocaleString()}
            </span>
          </div>
          <JsonViewer value={step.payload} />
        </div>
        <PermissionSnapshotPanel snapshot={data.permission_snapshot} />
      </div>
    </div>
  );
}
