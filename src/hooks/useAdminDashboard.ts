import { useQuery } from '@tanstack/react-query';

export interface DashboardMetrics {
  dataVolumes: {
    totalPlayers: number;
    totalGames: number;
    totalTournaments: number;
    totalClubs: number;
  };
  importStatus: {
    isRunning: boolean;
    progress: number | null;
    lastSyncTime: Date | null;
    lastSyncType: string | null;
    currentOperation: string | null;
    lastError: string | null;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'down';
    databaseConnected: boolean;
    errorsLast24h: number;
    message: string;
  };
  recentActivity: {
    imports: Array<{
      id: string;
      type: string;
      status: string;
      startTime: string;
      endTime: string | null;
      recordsProcessed: number | null;
    }>;
  };
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch('/api/admin/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }
  return response.json();
}

/**
 * Hook for fetching admin dashboard metrics with real-time polling
 */
export function useAdminDashboard(options?: {
  pollInterval?: number;
  enabled?: boolean;
}) {
  const { pollInterval = 5000, enabled = true } = options || {};

  return useQuery<DashboardMetrics>({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: pollInterval,
    staleTime: 3000,
    enabled,
  });
}
