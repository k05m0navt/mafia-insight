'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface TriggerImportOptions {
  forceRestart?: boolean;
}

export interface TriggerImportResponse {
  success: boolean;
  message: string;
  syncLogId: string;
  estimatedDuration?: string;
  note?: string;
}

export interface CancelImportResponse {
  success: boolean;
  message: string;
}

async function triggerImport(
  options: TriggerImportOptions = {}
): Promise<TriggerImportResponse> {
  const response = await fetch('/api/gomafia-sync/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to trigger import');
  }

  return data;
}

async function cancelImport(): Promise<CancelImportResponse> {
  const response = await fetch('/api/gomafia-sync/import', {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to cancel import');
  }

  return data;
}

/**
 * Hook to trigger and cancel import with mutation support.
 * Automatically invalidates import status query on success.
 *
 * @example
 * ```tsx
 * const { trigger, cancel, isPending, isSuccess, error, reset } = useImportTrigger();
 *
 * return (
 *   <div>
 *     <button
 *       onClick={() => trigger()}
 *       disabled={isPending}
 *     >
 *       {isPending ? 'Starting...' : 'Start Import'}
 *     </button>
 *     <button
 *       onClick={() => cancel()}
 *       disabled={!isPending}
 *     >
 *       Cancel Import
 *     </button>
 *     {isSuccess && <p>Import started successfully!</p>}
 *     {error && <p>Error: {error.message}</p>}
 *   </div>
 * );
 * ```
 */
export function useImportTrigger() {
  const queryClient = useQueryClient();

  const triggerMutation = useMutation({
    mutationFn: triggerImport,
    onSuccess: () => {
      // Invalidate and refetch import status immediately
      queryClient.invalidateQueries({ queryKey: ['importStatus'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelImport,
    onSuccess: () => {
      // Invalidate and refetch import status immediately
      queryClient.invalidateQueries({ queryKey: ['importStatus'] });
    },
  });

  return {
    trigger: triggerMutation.mutate,
    triggerAsync: triggerMutation.mutateAsync,
    cancel: cancelMutation.mutate,
    cancelAsync: cancelMutation.mutateAsync,
    isPending: triggerMutation.isPending,
    isSuccess: triggerMutation.isSuccess,
    isError: triggerMutation.isError,
    error: triggerMutation.error,
    data: triggerMutation.data,
    reset: triggerMutation.reset,
  };
}
