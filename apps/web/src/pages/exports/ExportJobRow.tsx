import { Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

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
    <tr className="border-b border-border transition-colors hover:bg-primary/5">
      <td className="px-4 py-3 font-mono text-xs">{job.export_id.slice(0, 8)}…</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 tabular-nums">{job.trace_count}</td>
      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
        {new Date(job.created_at).toLocaleString()}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
        {job.chain_hash ? `${job.chain_hash.slice(0, 12)}…` : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {canDownload ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={downloading}
            onClick={() => onDownload(job.export_id)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {downloading ? 'Preparing…' : 'Download'}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {job.error_message ?? 'Processing…'}
          </span>
        )}
      </td>
    </tr>
  );
}
