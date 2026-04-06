import { ChevronDown } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">Project</span>
        <div className="relative">
          <select
            className="select-field h-8 min-w-[140px] border-0 bg-transparent py-0 pr-8 text-sm font-medium shadow-none focus:ring-0"
            value={projectId ?? ''}
            onChange={(event) => setProjectId(event.target.value)}
            aria-label="Select project"
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
          <ChevronDown
            className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>
      {selected && selected.environments.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Environment</span>
          <select
            className="select-field h-8 min-w-[100px] border-0 bg-transparent py-0 text-sm font-medium shadow-none focus:ring-0"
            value={environmentId}
            onChange={(event) => {
              setEnvironmentId(event.target.value);
              localStorage.setItem(ENVIRONMENT_STORAGE_KEY, event.target.value);
            }}
            aria-label="Select environment"
          >
            <option value="">All</option>
            {selected.environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
