'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/AuthService';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';
import { RefreshCw } from 'lucide-react';

/**
 * Component to monitor session expiry and show toast notification
 * Automatically detects session expiry and offers refresh option
 */
export function SessionExpiredToast() {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, error, checkAuthStatus } = useAuthStore();
  const lastErrorRef = useRef<string | null>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    // Check if we have a session expiry error
    const isSessionExpired =
      error?.toLowerCase().includes('session expired') ||
      error?.toLowerCase().includes('expired');

    // Only show toast if:
    // 1. Error indicates session expiry
    // 2. User was authenticated before
    // 3. We haven't shown this toast yet
    if (
      isSessionExpired &&
      !toastShownRef.current &&
      lastErrorRef.current !== error
    ) {
      toastShownRef.current = true;
      lastErrorRef.current = error;

      const handleRefresh = async () => {
        try {
          const refreshResult = await authService.refreshToken();

          if (refreshResult.success) {
            // Re-check auth status after refresh
            await checkAuthStatus();

            toast({
              title: 'Session refreshed',
              description: 'Your session has been successfully refreshed.',
              variant: 'default',
            });

            toastShownRef.current = false;
          } else {
            // Refresh failed - redirect to login
            toast({
              title: 'Session expired',
              description: 'Please sign in again to continue.',
              variant: 'destructive',
            });

            router.push('/login');
          }
        } catch (refreshError) {
          console.error('Session refresh error:', refreshError);
          toast({
            title: 'Refresh failed',
            description: 'Please sign in again to continue.',
            variant: 'destructive',
          });

          router.push('/login');
        }
      };

      toast({
        title: 'Session expired',
        description:
          'Your session has expired. Click refresh to extend it, or you will be redirected to sign in.',
        variant: 'destructive',
        action: (
          <ToastAction altText="Refresh session" asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="bg-background hover:bg-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </ToastAction>
        ),
      });
    }

    // Reset toast flag when error is cleared
    if (!error && toastShownRef.current) {
      toastShownRef.current = false;
    }
  }, [error, isAuthenticated, toast, router, checkAuthStatus]);

  // Monitor for 401 errors from API calls
  useEffect(() => {
    const handleApiError = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        status: number;
        message?: string;
      }>;

      if (customEvent.detail?.status === 401) {
        const errorMessage = customEvent.detail?.message || '';

        if (
          errorMessage.includes('expired') ||
          errorMessage.includes('Unauthorized')
        ) {
          // Check auth status which will trigger session expiry detection
          await checkAuthStatus();
        }
      }
    };

    window.addEventListener('api-error', handleApiError as EventListener);

    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener);
    };
  }, [checkAuthStatus]);

  return null; // This component doesn't render anything
}
