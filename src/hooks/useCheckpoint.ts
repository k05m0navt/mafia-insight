'use client';

import { useQuery } from '@tanstack/react-query';
import type { CheckpointInfo } from '@/components/import/ResumeImportDialog';

/**
 * Hook to fetch checkpoint information for resume capability.
 */
export function useCheckpoint(enabled: boolean = true) {
  return useQuery<CheckpointInfo | null>({
    queryKey: ['checkpoint'],
    queryFn: async () => {
      const response = await fetch('/api/gomafia-sync/import/checkpoint');
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No checkpoint exists
        }
        throw new Error('Failed to fetch checkpoint');
      }
      const data = await response.json();
      return data.checkpoint || null;
    },
    enabled,
    refetchInterval: (query) => {
      // Only poll if no checkpoint exists and import is not running
      return query.state.data === null ? 5000 : false;
    },
  });
}
