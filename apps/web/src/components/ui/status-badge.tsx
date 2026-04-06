import { cn } from '../../lib/utils';

const statusStyles: Record<string, string> = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-600',
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyles[normalized] ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
          normalized === 'completed' && 'bg-emerald-500',
          normalized === 'in_progress' && 'bg-amber-500 animate-pulse',
          normalized === 'failed' && 'bg-red-500',
          normalized === 'cancelled' && 'bg-slate-400',
          !statusStyles[normalized] && 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
