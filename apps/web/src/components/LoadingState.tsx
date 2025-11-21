export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="animate-pulse space-y-3 rounded-lg border border-border bg-card p-6"
      role="status"
    >
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <p className="sr-only">{label}</p>
    </div>
  );
}
