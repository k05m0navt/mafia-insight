import { db } from '@/lib/db';

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  lastSyncTime?: Date;
  lastSyncType?: string;
  isRunning: boolean;
  currentProgress?: number;
  currentOperation?: string;
  errorRate: number;
}

export interface SyncHealthStatus {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  metrics: SyncMetrics;
  recommendations: string[];
}

/**
 * Get current sync metrics
 */
export async function getSyncMetrics(): Promise<SyncMetrics> {
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
      lastSyncTime: syncStatus?.lastSyncTime || undefined,
      lastSyncType: syncStatus?.lastSyncType || undefined,
      isRunning: syncStatus?.isRunning || false,
      currentProgress: syncStatus?.progress || undefined,
      currentOperation: syncStatus?.currentOperation || undefined,
      errorRate,
    };
  } catch (error) {
    console.error('Failed to get sync metrics:', error);
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
 * Get sync health status
 */
export async function getSyncHealthStatus(): Promise<SyncHealthStatus> {
  const metrics = await getSyncMetrics();
  const recommendations: string[] = [];

  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  let message = 'Sync system is operating normally';

  // Check error rate
  if (metrics.errorRate > 50) {
    status = 'CRITICAL';
    message = 'High error rate detected';
    recommendations.push('Investigate recent sync failures');
    recommendations.push('Check network connectivity to gomafia.pro');
  } else if (metrics.errorRate > 20) {
    status = 'WARNING';
    message = 'Elevated error rate detected';
    recommendations.push('Monitor sync operations closely');
  }

  // Check if sync is stuck
  if (metrics.isRunning) {
    const now = new Date();
    const lastUpdate = metrics.lastSyncTime;

    if (
      lastUpdate &&
      now.getTime() - lastUpdate.getTime() > 2 * 60 * 60 * 1000
    ) {
      // 2 hours
      status = 'CRITICAL';
      message = 'Sync appears to be stuck';
      recommendations.push('Restart sync process');
      recommendations.push('Check for deadlocks or infinite loops');
    }
  }

  // Check sync frequency
  if (metrics.lastSyncTime) {
    const hoursSinceLastSync =
      (Date.now() - metrics.lastSyncTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSync > 48) {
      // 48 hours
      status = 'WARNING';
      message = 'Sync has not run recently';
      recommendations.push('Check cron job configuration');
      recommendations.push('Verify sync scheduling');
    }
  }

  // Check average duration
  if (metrics.averageDuration > 30 * 60 * 1000) {
    // 30 minutes
    status = 'WARNING';
    message = 'Sync operations are taking longer than expected';
    recommendations.push('Optimize batch processing');
    recommendations.push('Check database performance');
  }

  return {
    status,
    message,
    metrics,
    recommendations,
  };
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(limit: number = 10) {
  try {
    return await db.syncLog.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to get recent sync logs:', error);
    return [];
  }
}

/**
 * Get sync performance trends
 */
export async function getSyncPerformanceTrends(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const syncLogs = await db.syncLog.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Group by day
    const trends = new Map<
      string,
      {
        date: string;
        totalSyncs: number;
        successfulSyncs: number;
        failedSyncs: number;
        averageDuration: number;
      }
    >();

    for (const log of syncLogs) {
      const date = log.startTime.toISOString().split('T')[0];

      if (!trends.has(date)) {
        trends.set(date, {
          date,
          totalSyncs: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          averageDuration: 0,
        });
      }

      const trend = trends.get(date)!;
      trend.totalSyncs++;

      if (log.status === 'COMPLETED') {
        trend.successfulSyncs++;
      } else if (log.status === 'FAILED') {
        trend.failedSyncs++;
      }

      if (log.endTime) {
        const duration = log.endTime.getTime() - log.startTime.getTime();
        trend.averageDuration = (trend.averageDuration + duration) / 2;
      }
    }

    return Array.from(trends.values());
  } catch (error) {
    console.error('Failed to get sync performance trends:', error);
    return [];
  }
}

/**
 * Monitor sync performance in real-time
 */
export async function monitorSyncPerformance(): Promise<{
  isHealthy: boolean;
  issues: string[];
  metrics: SyncMetrics;
}> {
  const healthStatus = await getSyncHealthStatus();
  const issues: string[] = [];

  if (healthStatus.status === 'CRITICAL') {
    issues.push('Critical sync issues detected');
  }

  if (healthStatus.status === 'WARNING') {
    issues.push('Sync performance warnings');
  }

  if (healthStatus.metrics.errorRate > 20) {
    issues.push(
      `High error rate: ${healthStatus.metrics.errorRate.toFixed(1)}%`
    );
  }

  if (
    healthStatus.metrics.isRunning &&
    healthStatus.metrics.currentProgress !== undefined
  ) {
    if (healthStatus.metrics.currentProgress === 0) {
      issues.push('Sync appears to be stuck at 0% progress');
    }
  }

  return {
    isHealthy: healthStatus.status === 'HEALTHY',
    issues,
    metrics: healthStatus.metrics,
  };
}

/**
 * Get sync statistics for dashboard
 */
export async function getSyncDashboardData() {
  try {
    const [metrics, healthStatus, recentLogs, trends] = await Promise.all([
      getSyncMetrics(),
      getSyncHealthStatus(),
      getRecentSyncLogs(5),
      getSyncPerformanceTrends(7),
    ]);

    return {
      metrics,
      healthStatus,
      recentLogs,
      trends,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Failed to get sync dashboard data:', error);
    return {
      metrics: await getSyncMetrics(),
      healthStatus: {
        status: 'CRITICAL',
        message: 'Failed to load data',
        metrics: await getSyncMetrics(),
        recommendations: [],
      },
      recentLogs: [],
      trends: [],
      lastUpdated: new Date(),
    };
  }
}
