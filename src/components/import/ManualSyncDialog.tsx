'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useManualSync, ManualSyncParams } from '@/hooks/useImportControls';
import { RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManualSyncDialogProps {
  entityType?: 'player' | 'tournament' | 'game' | 'club';
  entityId?: string;
  entityName?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ManualSyncDialog({
  entityType: initialEntityType,
  entityId: initialEntityId,
  entityName,
  trigger,
  onSuccess,
}: ManualSyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<ManualSyncParams['entityType']>(
    initialEntityType || 'player'
  );
  const [entityId, setEntityId] = useState(initialEntityId || '');
  const [syncOptions, setSyncOptions] = useState<
    Required<NonNullable<ManualSyncParams['syncOptions']>>
  >({
    includeStats: true,
    includeHistory: false,
    includeGames: true,
    includeMembers: true,
  });

  const manualSync = useManualSync();
  type ManualSyncStats = { yearsSynced?: number };
  const manualSyncStats = React.useMemo<ManualSyncStats | undefined>(() => {
    const payload = manualSync.data?.data;
    if (payload && typeof payload === 'object') {
      const stats = (payload as { stats?: unknown }).stats;
      if (stats && typeof stats === 'object') {
        return stats as ManualSyncStats;
      }
    }
    return undefined;
  }, [manualSync.data]);

  const handleSync = async () => {
    if (!entityId.trim()) {
      return;
    }

    try {
      const result = await manualSync.mutateAsync({
        entityType,
        entityId: entityId.trim(),
        syncOptions,
      });

      if (result.success) {
        setTimeout(() => {
          setOpen(false);
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error('Sync failed:', error);
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'player':
        return 'Player';
      case 'tournament':
        return 'Tournament';
      case 'game':
        return 'Game';
      case 'club':
        return 'Club';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync from gomafia.pro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Entity Sync</DialogTitle>
          <DialogDescription>
            Sync a specific entity from gomafia.pro. This will fetch the latest
            data and update the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select
              value={entityType}
              onValueChange={(value) =>
                setEntityType(value as ManualSyncParams['entityType'])
              }
              disabled={!!initialEntityType}
            >
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="club">Club</SelectItem>
                <SelectItem value="game">Game</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity ID Input */}
          <div className="space-y-2">
            <Label htmlFor="entity-id">
              {getEntityTypeLabel(entityType)} ID (gomafiaId)
            </Label>
            <Input
              id="entity-id"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder={`Enter ${getEntityTypeLabel(entityType).toLowerCase()} gomafiaId`}
              disabled={!!initialEntityId || manualSync.isPending}
            />
            {entityName && (
              <p className="text-sm text-muted-foreground">
                Syncing: <span className="font-medium">{entityName}</span>
              </p>
            )}
          </div>

          {/* Sync Options */}
          <div className="space-y-3">
            <Label>Sync Options</Label>
            <div className="space-y-2">
              {entityType === 'player' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-stats"
                      checked={syncOptions.includeStats}
                      onCheckedChange={(checked) =>
                        setSyncOptions({
                          ...syncOptions,
                          includeStats: !!checked,
                        })
                      }
                      disabled={manualSync.isPending}
                    />
                    <Label
                      htmlFor="include-stats"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Include year statistics
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-history"
                      checked={syncOptions.includeHistory}
                      onCheckedChange={(checked) =>
                        setSyncOptions({
                          ...syncOptions,
                          includeHistory: !!checked,
                        })
                      }
                      disabled={manualSync.isPending}
                    />
                    <Label
                      htmlFor="include-history"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Include tournament history
                    </Label>
                  </div>
                </>
              )}

              {entityType === 'tournament' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-games"
                    checked={syncOptions.includeGames}
                    onCheckedChange={(checked) =>
                      setSyncOptions({
                        ...syncOptions,
                        includeGames: !!checked,
                      })
                    }
                    disabled={manualSync.isPending}
                  />
                  <Label
                    htmlFor="include-games"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include tournament games
                  </Label>
                </div>
              )}

              {entityType === 'club' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-members"
                    checked={syncOptions.includeMembers}
                    onCheckedChange={(checked) =>
                      setSyncOptions({
                        ...syncOptions,
                        includeMembers: !!checked,
                      })
                    }
                    disabled={manualSync.isPending}
                  />
                  <Label
                    htmlFor="include-members"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include club members
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {manualSync.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {manualSync.error?.message || 'Failed to sync entity'}
              </AlertDescription>
            </Alert>
          )}

          {manualSync.isSuccess && manualSync.data?.success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {manualSync.data.message}
                {manualSyncStats && (
                  <div className="mt-2 text-sm">
                    <p>
                      Synced {manualSyncStats.yearsSynced || 0} years of
                      statistics
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={manualSync.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={!entityId.trim() || manualSync.isPending}
          >
            {manualSync.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
