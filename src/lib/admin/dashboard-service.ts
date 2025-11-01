import { db } from '@/lib/db';

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
    lastSyncTime: string | null;
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

/**
 * Get comprehensive dashboard metrics for admin dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Parallel queries for efficiency
  const [
    totalPlayers,
    totalGames,
    totalTournaments,
    totalClubs,
    syncStatus,
    recentImports,
    systemHealth,
  ] = await Promise.all([
    db.player.count(),
    db.game.count(),
    db.tournament.count(),
    db.club.count(),
    db.syncStatus.findUnique({ where: { id: 'current' } }),
    getRecentImports(),
    getSystemHealth(),
  ]);

  return {
    dataVolumes: {
      totalPlayers,
      totalGames,
      totalTournaments,
      totalClubs,
    },
    importStatus: syncStatus
      ? {
          isRunning: syncStatus.isRunning,
          progress: syncStatus.progress,
          lastSyncTime: syncStatus.lastSyncTime?.toISOString() || null,
          lastSyncType: syncStatus.lastSyncType,
          currentOperation: syncStatus.currentOperation,
          lastError: syncStatus.lastError,
        }
      : {
          isRunning: false,
          progress: null,
          lastSyncTime: null,
          lastSyncType: null,
          currentOperation: null,
          lastError: null,
        },
    systemHealth,
    recentActivity: {
      imports: recentImports.map((imp) => ({
        ...imp,
        startTime: imp.startTime.toISOString(),
        endTime: imp.endTime?.toISOString() || null,
      })),
    },
  };
}

/**
 * Get recent import history from both SyncLog and ImportProgress tables
 */
async function getRecentImports() {
  // Fetch from both tables in parallel
  const [syncLogs, importProgress] = await Promise.all([
    db.syncLog.findMany({
      take: 10,
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        startTime: true,
        endTime: true,
        recordsProcessed: true,
      },
    }),
    db.importProgress.findMany({
      take: 10,
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        operation: true,
        status: true,
        startTime: true,
        processedRecords: true,
        totalRecords: true,
      },
    }),
  ]);

  // Merge and normalize the data
  const allImports = [
    // Map SyncLog to import format
    ...syncLogs.map((log) => ({
      id: log.id,
      type: log.type || 'SYNC',
      status: log.status,
      startTime: log.startTime,
      endTime: log.endTime,
      recordsProcessed: log.recordsProcessed,
    })),
    // Map ImportProgress to import format
    ...importProgress.map((imp) => ({
      id: imp.id,
      type: imp.operation || 'IMPORT',
      status: imp.status,
      startTime: imp.startTime,
      endTime: null, // ImportProgress doesn't have endTime
      recordsProcessed: imp.processedRecords,
    })),
  ];

  // Sort by startTime descending and take top 20
  return allImports
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 20);
}

/**
 * Get system health status
 */
async function getSystemHealth(): Promise<DashboardMetrics['systemHealth']> {
  try {
    // Test database connectivity
    await db.$queryRaw`SELECT 1`;

    // Check errors in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const failedImports = await db.syncLog.count({
      where: {
        status: 'FAILED',
        startTime: {
          gte: yesterday,
        },
      },
    });

    return {
      status: failedImports > 0 ? 'degraded' : 'healthy',
      databaseConnected: true,
      errorsLast24h: failedImports,
      message:
        failedImports > 0
          ? `${failedImports} failed import(s) in last 24 hours`
          : 'All systems operational',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'down',
      databaseConnected: false,
      errorsLast24h: 0,
      message: 'System health check failed',
    };
  }
}
