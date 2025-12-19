/**
 * Hook for fetching performance trends using TanStack Query
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  PerformanceTrendsResponse,
  DateRange,
  TrendPeriod,
  PlayerRole,
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
 * Fetch performance trends from API
 */
async function fetchPerformanceTrends(
  playerId: string,
  period: TrendPeriod,
  dateRange?: DateRange,
  roles?: PlayerRole[]
): Promise<PerformanceTrendsResponse> {
  const params = new URLSearchParams();

  // Add period (required)
  params.append('period', period);

  if (dateRange?.startDate) {
    params.append('startDate', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    params.append('endDate', dateRange.endDate);
  }
  if (dateRange?.preset) {
    params.append('dateRangePreset', dateRange.preset);
  }
  if (roles && roles.length > 0) {
    params.append('roles', roles.join(','));
  }

  const url = `/api/players/${playerId}/analytics/trends${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Failed to fetch performance trends',
    }));
    throw new ApiError(
      error.error || 'Failed to fetch performance trends',
      response.status
    );
  }

  return response.json();
}

/**
 * Hook to fetch performance trends for a player
 *
 * @param playerId - Player ID
 * @param period - Aggregation period ('week', 'month', 'quarter')
 * @param dateRange - Optional date range filter
 * @param roles - Optional list of roles to filter by
 * @returns TanStack Query result with performance trends
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePerformanceTrends(
 *   playerId,
 *   'month',
 *   dateRange,
 *   ['DON', 'MAFIA']
 * );
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <TrendsChart trends={data.trends} comparison={data.comparison} />;
 * ```
 */
export function usePerformanceTrends(
  playerId: string,
  period: TrendPeriod,
  dateRange?: DateRange,
  roles?: PlayerRole[]
) {
  return useQuery({
    queryKey: ['performanceTrends', playerId, period, dateRange, roles],
    queryFn: () => fetchPerformanceTrends(playerId, period, dateRange, roles),
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
