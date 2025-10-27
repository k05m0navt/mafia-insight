'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import type { UserFriendlyError } from '@/lib/auth/error-mapping';

interface ErrorRecoveryProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState<'idle' | 'success' | 'failed'>(
    'idle'
  );
  const { refreshSession } = useSession();
  // const { } = useAuth();

  const handleRetry = async () => {
    if (!error.isRetryable) return;

    setIsRetrying(true);
    setRetryStatus('idle');

    try {
      // Try to refresh session first
      const sessionResult = await refreshSession();

      if (sessionResult.success) {
        setRetryStatus('success');
        onRetry?.();
      } else {
        setRetryStatus('failed');
      }
    } catch (err) {
      console.error('Error recovery failed:', err);
      setRetryStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = () => {
    if (isRetrying) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }

    switch (retryStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusMessage = () => {
    if (isRetrying) {
      return 'Attempting to recover...';
    }

    switch (retryStatus) {
      case 'success':
        return 'Recovery successful! You can continue using the application.';
      case 'failed':
        return 'Recovery failed. Please try the suggested actions below.';
      default:
        return 'An error occurred that may be recoverable.';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Error Recovery
        </CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{error.message}</strong>
            {error.nextSteps.length > 0 && (
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {error.nextSteps.map((step, index) => (
                  <li key={index} className="text-sm">
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>

        {error.isRetryable && retryStatus !== 'success' && (
          <div className="flex gap-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>

            {onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={isRetrying}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}

        {retryStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Recovery completed successfully!</span>
          </div>
        )}

        {retryStatus === 'failed' && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">
              Recovery failed. Please try the suggested actions.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
