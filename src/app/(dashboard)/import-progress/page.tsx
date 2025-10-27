'use client';

import React, { useState, useEffect } from 'react';
import { ImportProgressCard } from '@/components/sync/ImportProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ImportProgress, ImportStatus } from '@/types/importProgress';

export default function ImportProgressPage() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/import/progress');

      if (!response.ok) {
        throw new Error('Failed to fetch import progress');
      }

      const data = await response.json();
      setProgress(data.progress || data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const startImport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'Full Data Sync',
          totalRecords: 1000, // This would be dynamic in real implementation
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start import');
      }

      const data = await response.json();
      setProgress(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import');
    } finally {
      setLoading(false);
    }
  };

  const stopImport = async () => {
    try {
      const response = await fetch('/api/import/progress', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop import');
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop import');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProgress();
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const getStatusIcon = (status: ImportStatus) => {
    switch (status) {
      case 'RUNNING':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'CANCELLED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ImportStatus) => {
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
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Import Progress</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import Progress</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          {!progress && (
            <Button onClick={startImport} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Start Import
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Progress Card */}
        <div className="lg:col-span-1">
          <ImportProgressCard
            progress={progress}
            onRefresh={handleRefresh}
            onStart={startImport}
            onStop={stopImport}
          />
        </div>

        {/* Status Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {progress ? (
                  getStatusIcon(progress.status)
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Status
                </span>
                {progress ? (
                  getStatusBadge(progress.status)
                ) : (
                  <Badge variant="outline">Idle</Badge>
                )}
              </div>

              {progress && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Operation
                    </span>
                    <span className="text-sm font-medium">
                      {progress.operation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Records Processed
                    </span>
                    <span className="text-sm font-medium">
                      {progress.processedRecords.toLocaleString()} /{' '}
                      {progress.totalRecords.toLocaleString()}
                    </span>
                  </div>

                  {progress.errors > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Errors
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        {progress.errors}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Started
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(progress.startTime).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
