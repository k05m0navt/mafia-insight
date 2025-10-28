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
  const [error, setError] = useState<string | null>(null);

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
    if (!syncStatus?.status.isRunning) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000); // Refresh every 2 seconds when running

    return () => clearInterval(interval);
  }, [syncStatus?.status.isRunning]);

  if (!syncStatus) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading sync status...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { status, metrics, health } = syncStatus;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Live Sync Status</span>
              {status.isRunning && (
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
              {status.isRunning ? (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              ) : status.lastError ? (
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

          {status.isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="w-full" />
              {status.currentOperation && (
                <p className="text-sm text-muted-foreground">
                  {status.currentOperation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Last Sync Info */}
        {status.lastSyncTime && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <Badge variant="outline">{status.lastSyncType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(status.lastSyncTime).toLocaleString()}
            </p>
          </div>
        )}

        {/* Error Display */}
        {status.lastError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Last Error:</strong> {status.lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Health Status */}
        {health && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Health</span>
              <Badge
                variant={
                  health.status === 'HEALTHY'
                    ? 'default'
                    : health.status === 'WARNING'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {health.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{health.message}</p>
            {health.recommendations.length > 0 && (
              <div className="mt-2">
                <h4 className="text-xs font-medium mb-1">Recommendations:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {health.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {metrics && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{metrics.totalSyncs}</div>
              <div className="text-xs text-muted-foreground">Total Syncs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Error Rate</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch sync status: {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
