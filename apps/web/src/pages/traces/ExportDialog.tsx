import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useApiContext } from '../../api/hooks';

interface ExportDialogProps {
  traceId: string;
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ traceId, open, onClose }: ExportDialogProps) {
  const { request } = useApiContext();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const createExport = useMutation({
    mutationFn: () =>
      request<{ export_id: string; status: string }>('/v1/exports', {
        method: 'POST',
        body: JSON.stringify({ filters: { trace_ids: [traceId] } }),
      }),
    onSuccess: (result) => {
      setMessage(`Export ${result.export_id.slice(0, 8)}… queued (${result.status}).`);
      queryClient.invalidateQueries({ queryKey: ['exports'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-labelledby="export-dialog-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
      >
        <h2 id="export-dialog-title" className="text-lg font-semibold">
          Export trace
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an auditor package for <span className="font-mono">{traceId}</span> including
          manifest, JSON Lines events, and permission snapshot.
        </p>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-accent"
          >
            Close
          </button>
          <button
            type="button"
            disabled={createExport.isPending}
            onClick={() => createExport.mutate()}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createExport.isPending ? 'Requesting…' : 'Request export'}
          </button>
        </div>
      </div>
    </div>
  );
}
