'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { ImportProgressResponse } from '@/app/api/gomafia-sync/import/progress/route';

async function fetchImportProgress(): Promise<ImportProgressResponse> {
  const response = await fetch('/api/gomafia-sync/import/progress', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch import progress');
  }

  return response.json();
}

/**
 * Hook to fetch and monitor import progress with automatic polling.
 * Supports both polling (2 second interval) and SSE (if useSSE is true).
 *
 * @param useSSE Whether to use Server-Sent Events for real-time updates (default: false, uses polling)
 * @returns Query result with progress data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useImportProgress();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <p>Phase: {data?.currentPhase}</p>
 *     <p>Progress: {data?.progress}%</p>
 *     <p>Processed: {data?.processedCount} / {data?.totalCount}</p>
 *   </div>
 * );
 * ```
 */
export function useImportProgress(useSSE: boolean = false) {
  const [progressData, setProgressData] =
    useState<ImportProgressResponse | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [sseError, setSseError] = useState<Error | null>(null);

  // Polling-based query (default)
  const queryResult = useQuery({
    queryKey: ['importProgress'],
    queryFn: fetchImportProgress,
    refetchInterval: (query) => {
      // Poll every 2 seconds when import is running
      // Poll every 5 seconds when idle to keep data fresh
      return query.state.data?.isRunning ? 2000 : 5000;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache data (formerly cacheTime in v4)
    enabled: !useSSE, // Only use polling if SSE is disabled
  });

  // SSE-based updates
  useEffect(() => {
    if (!useSSE) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(
      '/api/gomafia-sync/import/progress/stream'
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ImportProgressResponse;
        setProgressData(data);
        setSseError(null);

        // Close connection if import is not running
        if (!data.isRunning) {
          eventSource.close();
        }
      } catch (error) {
        console.error('[useImportProgress] Failed to parse SSE data:', error);
        setSseError(
          error instanceof Error
            ? error
            : new Error('Failed to parse progress data')
        );
      }
    };

    eventSource.onerror = (error) => {
      console.error('[useImportProgress] SSE error:', error);
      setSseError(new Error('Failed to connect to progress stream'));
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [useSSE]);

  // Return appropriate data based on mode
  if (useSSE) {
    return {
      data: progressData,
      isLoading: progressData === null && sseError === null,
      error: sseError,
      isError: sseError !== null,
      refetch: async () => {
        // For SSE, we can't manually refetch, but we can reconnect
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Trigger reconnection by updating useSSE dependency
        // This is handled by the useEffect
      },
    };
  }

  // Return polling-based query result
  return queryResult;
}
