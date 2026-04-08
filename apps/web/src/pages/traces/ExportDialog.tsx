import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileArchive, X } from 'lucide-react';
import { useState } from 'react';
import { useApiContext } from '../../api/hooks';
import { Button } from '../../components/ui/button';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="export-dialog-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileArchive className="h-5 w-5" aria-hidden />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="export-dialog-title" className="text-lg font-semibold">
          Export trace
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create an auditor package for <span className="font-mono text-foreground">{traceId}</span>{' '}
          including manifest, JSON Lines events, and permission snapshot.
        </p>
        {message && <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            disabled={createExport.isPending}
            onClick={() => createExport.mutate()}
          >
            {createExport.isPending ? 'Requesting…' : 'Request export'}
          </Button>
        </div>
      </div>
    </div>
  );
}
