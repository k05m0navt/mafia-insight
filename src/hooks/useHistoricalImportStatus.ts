import { useQuery } from '@tanstack/react-query';

interface HistoricalImportStatus {
  jobId: string;
  percentageComplete: number;
  currentGameNumber: number;
  totalGames: number;
  estimatedTimeRemaining: number | null;
  currentPhase: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentOperation: string | null;
  lastError: string | null;
  startTime: string;
  endTime: string | null;
}

/**
 * Hook for polling historical import status.
 * Polls every 2 seconds when import is running.
 */
export function useHistoricalImportStatus(jobId: string | null) {
  return useQuery<HistoricalImportStatus>({
    queryKey: ['historical-import-status', jobId],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const response = await fetch(
        `/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch import status');
      }

      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll every 2 seconds when import is running
      const data = query.state.data as HistoricalImportStatus | undefined;
      if (data?.status === 'running') {
        return 2000; // 2 seconds
      }
      // Stop polling when completed or failed
      return false;
    },
    staleTime: 0, // Always consider data stale to ensure fresh polling
  });
}
