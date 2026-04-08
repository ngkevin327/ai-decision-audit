import { cn } from '../../lib/utils';

interface LogoProps {
  compact?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}

export function Logo({ compact, variant = 'dark', className }: LogoProps) {
  const titleClass = variant === 'light' ? 'text-foreground' : 'text-sidebar-foreground';
  const subtitleClass = variant === 'light' ? 'text-muted-foreground' : 'text-sidebar-muted';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-glow"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none">
          <path
            d="M4 6h16M4 12h10M4 18h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="3" fill="currentColor" opacity="0.9" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-semibold tracking-tight', titleClass)}>
            AI Audit Trail
          </p>
          <p className={cn('truncate text-xs', subtitleClass)}>Forensic Console</p>
        </div>
      )}
    </div>
  );
}
