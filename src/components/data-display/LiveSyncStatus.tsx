'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveSyncStatusProps {
  className?: string;
}

interface SyncStatus {
  status: string;
  progress: number;
  currentPhase: string;
  recordsProcessed: number;
  totalRecords: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export function LiveSyncStatus({ className }: LiveSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gomafia-sync/sync/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      const data = await response.json();
      setSyncStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-refresh when sync is running
  useEffect(() => {
    if (syncStatus?.status !== 'RUNNING') return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000); // Refresh every 2 seconds when running

    return () => clearInterval(interval);
  }, [syncStatus?.status]);

  if (!syncStatus) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    status,
    progress,
    currentPhase,
    endTime,
    error: syncError,
  } = syncStatus;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Live Sync Status</span>
              {status === 'RUNNING' && (
                <Badge variant="secondary" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time synchronization status and progress
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <div className="flex items-center space-x-2">
              {status === 'RUNNING' ? (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              ) : syncError ? (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Idle
                </Badge>
              )}
            </div>
          </div>

          {status === 'RUNNING' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentPhase && (
                <p className="text-sm text-muted-foreground">{currentPhase}</p>
              )}
            </div>
          )}
        </div>

        {/* Last Sync Info */}
        {endTime && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <Badge variant="outline">Completed</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(endTime).toLocaleString()}
            </p>
          </div>
        )}

        {/* Error Display */}
        {syncError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Last Error:</strong> {syncError}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge
              variant={
                status === 'COMPLETED'
                  ? 'default'
                  : status === 'RUNNING'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {status === 'RUNNING'
              ? 'Sync in progress'
              : status === 'COMPLETED'
                ? 'Sync completed successfully'
                : 'Sync failed'}
          </p>
        </div>

        {/* Error Display */}
        {syncError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch sync status: {syncError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
