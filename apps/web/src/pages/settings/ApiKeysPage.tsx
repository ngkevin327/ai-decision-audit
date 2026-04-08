import { AlertTriangle, KeyRound, Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiKeySummary, Project, useApiKeys, useProjects } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormField, SettingsCard } from '../../components/layout/SettingsCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function ApiKeysPage() {
  const { list: listProjects } = useProjects();
  const { list: listKeys, create } = useApiKeys();
  const [projects, setProjects] = useState<Project[]>([]);
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then((data) => {
        setProjects(data);
        if (data[0]) setProjectId(data[0].id);
      })
      .catch((err) => setError(err.message));
  }, [listProjects]);

  useEffect(() => {
    if (!projectId) return;
    listKeys(projectId)
      .then(setKeys)
      .catch((err) => setError(err.message));
  }, [projectId, listKeys]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPlaintextKey(null);
    try {
      const created = await create({
        name,
        projectId,
        scopes: ['trace:ingest', 'trace:read'],
      });
      setPlaintextKey(created.plaintextKey);
      setKeys((prev) => [
        {
          id: created.id,
          name: created.name,
          keyPrefix: created.keyPrefix,
          scopes: created.scopes,
          projectId: created.projectId,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title="API keys"
        description="Issue ingest and read keys for SDK integration. Plaintext keys are shown once at creation."
      />

      {plaintextKey && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0 space-y-2">
            <p className="font-medium">Copy your API key now — it will not be shown again.</p>
            <code className="block break-all rounded-lg bg-white/80 px-3 py-2 font-mono text-xs">
              {plaintextKey}
            </code>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard title="Issue new key">
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="Project">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="select-field"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Key name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production ingest"
                required
              />
            </FormField>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
            )}
            <Button type="submit">
              <Plus className="h-4 w-4" aria-hidden />
              Issue key
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard title="Active keys">
          <ul className="space-y-3">
            {keys.length === 0 && (
              <p className="text-sm text-muted-foreground">No keys for this project.</p>
            )}
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex items-start gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{key.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
                  <p className="mt-1 text-xs text-muted-foreground">{key.scopes.join(' · ')}</p>
                </div>
              </li>
            ))}
          </ul>
        </SettingsCard>
      </div>
    </div>
  );
}
