import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '../../auth/ProtectedRoute';
import { Project, useProjects } from '../../api/hooks';

export function ProjectsPage() {
  const { list, create } = useProjects();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    list()
      .then(setProjects)
      .catch((err) => setError(err.message));
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
    <ProtectedRoute>
      <section>
        <h2>Projects</h2>
        <form onSubmit={onSubmit} className="settings-form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Slug
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>
          <button type="submit">Create project</button>
        </form>
        {error && <p className="error">{error}</p>}
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <strong>{project.name}</strong> ({project.slug})
              <span> — {project.environments.map((env) => env.name).join(', ')}</span>
            </li>
          ))}
        </ul>
      </section>
    </ProtectedRoute>
  );
}
