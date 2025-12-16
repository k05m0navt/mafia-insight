'use client';

import { useSearchParams } from 'next/navigation';
import { useHistoricalImportStatus } from '@/hooks/useHistoricalImportStatus';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Import Status Page
 * Displays real-time import progress for historical data imports.
 * Polls status every 2 seconds using TanStack Query.
 */
export default function ImportStatusPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const { data, isLoading, error } = useHistoricalImportStatus(jobId);

  // Format estimated time remaining
  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return 'Calculating...';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Import Status</CardTitle>
            <CardDescription>Loading import status...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !jobId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : !jobId
                ? 'Job ID is required. Please provide a jobId query parameter.'
                : 'Failed to load import status'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Import Status</CardTitle>
            <CardDescription>No import data available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const {
    percentageComplete,
    currentGameNumber,
    totalGames,
    estimatedTimeRemaining,
    currentPhase,
    status,
    currentOperation,
    lastError,
    startTime,
    endTime,
  } = data;

  // Status icon and color
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <PauseCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                <span>Historical Import Status</span>
              </CardTitle>
              <CardDescription className="mt-2">
                Job ID: {jobId}
                {startTime && (
                  <span className="ml-4">
                    Started{' '}
                    {formatDistanceToNow(new Date(startTime), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {status.toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span>{percentageComplete}%</span>
            </div>
            <Progress value={percentageComplete} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Game {currentGameNumber} of {totalGames}
              </span>
              {estimatedTimeRemaining !== null && status === 'running' && (
                <span>
                  Estimated time remaining:{' '}
                  {formatTimeRemaining(estimatedTimeRemaining)}
                </span>
              )}
            </div>
          </div>

          {/* Current Operation */}
          {currentOperation && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Current Operation</div>
              <div className="text-sm text-muted-foreground">
                {currentOperation}
              </div>
            </div>
          )}

          {/* Current Phase */}
          {currentPhase && currentPhase !== 'UNKNOWN' && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Current Phase</div>
              <div className="text-sm text-muted-foreground">
                {currentPhase.replace(/_/g, ' ')}
              </div>
            </div>
          )}

          {/* Error Message */}
          {lastError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}

          {/* Completion Message */}
          {status === 'completed' && endTime && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Import Completed</AlertTitle>
              <AlertDescription>
                Import finished{' '}
                {formatDistanceToNow(new Date(endTime), {
                  addSuffix: true,
                })}
                . All {totalGames} games have been imported successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Paused Message */}
          {status === 'paused' && (
            <Alert>
              <PauseCircle className="h-4 w-4" />
              <AlertTitle>Import Paused</AlertTitle>
              <AlertDescription>
                The import has been paused. You can resume it from the import
                controls.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
