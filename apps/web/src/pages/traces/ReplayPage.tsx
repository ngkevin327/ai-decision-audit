import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useReplay } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { JsonViewer } from '../../components/JsonViewer';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { LoadingState } from '../../components/LoadingState';
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

  if (isLoading) return <LoadingState label="Loading replay timeline" />;
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;
  if (!data || data.steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No replay steps available for this trace.</p>
    );
  }

  const step = data.steps[index];

  return (
    <div className="page-container">
      <PageHeader
        title={`Replay · ${data.trace_id}`}
        description={`${data.workflow_name} — step ${index + 1} of ${data.steps.length}. Use j/k to navigate.`}
        actions={
          <Link
            to={`/traces/${data.trace_id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to detail
          </Link>
        }
      />

      <ReplayControls
        index={index}
        total={data.steps.length}
        onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setIndex((i) => Math.min(i + 1, data.steps.length - 1))}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-glow lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
              {step.type.replace(/_/g, ' ')}
            </span>
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
