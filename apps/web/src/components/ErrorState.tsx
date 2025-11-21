import { Button } from './ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
