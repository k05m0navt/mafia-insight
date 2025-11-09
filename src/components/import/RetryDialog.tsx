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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useRetrySkippedEntities,
  useSkippedEntities,
} from '@/hooks/useImportControls';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface RetryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityIds?: string[];
  phase?: string;
  onSuccess?: () => void;
}

export function RetryDialog({
  open,
  onOpenChange,
  entityIds = [],
  phase,
  onSuccess,
}: RetryDialogProps) {
  const [retryMode, setRetryMode] = useState<
    'entities' | 'playerIds' | 'pageNumbers'
  >('entities');
  const [playerIds, setPlayerIds] = useState('');
  const [pageNumbers, setPageNumbers] = useState('');
  const [selectedPhase, setSelectedPhase] = useState(phase || 'PLAYERS');

  const { data: entities } = useSkippedEntities(undefined, undefined);
  const retryMutation = useRetrySkippedEntities();

  const selectedEntities =
    entities?.filter((e) => entityIds.includes(e.id)) || [];

  const handleRetry = async () => {
    try {
      const params: {
        phase: string;
        entityIds?: string[];
        pageNumbers?: number[];
        skippedEntityIds?: string[];
      } = {
        phase: selectedPhase,
      };

      if (retryMode === 'entities' && entityIds.length > 0) {
        params.skippedEntityIds = entityIds;
      } else if (retryMode === 'playerIds' && playerIds.trim()) {
        params.entityIds = playerIds
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
      } else if (retryMode === 'pageNumbers' && pageNumbers.trim()) {
        params.pageNumbers = pageNumbers
          .split(',')
          .map((num) => parseInt(num.trim(), 10))
          .filter((num) => !isNaN(num));
      }

      await retryMutation.mutateAsync(params);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Retry failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Retry Skipped Entities</DialogTitle>
          <DialogDescription>
            Choose how you want to retry the skipped entities. You can retry by
            entity IDs, player IDs, or page numbers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {retryMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {retryMutation.error instanceof Error
                  ? retryMutation.error.message
                  : 'Failed to retry entities'}
              </AlertDescription>
            </Alert>
          )}

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <select
              id="phase"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PLAYERS">Players</option>
              <option value="PLAYER_YEAR_STATS">Player Year Stats</option>
              <option value="TOURNAMENTS">Tournaments</option>
              <option value="GAMES">Games</option>
            </select>
          </div>

          {/* Retry Mode Selection */}
          <div className="space-y-2">
            <Label>Retry Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={retryMode === 'entities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRetryMode('entities')}
                disabled={entityIds.length === 0}
              >
                Selected Entities ({entityIds.length})
              </Button>
              <Button
                type="button"
                variant={retryMode === 'playerIds' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRetryMode('playerIds')}
              >
                Player IDs
              </Button>
              <Button
                type="button"
                variant={retryMode === 'pageNumbers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRetryMode('pageNumbers')}
              >
                Page Numbers
              </Button>
            </div>
          </div>

          {/* Selected Entities Info */}
          {retryMode === 'entities' && selectedEntities.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Entities</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2 max-h-32 overflow-y-auto">
                {selectedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {entity.entityType}
                      </Badge>
                      {entity.entityId && (
                        <span className="font-mono text-xs">
                          {entity.entityId}
                        </span>
                      )}
                      {entity.pageNumber !== null && (
                        <span className="ml-2">Page {entity.pageNumber}</span>
                      )}
                    </div>
                    <Badge variant="secondary">{entity.errorCode}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player IDs Input */}
          {retryMode === 'playerIds' && (
            <div className="space-y-2">
              <Label htmlFor="playerIds">
                Player IDs (gomafiaId) - comma separated
              </Label>
              <Textarea
                id="playerIds"
                placeholder="1401, 867, 91"
                value={playerIds}
                onChange={(e) => setPlayerIds(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Enter player gomafia IDs separated by commas
              </p>
            </div>
          )}

          {/* Page Numbers Input */}
          {retryMode === 'pageNumbers' && (
            <div className="space-y-2">
              <Label htmlFor="pageNumbers">
                Page Numbers - comma separated
              </Label>
              <Input
                id="pageNumbers"
                placeholder="5, 12, 23"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter page numbers separated by commas
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={retryMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRetry}
            disabled={
              retryMutation.isPending ||
              (retryMode === 'entities' && entityIds.length === 0) ||
              (retryMode === 'playerIds' && !playerIds.trim()) ||
              (retryMode === 'pageNumbers' && !pageNumbers.trim())
            }
          >
            {retryMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
