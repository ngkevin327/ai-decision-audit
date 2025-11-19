import { NavLink, Outlet } from 'react-router-dom';
import { ProjectSwitcher } from '../components/ProjectSwitcher';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/traces', label: 'Traces' },
  { to: '/exports', label: 'Exports' },
  { to: '/settings/projects', label: 'Settings' },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI Audit Trail
          </p>
          <p className="text-sm font-medium">Forensic Console</p>
        </div>
        <nav className="flex flex-col gap-1 p-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border bg-card px-6">
          <div id="app-header-slot" className="flex w-full items-center justify-between gap-4">
            <ProjectSwitcher />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
