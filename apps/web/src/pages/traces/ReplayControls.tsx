import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface ReplayControlsProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ReplayControls({ index, total, onPrev, onNext }: ReplayControlsProps) {
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="surface-card space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onPrev} disabled={index <= 0}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
          <kbd className="ml-1 hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            k
          </kbd>
        </Button>
        <span className="text-sm font-medium tabular-nums">
          Step <span className="text-primary">{index + 1}</span> of {total}
        </span>
        <Button type="button" onClick={onNext} disabled={index >= total - 1}>
          Next
          <kbd className="mr-1 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            j
          </kbd>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
