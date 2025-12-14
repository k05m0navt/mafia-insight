'use client';

import { useQuery } from '@tanstack/react-query';

export interface ValidationError {
  entity: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface IntegritySummary {
  status: 'PASS' | 'FAIL';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  message: string;
  issues?: string[];
}

export interface ValidationSummary {
  validationRate: number | null;
  meetsThreshold: boolean;
  totalRecords: number | null;
  validRecords: number | null;
  invalidRecords: number | null;
  errorsByEntity: Record<string, number>;
  errors: ValidationError[];
  integrity?: IntegritySummary;
  lastSync?: {
    id: string;
    endTime: string | null;
    recordsProcessed: number | null;
    errors: unknown;
  } | null;
  detailedErrors?: {
    errorSummary?: {
      totalErrors: number;
      errorsByPhase: Record<string, number>;
      errorsByCode: Record<string, number>;
      criticalErrors: number;
      retriedErrors: number;
    };
    skippedPages?: Record<string, number[]>;
    integrity?: unknown;
    message?: string;
    errors?: Array<{
      code?: string;
      message?: string;
      phase?: string;
      context?: Record<string, unknown>;
      timestamp?: string;
      willRetry?: boolean;
    }>;
  } | null;
  recentSyncId: string | null;
  recentSyncStatus: string | null;
}

async function fetchValidationSummary(): Promise<ValidationSummary> {
  const response = await fetch('/api/gomafia-sync/import/validation', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch validation summary');
  }

  const data = await response.json();

  return {
    validationRate: data.validationRate ?? null,
    meetsThreshold: data.meetsThreshold ?? false,
    totalRecords: data.totalRecords ?? null,
    validRecords: data.validRecords ?? null,
    invalidRecords: data.invalidRecords ?? null,
    errorsByEntity: data.errorsByEntity ?? {},
    errors: data.errors ?? [],
    integrity: data.integrity,
    lastSync: data.lastSync,
    detailedErrors: data.detailedErrors,
    recentSyncId: data.recentSyncId ?? null,
    recentSyncStatus: data.recentSyncStatus ?? null,
  };
}

/**
 * Hook to fetch and monitor validation summary with automatic polling.
 * Polls every 2 seconds when import is running (Task 8: AC #3).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useValidationSummary();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <p>Validation Rate: {data?.validationRate}%</p>
 *     <p>Meets Threshold: {data?.meetsThreshold ? 'Yes' : 'No'}</p>
 *     <p>Total Records: {data?.totalRecords}</p>
 *     <p>Valid: {data?.validRecords}, Invalid: {data?.invalidRecords}</p>
 *   </div>
 * );
 * ```
 */
export function useValidationSummary() {
  return useQuery({
    queryKey: ['validationSummary'],
    queryFn: fetchValidationSummary,
    refetchInterval: (query) => {
      // Poll every 2 seconds (2000ms) when import is running
      // Check if import is running by checking recentSyncStatus
      const isRunning =
        query.state.data?.recentSyncStatus === 'RUNNING' ||
        query.state.data?.recentSyncStatus === 'IN_PROGRESS';
      return isRunning ? 2000 : 5000; // Poll every 2s when running, 5s when idle
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache data
  });
}
