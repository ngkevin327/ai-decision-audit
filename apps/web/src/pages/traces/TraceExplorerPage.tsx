import { useEffect, useMemo, useState } from 'react';
import { useSelectedProject, useTraceSearch } from '../../api/hooks';
import type { TraceListItem, TraceSearchParams } from '../../api/traces';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { TraceFilters } from './TraceFilters';
import { TraceTable } from './TraceTable';

export function TraceExplorerPage() {
  const { projectId } = useSelectedProject();
  const [filters, setFilters] = useState<TraceSearchParams>({ project_id: projectId, limit: 25 });
  const [cursor, setCursor] = useState<string | undefined>();
  const [extraTraces, setExtraTraces] = useState<TraceListItem[]>([]);

  const params = useMemo(
    () => ({ ...filters, project_id: projectId, cursor }),
    [filters, projectId, cursor],
  );

  const { data, isLoading, error, isFetching } = useTraceSearch(params);

  useEffect(() => {
    if (!cursor) {
      setExtraTraces([]);
    }
  }, [cursor, filters, projectId]);

  const traces = [...extraTraces, ...(data?.traces ?? [])];

  function applyFilters(next: TraceSearchParams) {
    setCursor(undefined);
    setExtraTraces([]);
    setFilters({ ...next, project_id: projectId, limit: 25 });
  }

  function loadMore() {
    if (!data?.next_cursor) return;
    setExtraTraces((prev) => [...prev, ...(data.traces ?? [])]);
    setCursor(data.next_cursor);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Trace explorer</h1>
        <p className="text-sm text-muted-foreground">
          Search and filter ingested traces for forensic review.
        </p>
      </div>
      <TraceFilters value={filters} onChange={applyFilters} />
      {!projectId && (
        <p className="text-sm text-muted-foreground">Select a project to search traces.</p>
      )}
      {(isLoading || isFetching) && !traces.length && <LoadingState label="Loading traces" />}
      {error && <ErrorState message={error.message} />}
      {traces.length > 0 && (
        <TraceTable traces={traces} hasMore={Boolean(data?.next_cursor)} onLoadMore={loadMore} />
      )}
      {projectId && !isLoading && traces.length === 0 && (
        <p className="text-sm text-muted-foreground">No traces match the current filters.</p>
      )}
    </div>
  );
}
