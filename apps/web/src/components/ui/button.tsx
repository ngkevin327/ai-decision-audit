import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-card hover:bg-accent',
  ghost: 'hover:bg-accent',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
