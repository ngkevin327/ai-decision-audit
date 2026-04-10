import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageStateProps {
  children: ReactNode;
  className?: string;
}

/** Centers loading, error, and empty states within the standard page width. */
export function PageState({ children, className }: PageStateProps) {
  return <div className={cn('page-container', className)}>{children}</div>;
}
