'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import { ImportProgress, ImportStatus } from '@/types/importProgress';

interface ImportProgressCardProps {
  progress?: ImportProgress | null;
  onRefresh?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  className?: string;
}

export function ImportProgressCard({
  progress,
  onRefresh,
  onStart,
  onStop,
  className = '',
}: ImportProgressCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: ImportStatus) => {
    switch (status) {
      case 'RUNNING':
        return <Activity className="h-4 w-4 animate-pulse text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!startTime) return '0s';
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatEstimatedCompletion = (estimatedCompletion?: Date) => {
    if (!estimatedCompletion) return 'Calculating...';

    const now = new Date();
    const diff = estimatedCompletion.getTime() - now.getTime();

    if (diff <= 0) return 'Any moment now...';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m remaining`;
    } else {
      return `~${minutes}m remaining`;
    }
  };

  if (!progress) {
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
            <p className="text-muted-foreground mb-4">
              No import operation in progress
            </p>
            {onStart && (
              <Button onClick={onStart}>
                <Play className="h-4 w-4 mr-2" />
                Start Import
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(progress.status)}
            Import Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(progress.status)}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {/* Operation Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Operation</span>
            <span className="font-medium">{progress.operation}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Records</span>
            <span className="font-medium">
              {progress.processedRecords?.toLocaleString() || '0'} /{' '}
              {progress.totalRecords?.toLocaleString() || '0'}
            </span>
          </div>
          {progress.errors > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Errors</span>
              <span className="font-medium text-red-600">
                {progress.errors}
              </span>
            </div>
          )}
        </div>

        {/* Time Information */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {formatDuration(progress.startTime, progress.estimatedCompletion)}
            </span>
          </div>
          {progress.estimatedCompletion && progress.status === 'RUNNING' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Estimated Completion
              </span>
              <span className="font-medium">
                {formatEstimatedCompletion(progress.estimatedCompletion)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {progress.status === 'RUNNING' && onStop && (
          <div className="pt-2">
            <Button variant="destructive" size="sm" onClick={onStop}>
              <Pause className="h-4 w-4 mr-2" />
              Stop Import
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
