import { redis } from '@/lib/redis';

const CACHE_PREFIX = 'sync:';
const DEFAULT_TTL = 300; // 5 minutes

export interface SyncCacheData {
  status: {
    isRunning: boolean;
    progress: number;
    currentOperation: string | null;
    lastSyncTime: string | null;
    lastSyncType: string | null;
    lastError: string | null;
  };
  metrics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    errorRate: number;
  };
  health: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    message: string;
    recommendations: string[];
  };
}

/**
 * Get sync status from cache
 */
export async function getSyncStatusFromCache(): Promise<SyncCacheData | null> {
  try {
    const cached = await redis.get(`${CACHE_PREFIX}status`);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get sync status from cache:', error);
    return null;
  }
}

/**
 * Set sync status in cache
 */
export async function setSyncStatusInCache(
  data: SyncCacheData,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.setEx(`${CACHE_PREFIX}status`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to set sync status in cache:', error);
  }
}

/**
 * Get sync metrics from cache
 */
export async function getSyncMetricsFromCache(): Promise<unknown | null> {
  try {
    const cached = await redis.get(`${CACHE_PREFIX}metrics`);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get sync metrics from cache:', error);
    return null;
  }
}

/**
 * Set sync metrics in cache
 */
export async function setSyncMetricsInCache(
  metrics: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.setEx(`${CACHE_PREFIX}metrics`, ttl, JSON.stringify(metrics));
  } catch (error) {
    console.error('Failed to set sync metrics in cache:', error);
  }
}

/**
 * Get sync logs from cache
 */
export async function getSyncLogsFromCache(
  page: number,
  limit: number
): Promise<unknown | null> {
  try {
    const cached = await redis.get(`${CACHE_PREFIX}logs:${page}:${limit}`);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get sync logs from cache:', error);
    return null;
  }
}

/**
 * Set sync logs in cache
 */
export async function setSyncLogsInCache(
  page: number,
  limit: number,
  data: unknown,
  ttl: number = 60
): Promise<void> {
  try {
    await redis.setEx(
      `${CACHE_PREFIX}logs:${page}:${limit}`,
      ttl,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error('Failed to set sync logs in cache:', error);
  }
}

/**
 * Invalidate sync status cache
 */
export async function invalidateSyncStatusCache(): Promise<void> {
  try {
    await redis.del(`${CACHE_PREFIX}status`);
    await redis.del(`${CACHE_PREFIX}metrics`);
  } catch (error) {
    console.error('Failed to invalidate sync status cache:', error);
  }
}

/**
 * Invalidate sync logs cache
 */
export async function invalidateSyncLogsCache(): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}logs:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Failed to invalidate sync logs cache:', error);
  }
}

/**
 * Invalidate all sync caches
 */
export async function invalidateAllSyncCaches(): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Failed to invalidate all sync caches:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getSyncCacheStats(): Promise<{
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
}> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    const info = await redis.info('memory');

    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';

    return {
      totalKeys: keys.length,
      memoryUsage,
      hitRate: 0.95, // Placeholder - would need to track hits/misses
    };
  } catch (error) {
    console.error('Failed to get sync cache stats:', error);
    return {
      totalKeys: 0,
      memoryUsage: 'Unknown',
      hitRate: 0,
    };
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredSyncCache(): Promise<void> {
  try {
    // Redis automatically handles TTL expiration
    // This function is for manual cleanup if needed
    console.log('Sync cache cleanup completed');
  } catch (error) {
    console.error('Failed to clear expired sync cache:', error);
  }
}
