import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, cn } from '@bharatsales/ui';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Friendly inline error with a Retry button, for list/data pages whose fetch failed. */
export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this data. Check your connection and try again.",
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center rounded-xl border border-danger-100 bg-white px-6 py-12 text-center', className)}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50" aria-hidden="true">
        <AlertTriangle className="h-6 w-6 text-danger-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-foreground-muted">{message}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} leftIcon={<RefreshCw />}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Pulls a human-readable message out of an axios/Error rejection. */
export function getErrorMessage(err: unknown, fallback?: string): string | undefined {
  const e = err as { response?: { data?: { message?: unknown } }; message?: unknown } | undefined;
  const apiMessage = e?.response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage) return apiMessage;
  if (Array.isArray(apiMessage) && apiMessage.length) return apiMessage.join(', ');
  if (typeof e?.message === 'string' && e.message) return e.message;
  return fallback;
}
