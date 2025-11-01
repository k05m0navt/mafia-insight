'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface InlineAuthErrorProps {
  /**
   * Custom error message to display. If not provided, uses error from auth store.
   */
  error?: string | null;
  /**
   * Show dismiss button
   */
  showDismiss?: boolean;
  /**
   * Custom title for the error alert
   */
  title?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when error is dismissed
   */
  onDismiss?: () => void;
}

/**
 * Component to display inline error states for persistent authentication errors
 * Use this component in pages/components where persistent auth errors should be shown inline
 *
 * @example
 * ```tsx
 * const { error } = useAuthStore();
 *
 * return (
 *   <div>
 *     <InlineAuthError error={error} showDismiss />
 *     {/* Rest of page content *\/}
 *   </div>
 * );
 * ```
 */
export function InlineAuthError({
  error: customError,
  showDismiss = true,
  title,
  className = '',
  onDismiss,
}: InlineAuthErrorProps) {
  const { error: storeError, clearError } = useAuthStore();
  const error = customError ?? storeError;

  // Only show persistent errors (not transient ones)
  const isPersistentError =
    error &&
    !error.toLowerCase().includes('network') &&
    !error.toLowerCase().includes('connection') &&
    !error.toLowerCase().includes('timeout') &&
    !error.toLowerCase().includes('temporary') &&
    error.toLowerCase().includes('session expired') === false;

  if (!error || !isPersistentError) {
    return null;
  }

  const handleDismiss = () => {
    clearError();
    onDismiss?.();
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || 'Authentication Error'}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4 h-6 w-6 p-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
