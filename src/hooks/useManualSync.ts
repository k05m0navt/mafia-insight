'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ManualSyncStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime: string | null;
  lastSyncType: string | null;
  lastError: string | null;
  syncLogId: string | null;
  syncLogStatus: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface ManualSyncResponse {
  success: boolean;
  message: string;
  summary: {
    gamesImported: number;
    gamesUpdated: number;
    errors: number;
  };
}

export interface ManualSyncError {
  success: false;
  error: string;
  message: string;
}

async function fetchManualSyncStatus(): Promise<ManualSyncStatus> {
  const response = await fetch('/api/gomafia-sync/manual/status');
  if (!response.ok) {
    throw new Error('Failed to fetch sync status');
  }
  return response.json();
}

async function triggerManualSync(): Promise<ManualSyncResponse> {
  const response = await fetch('/api/gomafia-sync/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Failed to trigger manual sync'
    );
  }

  return data;
}

/**
 * Hook for manual sync functionality with TanStack Query.
 * Provides mutation for triggering sync and query for sync status with polling.
 *
 * @example
 * ```tsx
 * const { triggerSync, syncStatus, isPending, error } = useManualSync();
 *
 * return (
 *   <div>
 *     <button onClick={() => triggerSync()} disabled={isPending}>
 *       {isPending ? 'Syncing...' : 'Sync Now'}
 *     </button>
 *     {syncStatus?.isRunning && (
 *       <div>Progress: {syncStatus.progress}%</div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useManualSync() {
  const queryClient = useQueryClient();

  // Query for sync status with polling when sync is running
  const {
    data: syncStatus,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<ManualSyncStatus, Error>({
    queryKey: ['manualSyncStatus'],
    queryFn: fetchManualSyncStatus,
    refetchInterval: (query) => {
      // Poll every 2 seconds when sync is running, otherwise don't poll
      const status = query.state.data;
      return status?.isRunning ? 2000 : false;
    },
    staleTime: 0, // Always consider data stale to ensure fresh polling
  });

  // Mutation for triggering manual sync
  const syncMutation = useMutation<ManualSyncResponse, Error>({
    mutationFn: triggerManualSync,
    onSuccess: () => {
      // Immediately invalidate and refetch status to get latest state
      queryClient.invalidateQueries({ queryKey: ['manualSyncStatus'] });
    },
    onError: () => {
      // Still refetch status to get error state
      queryClient.invalidateQueries({ queryKey: ['manualSyncStatus'] });
    },
  });

  return {
    // Sync status query
    syncStatus,
    isLoadingStatus,
    statusError,

    // Sync mutation
    triggerSync: syncMutation.mutate,
    triggerSyncAsync: syncMutation.mutateAsync,
    isPending: syncMutation.isPending,
    isSuccess: syncMutation.isSuccess,
    isError: syncMutation.isError,
    syncError: syncMutation.error,
    syncData: syncMutation.data,

    // Helper: check if sync is currently running
    isRunning: syncStatus?.isRunning ?? false,

    // Helper: get sync progress percentage
    progress: syncStatus?.progress ?? 0,

    // Helper: get current operation message
    currentOperation: syncStatus?.currentOperation ?? null,

    // Helper: get last error
    lastError: syncStatus?.lastError ?? null,
  };
}
