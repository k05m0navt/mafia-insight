'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImportProgressCard } from '@/components/sync/ImportProgressCard';
import { ImportSummary } from '@/components/sync/ImportSummary';
import { ImportControlPanel } from '@/components/import/ImportControlPanel';
import { SelectiveDataDelete } from '@/components/admin/SelectiveDataDelete';
import { ManualSyncDialog } from '@/components/import/ManualSyncDialog';
import { SkippedEntitiesTable } from '@/components/import/SkippedEntitiesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
} from 'lucide-react';
import type {
  ImportProgress as ImportProgressModel,
  ImportStatus as ImportPhaseStatus,
} from '@/types/importProgress';
import { useImportStatus } from '@/hooks/useImportStatus';
import { useImportTrigger } from '@/hooks/useImportTrigger';
import { useToast } from '@/components/hooks/use-toast';

const FULL_IMPORT_PHASES = [
  {
    id: 'clubs',
    name: 'Clubs',
    description: 'Scrape club directories and profile metadata.',
  },
  {
    id: 'players',
    name: 'Players',
    description: 'Sync player roster profiles from gomafia.pro.',
  },
  {
    id: 'club_members',
    name: 'Club Members',
    description: 'Associate players with their active clubs.',
  },
  {
    id: 'player_year_stats',
    name: 'Player Year Stats',
    description: 'Capture season-by-season performance statistics.',
  },
  {
    id: 'tournaments',
    name: 'Tournaments',
    description: 'Import tournament metadata and scheduling.',
  },
  {
    id: 'tournament_chief_judge',
    name: 'Tournament Chief Judges',
    description: 'Link chief judges to tournaments via detail pages.',
  },
  {
    id: 'player_tournament_history',
    name: 'Tournament Results',
    description: 'Capture player participation history per event.',
  },
  {
    id: 'judges',
    name: 'Judges',
    description: 'Sync judge assignments and player judge roles.',
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Import individual game logs with outcomes.',
  },
  {
    id: 'statistics',
    name: 'Aggregate Statistics',
    description: 'Recompute aggregated player role statistics.',
  },
];

