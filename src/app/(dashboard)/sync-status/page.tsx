'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SyncStatusIndicator } from '@/components/data-display/SyncStatusIndicator';
import { SyncTriggerButton } from '@/components/data-display/SyncTriggerButton';
import { SyncLogsTable } from '@/components/data-display/SyncLogsTable';
import { LiveSyncStatus } from '@/components/data-display/LiveSyncStatus';
import { PageLoading, PageError } from '@/components/ui/PageLoading';

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime: string | null;
  lastSyncType: string | null;
  lastError: string | null;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  errorRate: number;
}

interface SyncHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  recommendations: string[];
}

export default function SyncStatusPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [syncHealth, setSyncHealth] = useState<SyncHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/gomafia-sync/sync/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      const data = await response.json();
      setSyncStatus(data.status);
      setSyncMetrics(data.metrics);
      setSyncHealth(data.health);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();

    // Refresh every 5 seconds if sync is running
    const interval = setInterval(() => {
      if (syncStatus?.isRunning) {
        fetchSyncStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [syncStatus?.isRunning]);

  const handleSyncTrigger = async (type: 'FULL' | 'INCREMENTAL') => {
    try {
      const response = await fetch('/api/gomafia-sync/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger sync');
      }

      // Refresh status after triggering
      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return (
      <PageLoading
        title="Loading sync status..."
        layout="fullscreen"
        showSearch={false}
        showFilters={false}
      />
    );
  }

  if (error) {
    return (
      <PageError
        title="Error Loading Sync Status"
        message={error}
        onRetry={fetchSyncStatus}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Status</h1>
          <p className="text-muted-foreground">
            Monitor and manage gomafia data synchronization
          </p>
        </div>
        <SyncTriggerButton onTrigger={handleSyncTrigger} />
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <SyncStatusIndicator status={syncHealth?.status || 'HEALTHY'} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.isRunning ? 'Running' : 'Idle'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.currentOperation || 'No active operation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-syncs">
              {syncMetrics?.totalSyncs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time sync operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="successful-syncs">
              {syncMetrics?.successfulSyncs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful sync operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="error-rate">
              {syncMetrics?.errorRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Failed sync operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Sync Progress */}
      {syncStatus?.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Current Sync Progress</CardTitle>
            <CardDescription>
              {syncStatus.currentOperation || 'Processing...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{syncStatus.progress}%</span>
              </div>
              <Progress value={syncStatus.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Status */}
      {syncHealth && (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>{syncHealth.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    syncHealth.status === 'HEALTHY'
                      ? 'default'
                      : syncHealth.status === 'WARNING'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {syncHealth.status}
                </Badge>
              </div>
              {syncHealth.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {syncHealth.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Sync Info */}
      {syncStatus?.lastSyncTime && (
        <Card>
          <CardHeader>
            <CardTitle>Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="outline">{syncStatus.lastSyncType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time:</span>
                <span className="text-sm">
                  {new Date(syncStatus.lastSyncTime).toLocaleString()}
                </span>
              </div>
              {syncStatus.lastError && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Error:</span>
                  <span className="text-sm text-destructive">
                    {syncStatus.lastError}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Status Updates */}
      <LiveSyncStatus />

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
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
