import { db } from '@/lib/db';
import { z } from 'zod';

// SyncStatus validation schema
const SyncStatusCreateSchema = z.object({
  id: z.string().default('current'),
  lastSyncTime: z.date().optional(),
  lastSyncType: z.enum(['FULL', 'INCREMENTAL']).optional(),
  isRunning: z.boolean().default(false),
  progress: z.number().int().min(0).max(100).optional(),
  currentOperation: z.string().optional(),
  lastError: z.string().optional(),
});

const SyncStatusUpdateSchema = z.object({
  lastSyncTime: z.date().optional(),
  lastSyncType: z.enum(['FULL', 'INCREMENTAL']).optional(),
  isRunning: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  currentOperation: z.string().optional(),
  lastError: z.string().optional(),
});

export type SyncStatusCreate = z.infer<typeof SyncStatusCreateSchema>;
export type SyncStatusUpdate = z.infer<typeof SyncStatusUpdateSchema>;

// Get current sync status
export async function getCurrentSyncStatus() {
  return await db.syncStatus.findUnique({
    where: { id: 'current' },
  });
}

// Create or update sync status
export async function upsertSyncStatus(data: SyncStatusCreate) {
  const validatedData = SyncStatusCreateSchema.parse(data);

  return await db.syncStatus.upsert({
    where: { id: 'current' },
    update: validatedData,
    create: validatedData,
  });
}

// Update sync status
export async function updateSyncStatus(data: SyncStatusUpdate) {
  const validatedData = SyncStatusUpdateSchema.parse(data);

  return await db.syncStatus.update({
    where: { id: 'current' },
    data: validatedData,
  });
}

// Start sync operation
export async function startSync(type: 'FULL' | 'INCREMENTAL') {
  return await db.syncStatus.upsert({
    where: { id: 'current' },
    update: {
      isRunning: true,
      progress: 0,
      currentOperation: `Starting ${type} sync`,
      lastError: null,
    },
    create: {
      id: 'current',
      isRunning: true,
      progress: 0,
      currentOperation: `Starting ${type} sync`,
    },
  });
}

// Update sync progress
export async function updateSyncProgress(progress: number, operation?: string) {
  if (progress < 0 || progress > 100) {
    throw new Error('Progress must be between 0 and 100');
  }

  return await db.syncStatus.update({
    where: { id: 'current' },
    data: {
      progress,
      currentOperation: operation,
    },
  });
}

// Complete sync operation
export async function completeSync(type: 'FULL' | 'INCREMENTAL') {
  return await db.syncStatus.update({
    where: { id: 'current' },
    data: {
      lastSyncTime: new Date(),
      lastSyncType: type,
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastError: null,
    },
  });
}

// Fail sync operation
export async function failSync(error: string) {
  return await db.syncStatus.update({
    where: { id: 'current' },
    data: {
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastError: error,
    },
  });
}

// Check if sync is running
export async function isSyncRunning(): Promise<boolean> {
  const status = await getCurrentSyncStatus();
  return status?.isRunning || false;
}

// Get sync health status
export async function getSyncHealth() {
  const status = await getCurrentSyncStatus();

  if (!status) {
    return {
      healthy: false,
      status: 'NO_STATUS',
      message: 'No sync status found',
    };
  }

  if (status.isRunning) {
    return {
      healthy: true,
      status: 'RUNNING',
      message: `Sync is running: ${status.currentOperation || 'Unknown operation'}`,
      progress: status.progress || 0,
    };
  }

  if (status.lastError) {
    return {
      healthy: false,
      status: 'ERROR',
      message: `Last sync failed: ${status.lastError}`,
    };
  }

  if (status.lastSyncTime) {
    const timeSinceLastSync = Date.now() - status.lastSyncTime.getTime();
    const hoursSinceLastSync = timeSinceLastSync / (1000 * 60 * 60);

    if (hoursSinceLastSync > 48) {
      return {
        healthy: false,
        status: 'STALE',
        message: `Last sync was ${Math.round(hoursSinceLastSync)} hours ago`,
        lastSyncTime: status.lastSyncTime,
      };
    }

    return {
      healthy: true,
      status: 'HEALTHY',
      message: `Last sync was ${Math.round(hoursSinceLastSync)} hours ago`,
      lastSyncTime: status.lastSyncTime,
    };
  }

  return {
    healthy: false,
    status: 'NEVER_SYNCED',
    message: 'No sync has been performed yet',
  };
}

// Get sync statistics
export async function getSyncStats() {
  const status = await getCurrentSyncStatus();

  if (!status) {
    return {
      hasRun: false,
      lastSyncTime: null,
      lastSyncType: null,
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastError: null,
    };
  }

  return {
    hasRun: !!status.lastSyncTime,
    lastSyncTime: status.lastSyncTime,
    lastSyncType: status.lastSyncType,
    isRunning: status.isRunning,
    progress: status.progress || 0,
    currentOperation: status.currentOperation,
    lastError: status.lastError,
  };
}

// Reset sync status (for testing or manual reset)
export async function resetSyncStatus() {
  return await db.syncStatus.update({
    where: { id: 'current' },
    data: {
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastError: null,
    },
  });
}

// Get sync status history (if we want to track changes over time)
export async function getSyncStatusHistory(_limit: number = 10) {
  // This would require a separate table to track status changes over time
  // For now, we'll return the current status
  const currentStatus = await getCurrentSyncStatus();
  return currentStatus ? [currentStatus] : [];
}
