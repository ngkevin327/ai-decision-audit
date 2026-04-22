import { cn } from '../../lib/utils';

type LogoSize = 'default' | 'large' | 'hero';

interface LogoProps {
  compact?: boolean;
  variant?: 'dark' | 'light';
  size?: LogoSize;
  className?: string;
}

const sizeStyles: Record<
  LogoSize,
  { mark: string; icon: string; title: string; subtitle: string; gap: string }
> = {
  default: {
    mark: 'h-11 w-11 rounded-xl',
    icon: 'h-6 w-6',
    title: 'text-lg font-bold tracking-tight',
    subtitle: 'text-xs font-semibold uppercase tracking-widest',
    gap: 'gap-3.5',
  },
  large: {
    mark: 'h-12 w-12 rounded-xl',
    icon: 'h-6 w-6',
    title: 'text-xl font-bold tracking-tight',
    subtitle: 'text-sm font-semibold uppercase tracking-widest',
    gap: 'gap-4',
  },
  hero: {
    mark: 'h-14 w-14 rounded-2xl',
    icon: 'h-7 w-7',
    title: 'text-2xl font-bold tracking-tight sm:text-3xl',
    subtitle: 'text-sm font-semibold uppercase tracking-[0.2em]',
    gap: 'gap-4',
  },
};

export function Logo({ compact, variant = 'dark', size = 'default', className }: LogoProps) {
  const s = sizeStyles[size];
  const titleHighlight =
    variant === 'light'
      ? 'bg-gradient-to-r from-primary via-primary to-indigo-500 bg-clip-text text-transparent'
      : 'text-sidebar-foreground drop-shadow-sm';
  const subtitleClass = variant === 'light' ? 'text-primary/90' : 'text-primary/80';

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center bg-primary shadow-glow ring-2 ring-primary/40',
          s.mark,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className={cn(s.icon, 'text-primary-foreground')} fill="none">
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
        <div className="min-w-0 leading-tight">
          <p className={cn(s.title, titleHighlight)}>AI Audit Trail</p>
          <p className={cn(s.subtitle, subtitleClass)}>Forensic Console</p>
        </div>
      )}
    </div>
  );
}
