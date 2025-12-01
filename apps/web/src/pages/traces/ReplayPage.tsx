import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useReplay } from '../../api/hooks';
import { JsonViewer } from '../../components/JsonViewer';
import { PermissionSnapshotPanel } from '../../components/PermissionSnapshotPanel';
import { Badge } from '../../components/ui/badge';
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

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading replay…</p>;
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;
  if (!data || data.steps.length === 0) {
    return <p className="text-sm text-muted-foreground">No replay steps available.</p>;
  }

  const step = data.steps[index];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Replay: {data.trace_id}</h1>
          <p className="text-sm text-muted-foreground">{data.workflow_name}</p>
        </div>
        <Link to={`/traces/${data.trace_id}`} className="text-sm text-primary hover:underline">
          Back to detail
        </Link>
      </div>

      <ReplayControls
        index={index}
        total={data.steps.length}
        onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setIndex((i) => Math.min(i + 1, data.steps.length - 1))}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Badge>{step.type}</Badge>
            <span className="font-mono text-xs">{step.event_id}</span>
            <span className="text-xs text-muted-foreground">
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
