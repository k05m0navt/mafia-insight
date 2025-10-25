import { db } from '@/lib/db';
import { z } from 'zod';

// SyncLog validation schema
const SyncLogCreateSchema = z.object({
  type: z.enum(['FULL', 'INCREMENTAL']),
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']),
  startTime: z.date(),
  endTime: z.date().optional(),
  recordsProcessed: z.number().int().min(0).optional(),
  errors: z.array(z.any()).optional(),
});

const SyncLogUpdateSchema = z.object({
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']).optional(),
  endTime: z.date().optional(),
  recordsProcessed: z.number().int().min(0).optional(),
  errors: z.array(z.any()).optional(),
});

export type SyncLogCreate = z.infer<typeof SyncLogCreateSchema>;
export type SyncLogUpdate = z.infer<typeof SyncLogUpdateSchema>;

// Create a new sync log entry
export async function createSyncLog(data: SyncLogCreate) {
  const validatedData = SyncLogCreateSchema.parse(data);

  return await db.syncLog.create({
    data: validatedData,
  });
}

// Update an existing sync log entry
export async function updateSyncLog(id: string, data: SyncLogUpdate) {
  const validatedData = SyncLogUpdateSchema.parse(data);

  return await db.syncLog.update({
    where: { id },
    data: validatedData,
  });
}

// Get sync log by ID
export async function getSyncLog(id: string) {
  return await db.syncLog.findUnique({
    where: { id },
  });
}

// Get recent sync logs
export async function getRecentSyncLogs(limit: number = 10) {
  return await db.syncLog.findMany({
    orderBy: { startTime: 'desc' },
    take: limit,
  });
}

// Get sync logs by status
export async function getSyncLogsByStatus(
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
) {
  return await db.syncLog.findMany({
    where: { status },
    orderBy: { startTime: 'desc' },
  });
}

// Get sync logs by type
export async function getSyncLogsByType(type: 'FULL' | 'INCREMENTAL') {
  return await db.syncLog.findMany({
    where: { type },
    orderBy: { startTime: 'desc' },
  });
}

// Get sync logs within date range
export async function getSyncLogsByDateRange(startDate: Date, endDate: Date) {
  return await db.syncLog.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { startTime: 'desc' },
  });
}

// Get sync statistics
export async function getSyncStatistics() {
  const totalSyncs = await db.syncLog.count();
  const successfulSyncs = await db.syncLog.count({
    where: { status: 'COMPLETED' },
  });
  const failedSyncs = await db.syncLog.count({
    where: { status: 'FAILED' },
  });
  const runningSyncs = await db.syncLog.count({
    where: { status: 'RUNNING' },
  });

  const totalRecordsProcessed = await db.syncLog.aggregate({
    _sum: {
      recordsProcessed: true,
    },
    where: {
      status: 'COMPLETED',
    },
  });

  const lastSync = await db.syncLog.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { startTime: 'desc' },
  });

  return {
    totalSyncs,
    successfulSyncs,
    failedSyncs,
    runningSyncs,
    successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
    totalRecordsProcessed: totalRecordsProcessed._sum.recordsProcessed || 0,
    lastSync: lastSync
      ? {
          id: lastSync.id,
          type: lastSync.type,
          startTime: lastSync.startTime,
          endTime: lastSync.endTime,
          recordsProcessed: lastSync.recordsProcessed,
        }
      : null,
  };
}

// Delete old sync logs (cleanup)
export async function deleteOldSyncLogs(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  return await db.syncLog.deleteMany({
    where: {
      startTime: {
        lt: cutoffDate,
      },
      status: {
        in: ['COMPLETED', 'FAILED'],
      },
    },
  });
}

// Get sync log with error details
export async function getSyncLogWithErrors(id: string) {
  const syncLog = await db.syncLog.findUnique({
    where: { id },
  });

  if (!syncLog) return null;

  return {
    ...syncLog,
    hasErrors:
      syncLog.errors &&
      Array.isArray(syncLog.errors) &&
      syncLog.errors.length > 0,
    errorCount:
      syncLog.errors && Array.isArray(syncLog.errors)
        ? syncLog.errors.length
        : 0,
  };
}

// Get failed sync logs with retry suggestions
export async function getFailedSyncLogsWithRetry() {
  const failedSyncs = await db.syncLog.findMany({
    where: { status: 'FAILED' },
    orderBy: { startTime: 'desc' },
  });

  return failedSyncs.map((syncLog) => ({
    ...syncLog,
    canRetry: syncLog.startTime > new Date(Date.now() - 24 * 60 * 60 * 1000), // Can retry if failed within last 24 hours
    suggestedRetryType: syncLog.type === 'FULL' ? 'INCREMENTAL' : 'FULL', // Suggest opposite type for retry
  }));
}
