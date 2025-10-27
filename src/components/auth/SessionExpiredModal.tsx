'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCw, LogIn, Loader2, AlertTriangle } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
// import Link from 'next/link';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  onSignIn?: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onSignIn,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState<'idle' | 'success' | 'failed'>(
    'idle'
  );
  const [timeRemaining, setTimeRemaining] = useState(30);
  const { refreshSession } = useSession();
  // const { } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRetryStatus('idle');
      setTimeRemaining(30);
    }
  }, [isOpen]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryStatus('idle');

    try {
      const result = await refreshSession();

      if (result.success) {
        setRetryStatus('success');
        setTimeout(() => {
          onRetry?.();
          onClose?.();
        }, 1000);
      } else {
        setRetryStatus('failed');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setRetryStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignIn = () => {
    onSignIn?.();
    onClose?.();
  };

  const handleClose = () => {
    if (retryStatus === 'success') return;
    onClose?.();
  };

  const getStatusIcon = () => {
    if (isRetrying) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }

    switch (retryStatus) {
      case 'success':
        return <RefreshCw className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusMessage = () => {
    if (isRetrying) {
      return 'Attempting to refresh your session...';
    }

    switch (retryStatus) {
      case 'success':
        return 'Session refreshed successfully!';
      case 'failed':
        return 'Session refresh failed. Please sign in again.';
      default:
        return 'Your session has expired. You can try to refresh it or sign in again.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Session Expired
          </DialogTitle>
          <DialogDescription>{getStatusMessage()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your authentication session has expired for security reasons.
              {timeRemaining > 0 && (
                <span className="block mt-1 text-sm">
                  This dialog will close automatically in {timeRemaining}{' '}
                  seconds.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {retryStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to refresh your session. Please sign in again to
                continue.
              </AlertDescription>
            </Alert>
          )}

          {retryStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <RefreshCw className="h-4 w-4" />
              <AlertDescription>
                Your session has been refreshed successfully! You can continue
                using the application.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {retryStatus !== 'success' && (
            <>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh Session
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSignIn}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In Again
              </Button>
            </>
          )}

          {retryStatus === 'success' && (
            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
