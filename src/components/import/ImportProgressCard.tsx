'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  X,
} from 'lucide-react';
import type { ImportProgressResponse } from '@/app/api/gomafia-sync/import/progress/route';
import {
  formatTimeRemaining,
  formatProcessingRate,
} from '@/lib/gomafia/import/progress-calculator';
import { CancelButton } from '@/components/sync/CancelButton';
import { useCancelImport } from '@/hooks/useCancelImport';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportProgressCardProps {
  progress: ImportProgressResponse | null;
  className?: string;
  onCancel?: () => void;
  error?: string | null; // Optional error message from sync status
  isCompleted?: boolean; // Whether import completed successfully
}

/**
 * ImportProgressCard component displays real-time import progress with detailed metrics.
 * Shows phase, progress bar, entity counts, time estimates, and processing rate.
 *
 * @param progress Progress data from useImportProgress hook
 * @param className Optional additional CSS classes
 */
export function ImportProgressCard({
  progress,
  className = '',
  onCancel,
  error,
  isCompleted,
}: ImportProgressCardProps) {
  const {
    cancelImport,
    isCancelling,
    error: cancelError,
    isError: isCancelError,
  } = useCancelImport();

  const handleCancel = () => {
    cancelImport(undefined, {
      onSuccess: () => {
        onCancel?.();
      },
    });
  };
  // Show "no import" message only if there's no progress data and no error/completion state
  if (!progress && !error && !isCompleted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Import Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No import operation in progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no progress data but we have error or completion state, show that
  if (!progress) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {error ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Import Progress
            </CardTitle>
            {error ? (
              <Badge className="bg-red-100 text-red-800">Error</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">Completed</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!error && (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium">
                Import completed successfully
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Simplified status functions - at this point progress is guaranteed to exist
  // Handle error and completed states explicitly, otherwise show in-progress
  const _getStatusColor = () => {
    if (error) {
      return 'text-red-600';
    }
    if (isCompleted) {
      return 'text-green-600';
    }
    // Default to in-progress (blue) when progress exists and is running
    return 'text-blue-600';
  };

  const getStatusBadge = () => {
    if (error) {
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    // Default to in-progress when progress exists and is running
    return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
  };

  const formatElapsedTime = (seconds: number): string => {
    if (seconds <= 0) {
      return '0s';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPhaseDisplayName = (phase: string | null): string => {
    if (!phase) {
      return 'Unknown';
    }
    // Convert phase names to readable format
    return phase
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getCurrentEntityDisplay = (): string | null => {
    if (!progress.currentEntity) {
      return null;
    }
    if (progress.currentEntity.name) {
      return progress.currentEntity.name;
    }
    if (progress.currentEntity.id) {
      return `ID: ${progress.currentEntity.id}`;
    }
    if (progress.currentEntity.pageNumber !== undefined) {
      return `Page ${progress.currentEntity.pageNumber}`;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : progress.isRunning ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : isCompleted || progress.progress > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Activity className="h-5 w-5 text-muted-foreground" />
            )}
            Import Progress
          </CardTitle>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {progress.isRunning && (
              <CancelButton
                onClick={handleCancel}
                disabled={isCancelling}
                icon={<X className="h-4 w-4" />}
                size="sm"
                aria-label="Cancel import operation"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6" aria-live="polite" aria-atomic="true">
        {/* Error Alert */}
        {(error || (isCancelError && cancelError)) && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error || cancelError?.error || 'Failed to cancel import'}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <Progress
            value={progress.progress}
            className="h-3"
            aria-label={`Import progress: ${progress.progress}%`}
          />
        </div>

        {/* Current Phase */}
        {progress.currentPhase && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Phase</span>
              <span className="font-medium">
                {getPhaseDisplayName(progress.currentPhase)}
              </span>
            </div>
            {getCurrentEntityDisplay() && (
              <div className="text-sm text-muted-foreground">
                {getCurrentEntityDisplay()}
              </div>
            )}
          </div>
        )}

        {/* Entity Counts */}
        {progress.totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processed</span>
              <span className="font-medium">
                {progress.processedCount.toLocaleString()} /{' '}
                {progress.totalCount.toLocaleString()}
              </span>
            </div>
            {progress.currentPhase && (
              <div className="text-xs text-muted-foreground">
                {getPhaseDisplayName(progress.currentPhase)}:{' '}
                {progress.processedCount.toLocaleString()} of{' '}
                {progress.totalCount.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Time Information */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Elapsed Time</span>
            </div>
            <span className="font-medium">
              {formatElapsedTime(progress.elapsedSeconds)}
            </span>
          </div>

          {progress.estimatedSecondsRemaining > 0 && progress.isRunning && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Remaining</span>
              <span className="font-medium">
                {formatTimeRemaining(progress.estimatedSecondsRemaining)}
              </span>
            </div>
          )}

          {progress.processingRate > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Processing Rate</span>
              </div>
              <span className="font-medium">
                {formatProcessingRate(progress.processingRate)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
