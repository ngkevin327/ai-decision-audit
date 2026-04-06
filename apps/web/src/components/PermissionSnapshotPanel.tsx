import { Shield } from 'lucide-react';
import type { PermissionSnapshot } from '../api/traces';

interface PermissionSnapshotPanelProps {
  snapshot: PermissionSnapshot | null;
}

export function PermissionSnapshotPanel({ snapshot }: PermissionSnapshotPanelProps) {
  if (!snapshot) {
    return (
      <div className="surface-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">Permission snapshot</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No permission snapshot captured for this trace.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card border-l-4 border-l-primary p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Permission snapshot</h3>
          <p className="text-xs text-muted-foreground">Captured at ingest</p>
        </div>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Policy version</dt>
          <dd className="mt-0.5 font-mono text-xs">{snapshot.policy_version}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Roles</dt>
          <dd className="mt-0.5">{snapshot.roles.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Scopes</dt>
          <dd className="mt-0.5">{snapshot.scopes.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Captured</dt>
          <dd className="mt-0.5 tabular-nums text-muted-foreground">
            {new Date(snapshot.captured_at).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
