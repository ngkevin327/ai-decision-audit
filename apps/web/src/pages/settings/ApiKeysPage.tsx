import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '../../auth/ProtectedRoute';
import { ApiKeySummary, Project, useApiKeys, useProjects } from '../../api/hooks';

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
    <ProtectedRoute>
      <section>
        <h2>API Keys</h2>
        <form onSubmit={onSubmit} className="settings-form">
          <label>
            Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Key name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <button type="submit">Issue key</button>
        </form>
        {plaintextKey && (
          <p className="key-reveal">
            Copy this key now — it will not be shown again: <code>{plaintextKey}</code>
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <ul>
          {keys.map((key) => (
            <li key={key.id}>
              {key.name} — <code>{key.keyPrefix}…</code> ({key.scopes.join(', ')})
            </li>
          ))}
        </ul>
      </section>
    </ProtectedRoute>
  );
}
