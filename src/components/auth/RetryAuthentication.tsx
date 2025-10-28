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
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

interface RetryAuthenticationProps {
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
  className?: string;
}

export const RetryAuthentication: React.FC<RetryAuthenticationProps> = ({
  onSuccess,
  onFailure,
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState<'idle' | 'success' | 'failed'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSession } = useSession();
  const { authState } = useAuth();
  const { user, isLoading: loading } = authState;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryStatus('idle');
    setErrorMessage(null);

    try {
      // Try to refresh the session first
      const sessionResult = await refreshSession();

      if (sessionResult.success) {
        setRetryStatus('success');
        onSuccess?.();
      } else {
        setRetryStatus('failed');
        setErrorMessage('Session refresh failed. Please try signing in again.');
        onFailure?.('Session refresh failed');
      }
    } catch (error) {
      console.error('Authentication retry failed:', error);
      setRetryStatus('failed');
      const errorMsg =
        error instanceof Error ? error.message : 'Authentication retry failed';
      setErrorMessage(errorMsg);
      onFailure?.(errorMsg);
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
      return 'Attempting to restore authentication...';
    }

    switch (retryStatus) {
      case 'success':
        return 'Authentication restored successfully!';
      case 'failed':
        return 'Authentication retry failed. Please sign in again.';
      default:
        return 'Your authentication session may have expired.';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Checking authentication...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">You are already authenticated.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Retry Authentication
        </CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your authentication session has expired or is invalid. You can try
            to restore it or sign in again.
          </AlertDescription>
        </Alert>

        {errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full flex items-center gap-2"
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry Authentication
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            If retry fails, you may need to sign in again with your credentials.
          </p>
        </div>

        {retryStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              Authentication restored successfully!
            </span>
          </div>
        )}

        {retryStatus === 'failed' && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Retry failed. Please sign in again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
