'use client';

import { useQuery } from '@tanstack/react-query';

export interface ImportStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime: string | null;
  lastSyncType: string | null;
  lastError: string | null;
  syncLogId: string | null;
  validation: {
    validationRate: number | null;
    totalRecordsProcessed: number | null;
    validRecords: number | null;
    invalidRecords: number | null;
  };
  summary: {
    players: number;
    clubs: number;
    games: number;
    tournaments: number;
  };
}

async function fetchImportStatus(): Promise<ImportStatus> {
  const response = await fetch('/api/gomafia-sync/import');

  if (!response.ok) {
    throw new Error('Failed to fetch import status');
  }

  return response.json();
}

/**
 * Hook to fetch and monitor import status with automatic polling.
 * Polls every 2 seconds when import is running.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useImportStatus();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <p>Status: {data.isRunning ? 'Running' : 'Idle'}</p>
 *     <p>Progress: {data.progress}%</p>
 *     <p>Operation: {data.currentOperation}</p>
 *     <p>Players: {data.summary.players}</p>
 *   </div>
 * );
 * ```
 */
export function useImportStatus() {
  return useQuery({
    queryKey: ['importStatus'],
    queryFn: fetchImportStatus,
    refetchInterval: (query) => {
      // Poll every 2 seconds (2000ms) when import is running
      // Disable polling when idle
      return query.state.data?.isRunning ? 2000 : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000, // Consider data stale after 1 second
  });
}
