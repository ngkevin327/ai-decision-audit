import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useApiContext } from '../../api/hooks';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Exports</h1>
          <p className="text-sm text-muted-foreground">
            Tamper-evident packages with manifest and chain hashes for auditors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createExport.mutate()}
          disabled={createExport.isPending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {createExport.isPending ? 'Requesting…' : 'New export'}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export jobs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Traces</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Chain</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    No export jobs yet. Request an export to generate an auditor package.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <ExportJobRow
                    key={job.export_id}
                    job={job}
                    onDownload={handleDownload}
                    downloading={downloadingId === job.export_id}
                  />
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
