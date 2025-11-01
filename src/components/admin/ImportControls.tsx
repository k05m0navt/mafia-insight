'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { toast } from '@/components/hooks/use-toast';

export function ImportControls() {
  const { data, refetch } = useAdminDashboard();
  const [isStopping, setIsStopping] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const isImportRunning = data?.importStatus?.isRunning || false;

  const handleStopImport = async () => {
    setIsStopping(true);
    try {
      const response = await fetch('/api/admin/import/stop', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to stop import: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      // Refresh dashboard data
      refetch();
      toast({
        title: 'Success',
        description: 'Import stopped successfully',
      });
    } catch (error) {
      console.error('Failed to stop import:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to stop import. Please try again.',
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/import/clear-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to clear database: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      // Refresh dashboard data
      refetch();
      toast({
        title: 'Success',
        description: 'Database cleared successfully',
      });
    } catch (error) {
      console.error('Failed to clear database:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear database. Please try again.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stop Import Button */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleStopImport}
          disabled={!isImportRunning || isStopping}
        >
          <Square className="mr-2 h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="font-medium">
              {isStopping ? 'Stopping...' : 'Stop Import'}
            </span>
            <span className="text-xs text-muted-foreground">
              {isImportRunning
                ? 'Cancel current import operation'
                : 'No import running'}
            </span>
          </div>
        </Button>

        {/* Clear Database Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full justify-start"
              disabled={isImportRunning || isClearing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {isClearing ? 'Clearing...' : 'Clear Database'}
                </span>
                <span className="text-xs opacity-90">
                  Remove all game data (irreversible)
                </span>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Database?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all imported game data including
                players, clubs, tournaments, and games. User accounts and system
                configuration will be preserved. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearDatabase}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isImportRunning && (
          <p className="text-sm text-amber-600">
            ⚠️ Cannot clear database while import is running
          </p>
        )}
      </CardContent>
    </Card>
  );
}
