'use client';

import * as React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RetryButton } from '@/components/sync/RetryButton';
import { cn } from '@/lib/utils';

/**
 * ErrorMessagePanel component for displaying import errors with actionable guidance.
 *
 * Pattern inspired by react-error-boundary's fallback components:
 * - Clear error message display
 * - Expandable error details
 * - Actionable user guidance
 * - Retry integration
 * - Full accessibility (WCAG 2.2 compliant)
 *
 * Features:
 * - Alert role for screen reader announcements
 * - Destructive variant for visual error indication
 * - Optional error code display
 * - Optional timestamp
 * - Expandable technical details
 * - Retry button integration
 * - User guidance (single string or list)
 * - Custom icon support
 *
 * @example
 * ```tsx
 * // Basic error
 * <ErrorMessagePanel error="Failed to fetch data" />
 *
 * // With retry
 * <ErrorMessagePanel
 *   error="Network timeout"
 *   onRetry={handleRetry}
 *   isRetrying={isRetrying}
 * />
 *
 * // With guidance
 * <ErrorMessagePanel
 *   error="Connection failed"
 *   errorCode="EC-006"
 *   guidance={[
 *     'Check your internet connection',
 *     'Verify gomafia.pro is accessible',
 *     'Try again in a few minutes'
 *   ]}
 *   onRetry={handleRetry}
 * />
 *
 * // With error details
 * <ErrorMessagePanel
 *   error={error}
 *   showDetails
 *   errorCode="EC-004"
 *   timestamp={new Date()}
 * />
 * ```
 */

export interface ErrorMessagePanelProps {
  /**
   * Error message or Error object
   */
  error: string | Error | null | undefined;

  /**
   * Custom title (defaults to "Error")
   */
  title?: string;

  /**
   * Error code for reference (e.g., "EC-006")
   */
  errorCode?: string;

  /**
   * Timestamp when error occurred
   */
  timestamp?: Date;

  /**
   * User guidance (single string or array of steps)
   */
  guidance?: string | string[];

  /**
   * Whether to show expandable error details
   * @default false
   */
  showDetails?: boolean;

  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;

  /**
   * Retry handler
   */
  onRetry?: () => void;

  /**
   * Whether retry is in progress
   * @default false
   */
  isRetrying?: boolean;

  /**
   * Custom retry button text
   * @default "Retry Import"
   */
  retryText?: string;

  /**
   * Alert variant
   * @default "destructive"
   */
  variant?: 'default' | 'destructive';

  /**
   * Additional className
   */
  className?: string;

  /**
   * aria-label for accessibility
   */
  'aria-label'?: string;
}

export const ErrorMessagePanel = React.forwardRef<
  HTMLDivElement,
  ErrorMessagePanelProps
>(
  (
    {
      error,
      title = 'Error',
      errorCode,
      timestamp,
      guidance,
      showDetails = false,
      icon,
      onRetry,
      isRetrying = false,
      retryText = 'Retry Import',
      variant = 'destructive',
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const [detailsExpanded, setDetailsExpanded] = React.useState(false);

    // Get error message
    const errorMessage = React.useMemo(() => {
      if (!error) return 'An unknown error occurred';
      if (typeof error === 'string') return error;
      if (error instanceof Error) return error.message;
      return String(error);
    }, [error]);

    // Get error stack for details
    const errorStack = React.useMemo(() => {
      if (error instanceof Error && error.stack) {
        return error.stack;
      }
      return null;
    }, [error]);

    // Format guidance as array
    const guidanceList = React.useMemo(() => {
      if (!guidance) return null;
      if (Array.isArray(guidance)) return guidance;
      return [guidance];
    }, [guidance]);

    return (
      <Alert
        ref={ref}
        variant={variant}
        className={cn('space-y-3', className)}
        aria-label={ariaLabel}
      >
        {icon && <div className="flex items-start">{icon}</div>}

        <div className="space-y-2">
          <AlertTitle className="flex items-center gap-2">
            {title}
            {errorCode && (
              <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">
                {errorCode}
              </code>
            )}
          </AlertTitle>

          <AlertDescription className="space-y-3">
            {/* Error Message */}
            <div>{errorMessage}</div>

            {/* Timestamp */}
            {timestamp && (
              <div className="text-xs opacity-70">
                Occurred at: {timestamp.toLocaleString()}
              </div>
            )}

            {/* User Guidance */}
            {guidanceList && guidanceList.length > 0 && (
              <div className="space-y-1 mt-3 pt-3 border-t border-destructive/20">
                <div className="font-medium text-sm">What you can do:</div>
                {guidanceList.length === 1 ? (
                  <div className="text-sm">{guidanceList[0]}</div>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {guidanceList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Error Details (Expandable) */}
            {showDetails && errorStack && (
              <details
                className="mt-3 pt-3 border-t border-destructive/20"
                open={detailsExpanded}
                onToggle={(e) => setDetailsExpanded(e.currentTarget.open)}
              >
                <summary className="cursor-pointer text-sm font-medium hover:opacity-80">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                  {errorStack}
                </pre>
              </details>
            )}

            {/* Retry Button */}
            {onRetry && (
              <div className="mt-4 pt-3 border-t border-destructive/20">
                <RetryButton
                  onClick={onRetry}
                  disabled={isRetrying}
                  loadingText="Retrying..."
                  variant="outline"
                  size="sm"
                >
                  {retryText}
                </RetryButton>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    );
  }
);

ErrorMessagePanel.displayName = 'ErrorMessagePanel';
