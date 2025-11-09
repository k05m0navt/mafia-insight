'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
  useImportStatus,
  usePauseImport,
  useResumeImport,
} from '@/hooks/useImportControls';
import { Pause, Play, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

export function ImportControlPanel() {
  const { data: status, isLoading } = useImportStatus();
  const pauseMutation = usePauseImport();
  const resumeMutation = useResumeImport();
  const [error, setError] = useState<string | null>(null);

  const handlePause = async () => {
    try {
      setError(null);
      await pauseMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause import');
    }
  };

  const handleResume = async () => {
    try {
      setError(null);
      await resumeMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume import');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Controls</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isRunning = status?.isRunning || false;
  const isPaused = status?.isPaused || false;
  const canPause = isRunning && !isPaused;
  const canResume = isPaused;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Controls</CardTitle>
        <CardDescription>
          Pause or resume the import process. Checkpoint is saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          {canPause && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={pauseMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="pause-import-button"
                >
                  {pauseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause Import
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pause Import?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The import will be paused and a checkpoint will be saved.
                    You can resume it later from where it left off.
                    {status?.checkpoint && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm font-medium">
                          Current checkpoint:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phase: {status.checkpoint.phase} | Batch:{' '}
                          {status.checkpoint.batch} | Progress:{' '}
                          {status.checkpoint.progress}%
                        </p>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePause}>
                    Pause Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canResume && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  disabled={resumeMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="resume-import-button"
                >
                  {resumeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume Import
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resume Import?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The import will resume from the last checkpoint.
                    {status?.checkpoint && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm font-medium">
                          Checkpoint details:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phase: {status.checkpoint.phase} | Batch:{' '}
                          {status.checkpoint.batch} | Progress:{' '}
                          {status.checkpoint.progress}%
                        </p>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResume}>
                    Resume Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!isRunning && !isPaused && (
            <div className="text-sm text-muted-foreground">
              No import is currently running or paused.
            </div>
          )}

          {isPaused && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Pause className="h-3 w-3" />
              Paused
            </Badge>
          )}
        </div>

        {status?.checkpoint && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Checkpoint Information</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Phase: {status.checkpoint.phase}</p>
              <p>Batch: {status.checkpoint.batch}</p>
              <p>Progress: {status.checkpoint.progress}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
