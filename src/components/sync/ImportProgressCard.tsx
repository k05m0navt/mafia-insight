'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface ImportProgressCardProps {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime?: string | null;
}

export function ImportProgressCard({
  isRunning,
  progress,
  currentOperation,
  lastSyncTime,
}: ImportProgressCardProps) {
  if (!isRunning) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Status</CardTitle>
          <CardDescription>No import in progress</CardDescription>
        </CardHeader>
        <CardContent>
          {lastSyncTime && (
            <p className="text-sm text-muted-foreground">
              Last import: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Import Progress</CardTitle>
        <CardDescription>{currentOperation || 'Processing...'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="w-full"
            aria-valuenow={progress}
            role="progressbar"
          />
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground mt-2">
              Last import: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
