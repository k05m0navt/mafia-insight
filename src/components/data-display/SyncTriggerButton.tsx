'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, ChevronDown } from 'lucide-react';

interface SyncTriggerButtonProps {
  onTrigger: (type: 'FULL' | 'INCREMENTAL') => Promise<void>;
  disabled?: boolean;
}

export function SyncTriggerButton({
  onTrigger,
  disabled = false,
}: SyncTriggerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleTrigger = async (type: 'FULL' | 'INCREMENTAL') => {
    setIsLoading(true);
    setMessage(null);

    try {
      await onTrigger(type);
      setMessage({
        type: 'success',
        text: `${type} sync triggered successfully`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to trigger sync',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled || isLoading}
            data-testid="sync-trigger-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Triggering...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Trigger Sync
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleTrigger('FULL')}
            disabled={isLoading}
          >
            <div className="flex flex-col">
              <span className="font-medium">Full Sync</span>
              <span className="text-xs text-muted-foreground">
                Sync all data from gomafia.pro
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleTrigger('INCREMENTAL')}
            disabled={isLoading}
          >
            <div className="flex flex-col">
              <span className="font-medium">Incremental Sync</span>
              <span className="text-xs text-muted-foreground">
                Sync only changed data
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription data-testid={`sync-${message.type}-message`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
