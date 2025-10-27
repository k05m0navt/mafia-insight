'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ImportProgress {
  id: string;
  operation: string;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errors: number;
  startTime: string;
  estimatedCompletion?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

export default function ImportManagementPage() {
  const [imports, setImports] = useState<ImportProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_selectedStrategy, _setSelectedStrategy] = useState<string>('');

  const strategies = [
    { id: 'players', name: 'Players', description: 'Import player data' },
    {
      id: 'tournaments',
      name: 'Tournaments',
      description: 'Import tournament data',
    },
    { id: 'games', name: 'Games', description: 'Import game data' },
    { id: 'clubs', name: 'Clubs', description: 'Import club data' },
    {
      id: 'player_stats',
      name: 'Player Statistics',
      description: 'Import player statistics',
    },
    {
      id: 'tournament_results',
      name: 'Tournament Results',
      description: 'Import tournament results',
    },
  ];

  useEffect(() => {
    fetchImports();
    const interval = setInterval(fetchImports, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchImports = async () => {
    try {
      const response = await fetch('/api/import/progress');
      if (!response.ok) {
        throw new Error('Failed to fetch imports');
      }
      const data = await response.json();
      setImports(data.imports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load imports');
    } finally {
      setLoading(false);
    }
  };

  const startImport = async (strategy: string) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy }),
      });

      if (!response.ok) {
        throw new Error('Failed to start import');
      }

      await fetchImports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import');
    }
  };

  const stopImport = async (importId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/import/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ importId }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop import');
      }

      await fetchImports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop import');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'RUNNING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'CANCELLED':
        return <Square className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      PENDING: 'secondary',
      RUNNING: 'default',
      COMPLETED: 'default',
      FAILED: 'destructive',
      CANCELLED: 'outline',
    };

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import Management</h1>
        <p className="text-muted-foreground">
          Manage data imports and monitor progress
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Start New Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-medium">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {strategy.description}
                </p>
                <Button
                  onClick={() => startImport(strategy.id)}
                  className="w-full"
                  disabled={imports.some(
                    (imp) =>
                      imp.operation === strategy.id && imp.status === 'RUNNING'
                  )}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Import
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Imports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Active Imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imports.filter((imp) => imp.status === 'RUNNING').length > 0 ? (
            <div className="space-y-4">
              {imports
                .filter((imp) => imp.status === 'RUNNING')
                .map((importItem) => (
                  <div key={importItem.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(importItem.status)}
                        <span className="font-medium">
                          {importItem.operation}
                        </span>
                        {getStatusBadge(importItem.status)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopImport(importItem.id)}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {importItem.processedRecords} /{' '}
                          {importItem.totalRecords} records
                        </span>
                        <span>{importItem.progress}%</span>
                      </div>
                      <Progress value={importItem.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Duration: {formatDuration(importItem.startTime)}
                        </span>
                        {importItem.errors > 0 && (
                          <span className="text-red-600">
                            Errors: {importItem.errors}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active imports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imports.length > 0 ? (
            <div className="space-y-3">
              {imports
                .filter((imp) => imp.status !== 'RUNNING')
                .slice(0, 10)
                .map((importItem) => (
                  <div
                    key={importItem.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(importItem.status)}
                      <div>
                        <div className="font-medium">
                          {importItem.operation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {importItem.processedRecords} /{' '}
                          {importItem.totalRecords} records
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(importItem.status)}
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(importItem.startTime)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No import history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
