import type { PermissionSnapshot } from '../api/traces';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PermissionSnapshotPanelProps {
  snapshot: PermissionSnapshot | null;
}

export function PermissionSnapshotPanel({ snapshot }: PermissionSnapshotPanelProps) {
  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No permission snapshot captured for this trace.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Policy:</span> {snapshot.policy_version}
        </p>
        <p>
          <span className="text-muted-foreground">Roles:</span> {snapshot.roles.join(', ') || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">Scopes:</span> {snapshot.scopes.join(', ') || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">Captured:</span>{' '}
          {new Date(snapshot.captured_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
