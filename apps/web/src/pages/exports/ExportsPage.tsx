import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function ExportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Exports</h1>
        <p className="text-sm text-muted-foreground">
          Export jobs and manifests will appear here in Stage 9.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create tamper-evident export bundles with sealed chain hashes once the export worker
            ships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
