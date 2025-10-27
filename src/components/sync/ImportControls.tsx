'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CancelButton } from '@/components/sync/CancelButton';
import { RetryButton } from '@/components/sync/RetryButton';
import { ErrorMessagePanel } from '@/components/sync/ErrorMessagePanel';

/**
 * ImportControls component for managing import operations.
 *
 * Integrated with Phase 6 (US3) Error Recovery components:
 * - CancelButton for graceful cancellation (with checkpoint)
 * - RetryButton for failed import retry
 * - ErrorMessagePanel for comprehensive error display
 *
 * Features:
 * - Start/retry import
 * - Cancel running import
 * - Display errors with guidance
 * - Show success messages
 */

export interface ImportControlsProps {
  /**
   * Whether an import is currently running
   */
  isRunning: boolean;

  /**
   * Whether an operation is pending (starting/cancelling)
   */
  isPending?: boolean;

  /**
   * Error message or object
   */
  error?: string | Error | null;

  /**
   * Error code for guidance lookup (e.g., "EC-006")
   */
  errorCode?: string;

  /**
   * User guidance for error recovery
   */
  errorGuidance?: string | string[];

  /**
   * Success message to display
   */
  successMessage?: string | null;

  /**
   * Handler to trigger/retry import
   */
  onTrigger: () => void;

  /**
   * Handler to cancel running import
   */
  onCancel: () => void;

  /**
   * Whether this is a retry (shows RetryButton instead of Start)
   */
  isRetry?: boolean;
}

export function ImportControls({
  isRunning,
  isPending = false,
  error = null,
  errorCode,
  errorGuidance,
  successMessage = null,
  onTrigger,
  onCancel,
  isRetry = false,
}: ImportControlsProps) {
  // Determine if we should show retry button
  const showRetry = isRetry || error;

  return (
    <div className="space-y-4">
      {/* Error Display with Retry Integration */}
      {error && (
        <ErrorMessagePanel
          error={error}
          errorCode={errorCode}
          guidance={errorGuidance}
          onRetry={onTrigger}
          isRetrying={isPending}
          retryText="Retry Import"
        />
      )}

      {/* Success Message */}
      {successMessage && !error && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Control Buttons */}
      {!error && (
        <div className="flex items-center gap-2">
          {isRunning ? (
            <CancelButton
              onClick={onCancel}
              disabled={isPending}
              aria-label="Cancel import and save checkpoint for resume"
            />
          ) : showRetry ? (
            <RetryButton onClick={onTrigger} disabled={isPending} />
          ) : (
            <Button onClick={onTrigger} disabled={isPending}>
              {isPending ? 'Starting...' : 'Start Import'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
