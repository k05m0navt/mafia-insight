'use client';

import { useState, useEffect, useCallback } from 'react';

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime: string | null;
  lastSyncType: string | null;
  lastError: string | null;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  errorRate: number;
}

interface SyncHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  recommendations: string[];
}

interface SyncStatusData {
  status: SyncStatus;
  metrics: SyncMetrics;
  health: SyncHealth;
}

export function useSyncStatus() {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/gomafia-sync/sync/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      const syncData = await response.json();
      setData(syncData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Auto-refresh when sync is running
  useEffect(() => {
    if (!data?.status.isRunning) return;

    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [data?.status.isRunning, fetchSyncStatus]);

  const triggerSync = useCallback(
    async (type: 'FULL' | 'INCREMENTAL') => {
      try {
        const response = await fetch('/api/gomafia-sync/sync/trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to trigger sync');
        }

        // Refresh status after triggering
        await fetchSyncStatus();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    [fetchSyncStatus]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  return {
    data,
    loading,
    error,
    triggerSync,
    refresh,
  };
}
