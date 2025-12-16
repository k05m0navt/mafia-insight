'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Clock, Play, RotateCcw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CheckpointInfo {
  phase: string;
  batch: number;
  progress: number;
  lastUpdated: string;
  importStartTimestamp?: string;
  processedCount?: number;
  totalCount?: number;
}

interface ResumeImportDialogProps {
  open: boolean;
  checkpoint: CheckpointInfo | null;
  onResume: () => Promise<void>;
  onStartFresh: () => Promise<void>;
  onClose: () => void;
}

/**
 * Dialog component for resuming interrupted imports from checkpoint.
 * Displays checkpoint information and provides options to resume or start fresh.
 */
export function ResumeImportDialog({
  open,
  checkpoint,
  onResume,
  onStartFresh,
  onClose,
}: ResumeImportDialogProps) {
  const [isResuming, setIsResuming] = useState(false);
  const [isStartingFresh, setIsStartingFresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!checkpoint) {
    return null;
  }

  // Check if checkpoint is stale (> 24 hours old)
  const checkpointAge =
    new Date().getTime() - new Date(checkpoint.lastUpdated).getTime();
  const isStale = checkpointAge > 24 * 60 * 60 * 1000; // 24 hours
  const ageHours = Math.floor(checkpointAge / 1000 / 60 / 60);

  const handleResume = async () => {
    setIsResuming(true);
    setError(null);
    try {
      await onResume();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume import');
    } finally {
      setIsResuming(false);
    }
  };

  const handleStartFresh = async () => {
    setIsStartingFresh(true);
    setError(null);
    try {
      await onStartFresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start fresh import'
      );
    } finally {
      setIsStartingFresh(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resume Interrupted Import</DialogTitle>
          <DialogDescription>
            An incomplete import was detected. You can resume from the last
            checkpoint or start a new import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stale Checkpoint Warning */}
          {isStale && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This checkpoint is {ageHours} hours old. Consider starting fresh
                if the data may be outdated.
              </AlertDescription>
            </Alert>
          )}

          {/* Checkpoint Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Checkpoint Details
              </CardTitle>
              <CardDescription>
                Last saved checkpoint information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phase:</span>
                <span className="font-medium">{checkpoint.phase}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Batch:</span>
                <span className="font-medium">{checkpoint.batch}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{checkpoint.progress}%</span>
              </div>
              {checkpoint.processedCount !== undefined &&
                checkpoint.totalCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entities:</span>
                    <span className="font-medium">
                      {checkpoint.processedCount} / {checkpoint.totalCount}
                    </span>
                  </div>
                )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last saved:
                </span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(checkpoint.lastUpdated), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleStartFresh}
            disabled={isResuming || isStartingFresh}
            className="w-full sm:w-auto"
          >
            {isStartingFresh ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Fresh
              </>
            )}
          </Button>
          <Button
            onClick={handleResume}
            disabled={isResuming || isStartingFresh}
            className="w-full sm:w-auto"
          >
            {isResuming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume from Checkpoint
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
