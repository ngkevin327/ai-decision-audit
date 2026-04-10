import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

const variants: Record<
  AlertVariant,
  { container: string; icon: typeof AlertTriangle; iconClass: string }
> = {
  error: {
    container:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
    icon: AlertTriangle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  warning: {
    container:
      'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    container:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    container: 'border-border bg-muted/50 text-foreground dark:border-border dark:bg-muted/30',
    icon: Info,
    iconClass: 'text-primary',
  },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', config.container, className)}
      {...props}
    >
      <Icon className={cn('h-5 w-5 shrink-0', config.iconClass)} aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className={title ? 'text-[0.925em] opacity-90' : undefined}>{children}</div>
      </div>
    </div>
  );
}
