import { Badge } from '../../components/ui/badge';

export interface ExportJobItem {
  export_id: string;
  status: string;
  trace_count: number;
  created_at: string;
  completed_at: string | null;
  download_expires_at: string | null;
  manifest_hash: string | null;
  chain_hash: string | null;
  error_message: string | null;
}

interface ExportJobRowProps {
  job: ExportJobItem;
  onDownload: (exportId: string) => void;
  downloading: boolean;
}

export function ExportJobRow({ job, onDownload, downloading }: ExportJobRowProps) {
  const canDownload = job.status === 'completed';

  return (
    <tr className="border-b border-border hover:bg-muted/40">
      <td className="px-3 py-2 font-mono text-xs">{job.export_id.slice(0, 8)}…</td>
      <td className="px-3 py-2">
        <Badge>{job.status}</Badge>
      </td>
      <td className="px-3 py-2 text-sm">{job.trace_count}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {new Date(job.created_at).toLocaleString()}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
        {job.chain_hash ? `${job.chain_hash.slice(0, 12)}…` : '—'}
      </td>
      <td className="px-3 py-2 text-right">
        {canDownload ? (
          <button
            type="button"
            disabled={downloading}
            onClick={() => onDownload(job.export_id)}
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {downloading ? 'Preparing…' : 'Download'}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {job.error_message ?? 'Processing…'}
          </span>
        )}
      </td>
    </tr>
  );
}
