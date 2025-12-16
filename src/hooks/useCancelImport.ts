'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CancelImportResponse {
  success: boolean;
  message: string;
}

interface CancelImportError {
  error: string;
  code?: string;
  details?: {
    message?: string;
  };
}

/**
 * Hook for canceling a running import operation.
 * Calls DELETE /api/gomafia-sync/import to gracefully cancel the import.
 */
export function useCancelImport() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CancelImportResponse, CancelImportError, void>({
    mutationFn: async () => {
      const response = await fetch('/api/gomafia-sync/import', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          error: errorData.error || 'Failed to cancel import',
          code: errorData.code || 'UNKNOWN_ERROR',
          details: errorData.details,
        };
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch import progress to update UI
      queryClient.invalidateQueries({ queryKey: ['importProgress'] });
      queryClient.invalidateQueries({ queryKey: ['import-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });

  return {
    cancelImport: mutation.mutate,
    cancelImportAsync: mutation.mutateAsync,
    isCancelling: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}
