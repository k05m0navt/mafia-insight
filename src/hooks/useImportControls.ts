import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ImportStatus {
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  currentOperation: string | null;
  checkpoint?: {
    phase: string;
    batch: number;
    progress: number;
  } | null;
}

interface SkippedEntity {
  id: string;
  phase: string;
  entityType: string;
  entityId: string | null;
  pageNumber: number | null;
  errorCode: string;
  errorMessage: string;
  retryCount: number;
  status: string;
  createdAt: string;
}

interface SkippedEntitiesSummary {
  [phase: string]: {
    total: number;
    pending: number;
    retrying: number;
    completed: number;
    failed: number;
  };
}

/**
 * Hook for fetching import status including pause state
 */
export function useImportStatus() {
  return useQuery<ImportStatus>({
    queryKey: ['import', 'status'],
    queryFn: async () => {
      const [statusResponse, pauseResponse] = await Promise.all([
        fetch('/api/gomafia-sync/import'),
        fetch('/api/gomafia-sync/import/pause'),
      ]);

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch import status');
      }

      const statusData = await statusResponse.json();
      const pauseData = pauseResponse.ok
        ? await pauseResponse.json()
        : { isPaused: false };

      return {
        isRunning: statusData.isRunning || false,
        isPaused: pauseData.isPaused || false,
        progress: statusData.progress || 0,
        currentOperation: statusData.currentOperation || null,
        checkpoint: pauseData.checkpoint || null,
      };
    },
    refetchInterval: (query) => {
      // Refetch every 2 seconds if running, 5 seconds if paused, 10 seconds if idle
      const data = query.state.data;
      if (data?.isRunning && !data?.isPaused) return 2000;
      if (data?.isPaused) return 5000;
      return 10000;
    },
  });
}

/**
 * Hook for pausing the import
 */
export function usePauseImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/gomafia-sync/import/pause', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pause import');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
  });
}

/**
 * Hook for resuming the import
 */
export function useResumeImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/gomafia-sync/import/resume', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume import');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
  });
}

/**
 * Hook for fetching skipped entities
 */
export function useSkippedEntities(phase?: string, status?: string) {
  return useQuery<SkippedEntity[]>({
    queryKey: ['import', 'skipped-entities', phase, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (phase) params.append('phase', phase);
      if (status) params.append('status', status);

      const response = await fetch(
        `/api/gomafia-sync/import/retry?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch skipped entities');
      }

      const data = await response.json();
      return data.entities || [];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook for fetching skipped entities summary
 */
export function useSkippedEntitiesSummary() {
  return useQuery<SkippedEntitiesSummary>({
    queryKey: ['import', 'skipped-entities', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/gomafia-sync/import/retry');

      if (!response.ok) {
        throw new Error('Failed to fetch skipped entities summary');
      }

      const data = await response.json();
      return data.summary || {};
    },
    refetchInterval: 10000,
  });
}

/**
 * Hook for retrying skipped entities
 */
export function useRetrySkippedEntities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      phase: string;
      entityIds?: string[];
      pageNumbers?: number[];
      skippedEntityIds?: string[];
    }) => {
      const response = await fetch('/api/gomafia-sync/import/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retry entities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['import', 'skipped-entities'],
      });
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
  });
}

/**
 * Manual sync request parameters
 */
export interface ManualSyncParams {
  entityType: 'player' | 'tournament' | 'game' | 'club';
  entityId: string;
  syncOptions?: {
    includeStats?: boolean;
    includeHistory?: boolean;
    includeGames?: boolean;
    includeMembers?: boolean;
  };
}

/**
 * Manual sync response
 */
export interface ManualSyncResponse {
  success: boolean;
  message: string;
  entityId?: string;
  data?: unknown;
  errors?: string[];
}

/**
 * Hook for manual entity sync
 */
export function useManualSync() {
  const queryClient = useQueryClient();

  return useMutation<ManualSyncResponse, Error, ManualSyncParams>({
    mutationFn: async (params: ManualSyncParams) => {
      const response = await fetch('/api/gomafia-sync/manual-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync entity');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on entity type
      queryClient.invalidateQueries({ queryKey: ['import'] });

      // Invalidate entity-specific queries
      if (variables.entityType === 'player') {
        queryClient.invalidateQueries({
          queryKey: ['players', variables.entityId],
        });
        queryClient.invalidateQueries({ queryKey: ['players'] });
      } else if (variables.entityType === 'tournament') {
        queryClient.invalidateQueries({
          queryKey: ['tournaments', variables.entityId],
        });
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      } else if (variables.entityType === 'club') {
        queryClient.invalidateQueries({
          queryKey: ['clubs', variables.entityId],
        });
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      }
    },
  });
}
