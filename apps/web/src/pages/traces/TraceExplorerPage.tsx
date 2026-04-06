import { useEffect, useMemo, useState } from 'react';
import { FileSearch } from 'lucide-react';
import { useSelectedProject, useTraceSearch } from '../../api/hooks';
import type { TraceListItem, TraceSearchParams } from '../../api/traces';
import { EmptyState } from '../../components/layout/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
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
    <div className="page-container">
      <PageHeader
        title="Trace explorer"
        description="Search ingested AI executions by workflow, actor, model, or status. Open any trace for a full forensic timeline."
      />
      <TraceFilters value={filters} onChange={applyFilters} />
      {!projectId && (
        <EmptyState
          icon={FileSearch}
          title="Select a project"
          description="Use the project switcher in the header to scope trace search."
        />
      )}
      {projectId && (isLoading || isFetching) && !traces.length && (
        <LoadingState label="Searching traces" />
      )}
      {error && <ErrorState message={error.message} />}
      {traces.length > 0 && (
        <TraceTable traces={traces} hasMore={Boolean(data?.next_cursor)} onLoadMore={loadMore} />
      )}
      {projectId && !isLoading && !isFetching && traces.length === 0 && !error && (
        <EmptyState
          icon={FileSearch}
          title="No traces match"
          description="Try clearing filters or ingest a new trace with the SDK."
        />
      )}
    </div>
  );
}
