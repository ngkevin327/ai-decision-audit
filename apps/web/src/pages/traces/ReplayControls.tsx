import { Button } from '../../components/ui/button';

interface ReplayControlsProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ReplayControls({ index, total, onPrev, onNext }: ReplayControlsProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Button type="button" variant="outline" onClick={onPrev} disabled={index <= 0}>
        Previous (k)
      </Button>
      <span className="text-sm text-muted-foreground">
        Step {index + 1} of {total}
      </span>
      <Button type="button" onClick={onNext} disabled={index >= total - 1}>
        Next (j)
      </Button>
    </div>
  );
}
