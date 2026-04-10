import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';

type LinkButtonVariant = 'primary' | 'outline' | 'ghost';
type LinkButtonSize = 'default' | 'lg';

const variants: Record<LinkButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90',
  outline: 'border border-border bg-card text-foreground hover:bg-accent',
  ghost: 'text-primary hover:bg-accent',
};

const sizes: Record<LinkButtonSize, string> = {
  default: 'h-9 px-4 text-sm',
  lg: 'h-10 px-4 text-sm shadow-md',
};

interface LinkButtonProps extends LinkProps {
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
}

export function LinkButton({
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
