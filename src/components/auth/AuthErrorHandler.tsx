'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';

/**
 * Component to handle transient authentication errors with toast notifications
 * Shows toast for transient errors (network failures, temporary API issues)
 * Handles persistent errors inline (already handled by components)
 */
export function AuthErrorHandler() {
  const { toast } = useToast();
  const { error, isLoading, clearError } = useAuthStore();
  const lastErrorRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only handle transient errors (network, temporary failures)
    // Persistent errors should be shown inline by components
    const isTransientError =
      error &&
      (error.toLowerCase().includes('network') ||
        error.toLowerCase().includes('connection') ||
        error.toLowerCase().includes('timeout') ||
        error.toLowerCase().includes('temporary') ||
        error.toLowerCase().includes('try again'));

    // Don't show errors for session expiry (handled by SessionExpiredToast)
    const isSessionError =
      error?.toLowerCase().includes('session expired') ||
      error?.toLowerCase().includes('expired');

    if (
      isTransientError &&
      !isSessionError &&
      error !== lastErrorRef.current &&
      !isLoading
    ) {
      lastErrorRef.current = error;

      const handleRetry = async () => {
        // Clear the error and retry auth check
        clearError();
        toastIdRef.current = null;

        // The AuthInitializer will retry checkAuthStatus on next render
        window.location.reload(); // Simple retry - reload page
      };

      const toastResult = toast({
        title: 'Authentication Error',
        description:
          error ||
          'A temporary authentication error occurred. Please try again.',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry authentication" asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="bg-background hover:bg-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </ToastAction>
        ),
      });

      toastIdRef.current = toastResult.id;
    }

    // Clear error state after showing toast (toast will auto-dismiss)
    if (isTransientError && !isLoading) {
      // Don't clear error immediately - let user see the toast
      // Error will be cleared when user clicks retry or toast dismisses
    }
  }, [error, isLoading, toast, clearError]);

  // Clear toast when error is cleared manually
  useEffect(() => {
    if (!error && toastIdRef.current) {
      // Toast will auto-dismiss, just clear the ref
      toastIdRef.current = null;
      lastErrorRef.current = null;
    }
  }, [error]);

  return null; // This component doesn't render anything
}
