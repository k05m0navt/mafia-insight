'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useManualSync, type ManualSyncStatus } from '@/hooks/useManualSync';
import { useToast } from '@/components/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ManualSyncButtonProps {
  className?: string;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showProgress?: boolean;
}

/**
 * Manual sync button component with loading states, progress tracking, and notifications.
 * Displays sync progress and shows toast notifications on completion.
 */
export function ManualSyncButton({
  className,
  variant = 'default',
  size = 'default',
  showProgress = true,
}: ManualSyncButtonProps) {
  const {
    triggerSync,
    isPending,
    isRunning,
    progress,
    currentOperation,
    lastError,
    syncStatus,
    syncData,
  } = useManualSync();
  const { toast } = useToast();
  const previousSyncStatusRef = useRef(syncStatus);
  const hasShownCompletionToastRef = useRef(false);

  // Show completion toast when sync finishes
  useEffect(() => {
    const previousStatus = previousSyncStatusRef.current;
    const currentStatus = syncStatus;

    // Detect sync completion: was running, now not running, and no error
    if (
      previousStatus?.isRunning &&
      !currentStatus?.isRunning &&
      !currentStatus?.lastError &&
      !hasShownCompletionToastRef.current
    ) {
      // Get sync summary from mutation response if available, otherwise use status
      const summary = getSyncSummary(syncData, currentStatus);

      toast({
        title: 'Sync Completed',
        description: summary,
        variant: 'default',
      });

      hasShownCompletionToastRef.current = true;
    }

    // Reset completion toast flag when sync starts
    if (currentStatus?.isRunning) {
      hasShownCompletionToastRef.current = false;
    }

    // Show error toast if sync fails
    if (currentStatus?.lastError && !currentStatus.isRunning) {
      toast({
        title: 'Sync Failed',
        description: currentStatus.lastError || 'An error occurred during sync',
        variant: 'destructive',
      });
    }

    previousSyncStatusRef.current = currentStatus;
  }, [syncStatus, syncData, toast]);

  // Show error toast when sync mutation fails
  useEffect(() => {
    if (lastError) {
      toast({
        title: 'Sync Error',
        description: lastError || 'Failed to start sync. Please try again.',
        variant: 'destructive',
      });
    }
  }, [lastError, toast]);

  const handleSync = () => {
    hasShownCompletionToastRef.current = false;
    triggerSync();
  };

  const isDisabled = isPending || isRunning;

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <Button
        onClick={handleSync}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className="relative"
        aria-label={isRunning ? 'Sync in progress' : 'Sync now'}
        aria-busy={isRunning}
      >
        {isDisabled ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Sync Now</span>
          </>
        )}
      </Button>

      {showProgress && isRunning && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentOperation || 'Syncing...'}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-label={`Sync progress: ${progress}%`}
          />
        </div>
      )}

      {showProgress && lastError && !isRunning && (
        <div className="text-sm text-destructive" role="alert">
          {lastError}
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to generate sync summary message from sync data and status
 */
function getSyncSummary(
  syncData:
    | {
        summary?: {
          gamesImported?: number;
          gamesUpdated?: number;
          errors?: number;
        };
      }
    | undefined,
  status: ManualSyncStatus | undefined
): string {
  // Use summary from mutation response if available
  if (syncData?.summary) {
    const {
      gamesImported = 0,
      gamesUpdated = 0,
      errors = 0,
    } = syncData.summary;
    const parts: string[] = [];

    if (gamesImported > 0) {
      parts.push(
        `${gamesImported} new game${gamesImported !== 1 ? 's' : ''} imported`
      );
    }
    if (gamesUpdated > 0) {
      parts.push(
        `${gamesUpdated} game${gamesUpdated !== 1 ? 's' : ''} updated`
      );
    }

    if (parts.length > 0) {
      return `Successfully synced data: ${parts.join(', ')}.`;
    }

    if (errors > 0) {
      return `Sync completed with ${errors} error${errors !== 1 ? 's' : ''}.`;
    }

    return 'Sync completed successfully.';
  }

  // Fallback to generic message
  if (status?.syncLogStatus === 'COMPLETED') {
    return 'Your data has been synchronized successfully.';
  }
  return 'Your data has been synchronized.';
}
