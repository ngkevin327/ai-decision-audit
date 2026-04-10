import { Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { TableCell, TableRow } from '../../components/ui/table';

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
    <TableRow>
      <TableCell className="font-mono text-xs">{job.export_id.slice(0, 8)}…</TableCell>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="tabular-nums">{job.trace_count}</TableCell>
      <TableCell className="text-xs tabular-nums text-muted-foreground">
        {new Date(job.created_at).toLocaleString()}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {job.chain_hash ? `${job.chain_hash.slice(0, 12)}…` : '—'}
      </TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
}
