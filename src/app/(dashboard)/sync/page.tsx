'use client';

import { ManualSyncButton } from '@/components/sync/ManualSyncButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useManualSync } from '@/hooks/useManualSync';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  History,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SyncLogsTable } from '@/components/data-display/SyncLogsTable';

/**
 * Manual Sync Page
 * Displays manual sync controls, real-time progress, and sync history.
 * Users can trigger manual sync and view sync status.
 */
export default function SyncPage() {
  const {
    syncStatus,
    isLoadingStatus,
    isRunning,
    progress,
    currentOperation,
    lastError,
  } = useManualSync();

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Data Synchronization</h1>
        <p className="text-muted-foreground mt-2">
          Manually sync your game data from gomafia.pro to refresh your
          analytics
        </p>
      </div>

      {/* Manual Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Manual Sync
          </CardTitle>
          <CardDescription>
            Trigger a data synchronization to import new games and update
            existing data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Button */}
          <div>
            <ManualSyncButton variant="default" size="lg" showProgress={true} />
          </div>

          {/* Error Display */}
          {lastError && !isRunning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {!isRunning &&
            !lastError &&
            syncStatus?.lastSyncTime &&
            syncStatus.syncLogStatus === 'COMPLETED' && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Last sync completed successfully
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Current synchronization status and last sync information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading status...
              </span>
            </div>
          ) : (
            <>
              {/* Current Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-primary font-medium">
                          Syncing...
                        </span>
                      </>
                    ) : lastError ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive font-medium">
                          Error
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          Idle
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar (only when running) */}
                {isRunning && (
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {currentOperation || 'Processing...'}
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
              </div>

              {/* Last Sync Time */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {formatLastSyncTime(syncStatus?.lastSyncTime || null)}
                  </span>
                </div>

                {syncStatus?.lastSyncTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Last Sync Time:
                    </span>
                    <span className="font-mono text-xs">
                      {new Date(syncStatus.lastSyncTime).toLocaleString()}
                    </span>
                  </div>
                )}

                {syncStatus?.lastSyncType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sync Type:</span>
                    <span className="font-medium">
                      {syncStatus.lastSyncType}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sync History
          </CardTitle>
          <CardDescription>
            Recent synchronization operations and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncLogsTable />
        </CardContent>
      </Card>
    </div>
  );
}
