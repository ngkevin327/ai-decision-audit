import {
  CreditCard,
  FileOutput,
  FolderKanban,
  LayoutDashboard,
  Search,
  Settings,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { ProjectSwitcher } from '../components/ProjectSwitcher';
import { QuotaBanner } from '../components/QuotaBanner';
import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/traces', label: 'Traces', icon: Search },
  { to: '/exports', label: 'Exports', icon: FileOutput },
  { to: '/settings/projects', label: 'Projects', icon: FolderKanban },
  { to: '/settings/billing', label: 'Billing', icon: CreditCard },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground',
                )
              }
            >
              <item.icon
                className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100"
                aria-hidden
              />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <NavLink
            to="/settings/api-keys"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-sidebar-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground',
              )
            }
          >
            <Settings className="h-4 w-4" aria-hidden />
            API keys &amp; settings
          </NavLink>
          <p className="mt-4 px-3 text-[10px] leading-relaxed text-sidebar-muted">
            Explain every AI decision with tamper-evident audit trails.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <QuotaBanner />
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border/80 bg-card/80 px-6 backdrop-blur-md">
          <div className="flex w-full items-center justify-between gap-4">
            <ProjectSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-mesh-gradient p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
