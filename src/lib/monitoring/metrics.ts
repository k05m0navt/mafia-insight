import { db } from '@/lib/db';

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  errorRate: number;
  lastSyncTime?: Date;
  lastSyncType?: string;
  isRunning: boolean;
  currentProgress?: number;
  currentOperation?: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface DatabaseMetrics {
  totalPlayers: number;
  totalGames: number;
  totalSyncLogs: number;
  databaseSize: number;
  connectionPoolSize: number;
  activeConnections: number;
}

/**
 * Collect sync metrics
 */
export async function collectSyncMetrics(): Promise<SyncMetrics> {
  try {
    // Get sync status
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    // Get sync logs for metrics
    const syncLogs = await db.syncLog.findMany({
      orderBy: { startTime: 'desc' },
      take: 100, // Last 100 syncs
    });

    const totalSyncs = syncLogs.length;
    const successfulSyncs = syncLogs.filter(
      (log) => log.status === 'COMPLETED'
    ).length;
    const failedSyncs = syncLogs.filter(
      (log) => log.status === 'FAILED'
    ).length;

    const completedSyncs = syncLogs.filter(
      (log) => log.status === 'COMPLETED' && log.endTime
    );
    const averageDuration =
      completedSyncs.length > 0
        ? completedSyncs.reduce((sum, log) => {
            const duration = log.endTime!.getTime() - log.startTime.getTime();
            return sum + duration;
          }, 0) / completedSyncs.length
        : 0;

    const errorRate = totalSyncs > 0 ? (failedSyncs / totalSyncs) * 100 : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageDuration,
      errorRate,
      lastSyncTime: syncStatus?.lastSyncTime || undefined,
      lastSyncType: syncStatus?.lastSyncType || undefined,
      isRunning: syncStatus?.isRunning || false,
      currentProgress: syncStatus?.progress || undefined,
      currentOperation: syncStatus?.currentOperation || undefined,
    };
  } catch (error) {
    console.error('Failed to collect sync metrics:', error);
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageDuration: 0,
      errorRate: 0,
      isRunning: false,
    };
  }
}

/**
 * Collect performance metrics
 */
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const startTime = process.hrtime();

    // Simulate some work to measure performance
    await new Promise((resolve) => setTimeout(resolve, 1));

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Get uptime
    const uptime = process.uptime();

    return {
      averageResponseTime: responseTime,
      requestsPerSecond: 0, // Would need to track this over time
      errorRate: 0, // Would need to track this over time
      uptime,
      memoryUsage: memoryUsageMB,
      cpuUsage: 0, // Would need to track this over time
    };
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return {
      averageResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }
}

/**
 * Collect database metrics
 */
export async function collectDatabaseMetrics(): Promise<DatabaseMetrics> {
  try {
    const [totalPlayers, totalGames, totalSyncLogs] = await Promise.all([
      db.player.count(),
      db.game.count(),
      db.syncLog.count(),
    ]);

    return {
      totalPlayers,
      totalGames,
      totalSyncLogs,
      databaseSize: 0, // Would need to query database size
      connectionPoolSize: 0, // Would need to get from connection pool
      activeConnections: 0, // Would need to get from connection pool
    };
  } catch (error) {
    console.error('Failed to collect database metrics:', error);
    return {
      totalPlayers: 0,
      totalGames: 0,
      totalSyncLogs: 0,
      databaseSize: 0,
      connectionPoolSize: 0,
      activeConnections: 0,
    };
  }
}

/**
 * Collect all metrics
 */
export async function collectAllMetrics(): Promise<{
  sync: SyncMetrics;
  performance: PerformanceMetrics;
  database: DatabaseMetrics;
  timestamp: Date;
}> {
  const [sync, performance, database] = await Promise.all([
    collectSyncMetrics(),
    collectPerformanceMetrics(),
    collectDatabaseMetrics(),
  ]);

  return {
    sync,
    performance,
    database,
    timestamp: new Date(),
  };
}

/**
 * Get metrics for dashboard
 */
export async function getDashboardMetrics(): Promise<{
  sync: SyncMetrics;
  performance: PerformanceMetrics;
  database: DatabaseMetrics;
  health: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    message: string;
    recommendations: string[];
  };
}> {
  const metrics = await collectAllMetrics();

  // Determine health status
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  let message = 'System is operating normally';
  const recommendations: string[] = [];

  // Check sync health
  if (metrics.sync.errorRate > 50) {
    status = 'CRITICAL';
    message = 'High sync error rate detected';
    recommendations.push('Investigate recent sync failures');
  } else if (metrics.sync.errorRate > 20) {
    status = 'WARNING';
    message = 'Elevated sync error rate';
    recommendations.push('Monitor sync operations closely');
  }

  // Check performance
  if (metrics.performance.memoryUsage > 1000) {
    // 1GB
    status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
    message = 'High memory usage detected';
    recommendations.push('Monitor memory usage');
  }

  // Check database
  if (metrics.database.totalPlayers === 0 && metrics.sync.totalSyncs > 0) {
    status = 'WARNING';
    message = 'No players found despite sync operations';
    recommendations.push('Check data synchronization');
  }

  return {
    ...metrics,
    health: {
      status,
      message,
      recommendations,
    },
  };
}

/**
 * Export metrics for external monitoring
 */
export async function exportMetrics(): Promise<string> {
  const metrics = await collectAllMetrics();

  // Format as Prometheus metrics
  const prometheusMetrics = [
    `# HELP sync_total Total number of sync operations`,
    `# TYPE sync_total counter`,
    `sync_total ${metrics.sync.totalSyncs}`,
    '',
    `# HELP sync_successful Total number of successful sync operations`,
    `# TYPE sync_successful counter`,
    `sync_successful ${metrics.sync.successfulSyncs}`,
    '',
    `# HELP sync_failed Total number of failed sync operations`,
    `# TYPE sync_failed counter`,
    `sync_failed ${metrics.sync.failedSyncs}`,
    '',
    `# HELP sync_error_rate Sync error rate percentage`,
    `# TYPE sync_error_rate gauge`,
    `sync_error_rate ${metrics.sync.errorRate}`,
    '',
    `# HELP sync_average_duration Average sync duration in milliseconds`,
    `# TYPE sync_average_duration gauge`,
    `sync_average_duration ${metrics.sync.averageDuration}`,
    '',
    `# HELP memory_usage Memory usage in MB`,
    `# TYPE memory_usage gauge`,
    `memory_usage ${metrics.performance.memoryUsage}`,
    '',
    `# HELP uptime System uptime in seconds`,
    `# TYPE uptime gauge`,
    `uptime ${metrics.performance.uptime}`,
    '',
    `# HELP database_players Total number of players`,
    `# TYPE database_players gauge`,
    `database_players ${metrics.database.totalPlayers}`,
    '',
    `# HELP database_games Total number of games`,
    `# TYPE database_games gauge`,
    `database_games ${metrics.database.totalGames}`,
  ];

  return prometheusMetrics.join('\n');
}
