import { db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Cancel a running import operation
 */
export async function cancelImport(adminId: string): Promise<void> {
  // Check if import is running
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });

  if (!status || !status.isRunning) {
    throw new Error('No import operation currently running');
  }

  // Set cancellation flag
  // Note: The actual orchestrator cancellation is handled elsewhere
  // This service updates the database status

  // Update syncStatus to mark as cancelled
  await resilientDB.execute((db) =>
    db.syncStatus.update({
      where: { id: 'current' },
      data: {
        isRunning: false,
        lastError: 'Import cancelled by administrator',
        updatedAt: new Date(),
      },
    })
  );

  // Update the most recent running import log
  const runningLog = await resilientDB.execute((db) =>
    db.syncLog.findFirst({
      where: {
        status: 'RUNNING',
      },
      orderBy: {
        startTime: 'desc',
      },
    })
  );

  if (runningLog) {
    await resilientDB.execute((db) =>
      db.syncLog.update({
        where: { id: runningLog.id },
        data: {
          status: 'CANCELLED',
          endTime: new Date(),
        },
      })
    );
  }

  console.log(`Import cancelled by admin: ${adminId}`);
}

/**
 * Get current import status
 */
export async function getImportStatus() {
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  return status;
}
