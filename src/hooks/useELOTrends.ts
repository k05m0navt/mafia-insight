/**
 * Hook for fetching ELO trends using TanStack Query
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  ELOTrendsResponse,
  DateRange,
  ELOTrendPeriod,
} from '@/types/analytics';

/**
 * Custom error class for API errors with status code
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch ELO trends from API
 */
async function fetchELOTrends(
  playerId: string,
  dateRange?: DateRange,
  period?: ELOTrendPeriod
): Promise<ELOTrendsResponse> {
  const params = new URLSearchParams();

  if (dateRange?.startDate) {
    params.append('startDate', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    params.append('endDate', dateRange.endDate);
  }
  if (dateRange?.preset) {
    params.append('dateRangePreset', dateRange.preset);
  }
  if (period) {
    params.append('period', period);
  }

  const url = `/api/players/${playerId}/analytics/elo-trends${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Failed to fetch ELO trends',
    }));
    throw new ApiError(
      error.error || 'Failed to fetch ELO trends',
      response.status
    );
  }

  return response.json();
}

/**
 * Hook to fetch ELO trends for a player
 *
 * @param playerId - Player ID
 * @param dateRange - Optional date range filter
 * @param period - Optional aggregation period ('day', 'week', 'month')
 * @returns TanStack Query result with ELO trends
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useELOTrends(playerId, dateRange, 'week');
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <ELOTrendsChart trends={data.trends} currentELO={data.currentELO} />;
 * ```
 */
export function useELOTrends(
  playerId: string,
  dateRange?: DateRange,
  period?: ELOTrendPeriod
) {
  return useQuery({
    queryKey: ['eloTrends', playerId, dateRange, period],
    queryFn: () => fetchELOTrends(playerId, dateRange, period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      // Don't retry on 4xx errors (client errors) - these are not retryable
      if (
        error instanceof ApiError &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false,
  });
}
