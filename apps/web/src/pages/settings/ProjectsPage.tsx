import { FolderKanban, Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Project, useProjects } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormField, SettingsCard } from '../../components/layout/SettingsCard';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function ProjectsPage() {
  const { list, create } = useProjects();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    list()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [list]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const project = await create(name, slug);
      setProjects((prev) => [...prev, project]);
      setName('');
      setSlug('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title="Projects"
        description="Organize copilot workloads by project and environment. Each project scopes traces and API keys."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          title="Create project"
          description="Add a new project with staging and production environments."
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="Display name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support Copilot"
                required
              />
            </FormField>
            <FormField label="URL slug">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="support-copilot"
                className="font-mono"
                required
              />
            </FormField>
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit">
              <Plus className="h-4 w-4" aria-hidden />
              Create project
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard title="Your projects" description="Active projects in this organization.">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No projects yet. Create one to get started.
            </p>
          )}
          <ul className="space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{project.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{project.slug}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Environments: {project.environments.map((env) => env.name).join(', ') || '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SettingsCard>
      </div>
    </div>
  );
}
