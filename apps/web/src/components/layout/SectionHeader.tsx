import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border px-5 py-4',
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
