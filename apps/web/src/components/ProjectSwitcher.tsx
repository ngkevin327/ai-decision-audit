import { useEffect, useState } from 'react';
import { Project, useProjects, useSelectedProject, ENVIRONMENT_STORAGE_KEY } from '../api/hooks';

export function ProjectSwitcher() {
  const { list } = useProjects();
  const { projectId, setProjectId } = useSelectedProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [environmentId, setEnvironmentId] = useState(
    () => localStorage.getItem(ENVIRONMENT_STORAGE_KEY) ?? '',
  );

  useEffect(() => {
    list()
      .then((items) => {
        setProjects(items);
        if (!projectId && items[0]) {
          setProjectId(items[0].id);
        }
      })
      .catch(() => setProjects([]));
  }, [list, projectId, setProjectId]);

  const selected = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-muted-foreground">
        Project
        <select
          className="ml-2 h-8 rounded-md border border-border bg-card px-2 text-sm"
          value={projectId ?? ''}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="" disabled>
            Select project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {selected && selected.environments.length > 0 && (
        <label className="text-xs text-muted-foreground">
          Environment
          <select
            className="ml-2 h-8 rounded-md border border-border bg-card px-2 text-sm"
            value={environmentId}
            onChange={(event) => {
              setEnvironmentId(event.target.value);
              localStorage.setItem(ENVIRONMENT_STORAGE_KEY, event.target.value);
            }}
          >
            <option value="">All</option>
            {selected.environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
