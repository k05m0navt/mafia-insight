'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorSummary } from '@/lib/gomafia/import/error-summary-tracker';

export interface ImportErrorSummaryResponse {
  syncLogId: string;
  status: string;
  startTime: string;
  endTime: string | null;
  errorSummary: ErrorSummary;
  message: string;
}

async function fetchImportErrorSummary(): Promise<ImportErrorSummaryResponse> {
  const response = await fetch('/api/gomafia-sync/import/errors', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Return empty error summary if no sync log found
      return {
        syncLogId: '',
        status: 'NOT_FOUND',
        startTime: new Date().toISOString(),
        endTime: null,
        errorSummary: {
          totalErrors: 0,
          errorsByCategory: {
            transient: 0,
            permanent: 0,
          },
          errorsByType: {},
          skippedEntitiesByPhase: {},
          recentErrors: [],
        },
        message: 'No sync log found',
      };
    }
    throw new Error('Failed to fetch error summary');
  }

  return response.json();
}

/**
 * Hook to fetch and monitor import error summary with automatic polling.
 * Polls every 2 seconds when import is running (based on import status).
 *
 * @param isImportRunning Whether the import is currently running (used to determine polling interval)
 *
 * @example
 * ```tsx
 * const { data: importStatus } = useImportStatus();
 * const { data: errorSummary, isLoading, error } = useImportErrorSummary(importStatus?.isRunning);
 *
 * if (isLoading) return <div>Loading error summary...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <p>Total Errors: {errorSummary.errorSummary.totalErrors}</p>
 *     <p>Transient: {errorSummary.errorSummary.errorsByCategory.transient}</p>
 *     <p>Permanent: {errorSummary.errorSummary.errorsByCategory.permanent}</p>
 *   </div>
 * );
 * ```
 */
export function useImportErrorSummary(isImportRunning?: boolean) {
  return useQuery({
    queryKey: ['importErrorSummary'],
    queryFn: fetchImportErrorSummary,
    refetchInterval: (query) => {
      // Poll every 2 seconds when import is running
      // Poll every 10 seconds when idle to keep data fresh
      return (isImportRunning ?? query.state.data?.status === 'RUNNING')
        ? 2000
        : 10000;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache data (formerly cacheTime in v4)
  });
}
