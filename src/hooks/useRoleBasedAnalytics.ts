/**
 * Hook for fetching role-based analytics using TanStack Query
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  RoleBasedAnalyticsResponse,
  DateRange,
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
 * Fetch role-based analytics from API
 */
async function fetchRoleBasedAnalytics(
  playerId: string,
  dateRange?: DateRange,
  roles?: PlayerRole[]
): Promise<RoleBasedAnalyticsResponse> {
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
  if (roles && roles.length > 0) {
    params.append('roles', roles.join(','));
  }

  const url = `/api/players/${playerId}/analytics/role-based${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Failed to fetch role-based analytics',
    }));
    throw new ApiError(
      error.error || 'Failed to fetch role-based analytics',
      response.status
    );
  }

  return response.json();
}

/**
 * Hook to fetch role-based analytics for a player
 *
 * @param playerId - Player ID
 * @param dateRange - Optional date range filter
 * @param roles - Optional list of roles to filter by
 * @returns TanStack Query result with role metrics
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useRoleBasedAnalytics(playerId, dateRange, roles);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <RoleMetricsDisplay roleMetrics={data.roleMetrics} />;
 * ```
 */
export function useRoleBasedAnalytics(
  playerId: string,
  dateRange?: DateRange,
  roles?: PlayerRole[]
) {
  return useQuery({
    queryKey: ['roleBasedAnalytics', playerId, dateRange, roles],
    queryFn: () => fetchRoleBasedAnalytics(playerId, dateRange, roles),
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
