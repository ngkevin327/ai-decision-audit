import { cn } from '../../lib/utils';

const statusStyles: Record<string, string> = {
  completed:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  in_progress:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  pending:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  processing:
    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  failed:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300',
  cancelled:
    'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
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
          normalized === 'in_progress' && 'animate-pulse bg-amber-500',
          normalized === 'failed' && 'bg-red-500',
          normalized === 'cancelled' && 'bg-slate-400',
          normalized === 'pending' && 'bg-slate-400',
          normalized === 'processing' && 'animate-pulse bg-blue-500',
          !statusStyles[normalized] && 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
