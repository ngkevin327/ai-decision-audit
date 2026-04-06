import { KeyboardEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TraceListItem } from '../../api/traces';
import { StatusBadge } from '../../components/ui/status-badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

interface TraceTableProps {
  traces: TraceListItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function TraceTable({ traces, onLoadMore, hasMore }: TraceTableProps) {
  const navigate = useNavigate();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  function openTrace(traceId: string) {
    navigate(`/traces/${traceId}`);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, index: number, traceId: string) {
    if (event.key === 'Enter') {
      openTrace(traceId);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(index + 1, traces.length - 1);
      setFocusedIndex(next);
      rowRefs.current[next]?.focus();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = Math.max(index - 1, 0);
      setFocusedIndex(prev);
      rowRefs.current[prev]?.focus();
    }
  }

  async function copyTraceId(traceId: string) {
    await navigator.clipboard.writeText(traceId);
  }

  return (
    <div className="surface-card space-y-4 overflow-hidden p-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trace ID</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {traces.map((trace, index) => (
            <TableRow
              key={trace.trace_id}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              tabIndex={0}
              className="cursor-pointer hover:bg-primary/5 focus:bg-primary/10 focus:outline focus:outline-2 focus:outline-primary"
              onClick={() => openTrace(trace.trace_id)}
              onKeyDown={(event) => onRowKeyDown(event, index, trace.trace_id)}
              onFocus={() => setFocusedIndex(index)}
              aria-selected={focusedIndex === index}
              role="row"
            >
              <TableCell className="font-mono text-xs">{trace.trace_id}</TableCell>
              <TableCell>{trace.workflow_name}</TableCell>
              <TableCell>
                <StatusBadge status={trace.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(trace.started_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    void copyTraceId(trace.trace_id);
                  }}
                >
                  Copy ID
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMore && onLoadMore && (
        <Button type="button" variant="outline" onClick={onLoadMore}>
          Load more
        </Button>
      )}
    </div>
  );
}
