import { Alert } from './ui/alert';
import { Button } from './ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="error" title="Something went wrong">
      <p>{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Alert>
  );
}
