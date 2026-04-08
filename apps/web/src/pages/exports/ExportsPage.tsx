import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileArchive, Plus } from 'lucide-react';
import { useState } from 'react';
import { useApiContext } from '../../api/hooks';
import { EmptyState } from '../../components/layout/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { Button } from '../../components/ui/button';
import { ExportJobRow, type ExportJobItem } from './ExportJobRow';

interface ExportListResponse {
  exports: ExportJobItem[];
}

interface DownloadResponse {
  download_url: string;
}

export function ExportsPage() {
  const { request } = useApiContext();
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['exports'],
    queryFn: () => request<ExportListResponse>('/v1/exports'),
    refetchInterval: (query) => {
      const exports = query.state.data?.exports ?? [];
      const pending = exports.some(
        (job) => job.status === 'pending' || job.status === 'processing',
      );
      return pending ? 3000 : false;
    },
  });

  const createExport = useMutation({
    mutationFn: () =>
      request<ExportJobItem>('/v1/exports', {
        method: 'POST',
        body: JSON.stringify({ filters: {} }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exports'] }),
  });

  const handleDownload = async (exportId: string) => {
    setDownloadingId(exportId);
    try {
      const result = await request<DownloadResponse>(
        `/v1/exports/${encodeURIComponent(exportId)}/download`,
      );
      window.open(result.download_url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <LoadingState label="Loading export jobs" />;
  if (error) return <ErrorState message={error.message} />;

  const jobs = data?.exports ?? [];

  return (
    <div className="page-container">
      <PageHeader
        title="Exports"
        description="Generate tamper-evident auditor packages with manifest signatures and hash-chain verification data."
        actions={
          <Button
            type="button"
            onClick={() => createExport.mutate()}
            disabled={createExport.isPending}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {createExport.isPending ? 'Requesting…' : 'New export'}
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={FileArchive}
          title="No export jobs yet"
          description="Request an export to package traces for compliance review. Jobs appear here with download links when ready."
          action={
            <Button
              type="button"
              onClick={() => createExport.mutate()}
              disabled={createExport.isPending}
            >
              Create first export
            </Button>
          }
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Traces</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Chain</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <ExportJobRow
                  key={job.export_id}
                  job={job}
                  onDownload={handleDownload}
                  downloading={downloadingId === job.export_id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