function getStatusIcon(status: ImportPhaseStatus) {
  switch (status) {
    case 'RUNNING':
      return <Activity className="h-5 w-5 text-blue-500" />;
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'FAILED':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'CANCELLED':
      return <Square className="h-5 w-5 text-yellow-500" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: ImportPhaseStatus) {
  switch (status) {
    case 'RUNNING':
      return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function formatDuration(totalSeconds: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return '—';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function AdminImportPage() {
  const { toast } = useToast();
  const {
    data: status,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useImportStatus();
  const { trigger, isPending, cancel } = useImportTrigger();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isRunning = status?.isRunning ?? false;

  const progress = useMemo<ImportProgressModel | null>(() => {
    if (!status) {
      return null;
    }

    const computedStatus: ImportPhaseStatus =
      (status.status as ImportPhaseStatus | undefined) ||
      (status.isRunning
        ? 'RUNNING'
        : status.lastError
          ? 'FAILED'
          : status.progress >= 100
            ? 'COMPLETED'
            : 'PENDING');

    const startTime = status.startTime
      ? new Date(status.startTime)
      : status.lastSyncTime
        ? new Date(status.lastSyncTime)
        : new Date();

    const estimatedCompletion =
      status.endTime && status.progress === 100
        ? new Date(status.endTime)
        : undefined;

    return {
      id: status.syncLogId ?? 'current',
      operation:
        status.currentOperation ||
        (status.isRunning ? 'Running full import' : 'Full import ready'),
      progress: status.progress || 0,
      totalRecords: status.totalRecords || 0,
      processedRecords: status.processedRecords || 0,
      errors: status.validation?.invalidRecords || 0,
      startTime,
      estimatedCompletion,
      status: computedStatus,
    } satisfies ImportProgressModel;
  }, [status]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!progress?.startTime || !isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [progress?.startTime, isRunning]);

  const errorMessage = useMemo(() => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return null;
  }, [error]);

  const timingMetrics = useMemo(() => {
    if (!progress?.startTime) {
      return {
        elapsedSeconds: null,
        remainingSeconds: null,
        recordsPerMinute: null,
      };
    }

    const elapsedSeconds = (now - progress.startTime.getTime()) / 1000;

    if (elapsedSeconds <= 0) {
      return {
        elapsedSeconds: 0,
        remainingSeconds: null,
        recordsPerMinute: null,
      };
    }

    const recordsPerMinute =
      progress.processedRecords && elapsedSeconds
        ? (progress.processedRecords / elapsedSeconds) * 60
        : null;

    const progressRatio =
      progress.totalRecords && progress.totalRecords > 0
        ? progress.processedRecords / progress.totalRecords
        : null;

    const estimatedTotalSeconds =
      progressRatio && progressRatio > 0
        ? elapsedSeconds / progressRatio
        : null;

    const remainingSeconds =
      estimatedTotalSeconds && estimatedTotalSeconds > elapsedSeconds
        ? estimatedTotalSeconds - elapsedSeconds
        : null;

    return {
      elapsedSeconds,
      remainingSeconds,
      recordsPerMinute,
    };
  }, [progress, now]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleStartImport = useCallback(() => {
    if (isPending || isRunning) {
      return;
    }

    trigger(
      {},
      {
        onSuccess: async (response) => {
          toast({
            title: 'Full import started',
            description:
              response.message ||
              'All gomafia scrapers are running in sequence.',
          });
          await refetch();
        },
        onError: (err) => {
          const description =
            err instanceof Error
              ? err.message
              : 'Failed to start full import. Please try again.';

          toast({
            variant: 'destructive',
            title: 'Unable to start import',
            description,
          });
        },
      }
    );
  }, [trigger, toast, refetch, isPending, isRunning]);

  const handleConfirmCancel = useCallback(() => {
    if (isCancelling || !isRunning) {
      return;
    }

    setIsCancelling(true);
    cancel(undefined, {
      onSuccess: async (response) => {
        const description =
          (response as unknown as { message?: string })?.message ||
          'The import will stop after the current phase completes.';
        toast({
          title: 'Import cancellation requested',
          description,
        });
        await refetch();
      },
      onError: (err) => {
        const description =
          err instanceof Error
            ? err.message
            : 'Failed to cancel import. Please retry.';
        toast({
          variant: 'destructive',
          title: 'Unable to cancel import',
          description,
        });
      },
      onSettled: () => {
        setIsCancelling(false);
        setCancelDialogOpen(false);
      },
    });
  }, [cancel, toast, refetch, isCancelling, isRunning]);

  if (isLoading && !status) {
    return (
      <div className="space-y-6" data-testid="import-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Full Import</h1>
            <p className="text-muted-foreground">
              Running gomafia scrapers and ingesting unified data
            </p>
          </div>
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        <Card>
          <CardContent className="h-64 animate-pulse rounded-lg bg-muted" />
        </Card>
      </div>
    );
  }

  const lastError = status?.lastError || null;
  const phaseStatus: ImportPhaseStatus = progress?.status ?? 'PENDING';

  return (
    <div className="space-y-6" data-testid="import-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Center</h1>
          <p className="text-muted-foreground">
            Manage full imports, manual syncs, and skipped entity recovery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            data-testid="start-import-button"
            onClick={handleStartImport}
            disabled={isPending || isRunning}
          >
            {isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Full Import
              </>
            )}
          </Button>
        </div>
      </div>

      {(errorMessage || lastError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div className="space-y-1">
                {errorMessage && <p>{errorMessage}</p>}
                {lastError && (
                  <p className="text-sm">Last error: {lastError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3" data-testid="import-dashboard">
        <div className="space-y-6 xl:col-span-2">
          <div data-testid="import-progress">
            <ImportProgressCard
              progress={progress}
              onRefresh={handleRefresh}
              onStart={handleStartImport}
              onStop={handleConfirmCancel}
            />
          </div>

          <Card data-testid="import-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(phaseStatus)}
                Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current status</span>
                {getStatusBadge(phaseStatus)}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium" data-testid="progress-percentage">
                  {progress?.progress?.toFixed(1) ?? '0.0'}%
                </span>
              </div>

              <Progress
                value={progress?.progress ?? 0}
                className="h-2"
                data-testid="progress-bar"
              />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Operation</span>
                  <span className="font-medium">
                    {progress?.operation ?? 'Idle'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Records processed
                  </span>
                  <span className="font-medium" data-testid="imported-count">
                    {(progress?.processedRecords ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total records</span>
                  <span className="font-medium" data-testid="total-count">
                    {(progress?.totalRecords ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Errors</span>
                  <span
                    className="font-medium text-red-600"
                    data-testid="error-count"
                  >
                    {progress?.errors ?? 0}
                  </span>
                </div>
                {status?.validation?.validationRate !== null &&
                  status?.validation?.validationRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Validation rate
                      </span>
                      <span className="font-medium text-green-600">
                        {status.validation.validationRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Import speed</span>
                  <span className="font-medium" data-testid="import-speed">
                    {timingMetrics.recordsPerMinute
                      ? `${timingMetrics.recordsPerMinute.toFixed(1)} records/min`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Elapsed</span>
                  <span className="font-medium" data-testid="elapsed-time">
                    {formatDuration(
                      timingMetrics.elapsedSeconds
                        ? Math.floor(timingMetrics.elapsedSeconds)
                        : null
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Estimated remaining
                  </span>
                  <span
                    className="font-medium"
                    data-testid="estimated-time-remaining"
                  >
                    {formatDuration(
                      timingMetrics.remainingSeconds
                        ? Math.floor(timingMetrics.remainingSeconds)
                        : null
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <AlertDialog
                  open={cancelDialogOpen}
                  onOpenChange={setCancelDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="stop-import-button"
                      disabled={!isRunning || isCancelling}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {isCancelling ? 'Cancelling…' : 'Cancel Import'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-testid="confirm-stop-dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel import?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The current phase will finish before stopping. Any saved
                        checkpoints remain available for resuming later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isCancelling}>
                        Keep Running
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="confirm-stop-button"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                      >
                        Confirm Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {status?.summary && (
            <ImportSummary
              summary={status.summary}
              validationRate={status.validation?.validationRate ?? undefined}
              processedRecords={status.processedRecords}
              lastSyncTime={status.lastSyncTime}
            />
          )}
        </div>

        <div className="space-y-6">
          <ImportControlPanel />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Manual Entity Sync</span>
                <ManualSyncDialog
                  trigger={
                    <Button size="sm" data-testid="manual-sync-button">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Entity
                    </Button>
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Queue an immediate sync for a specific player, club, tournament,
                or game without launching a full import.
              </p>
              <p>
                Useful for ad-hoc corrections and verifying gomafia.pro changes
                before the next scheduled import.
              </p>
            </CardContent>
          </Card>

          <SelectiveDataDelete />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                Full Import Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The orchestrator runs each scraper sequentially, ensuring
                referential integrity across players, clubs, tournaments, and
                statistics. Phases included:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {FULL_IMPORT_PHASES.map((phase) => (
                  <div
                    key={phase.id}
                    className="rounded-md border p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs uppercase">
                        {phase.name}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SkippedEntitiesTable />
    </div>
  );
}
