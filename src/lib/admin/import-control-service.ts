import { db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';

/**
 * Cancel a running import operation
 */
export async function cancelImport(
  adminId: string,
  importId?: string
): Promise<void> {
  // Check ImportProgress table first (newer system used by admin imports)
  if (importId) {
    const importProgress = await db.importProgress.findUnique({
      where: { id: importId },
    });

    if (importProgress && importProgress.status === 'RUNNING') {
      // Use the importOrchestrator to cancel
      await importOrchestrator.cancelImport(importId);
      console.log(`Import ${importId} cancelled by admin: ${adminId}`);
      return;
    }
  }

  // Fallback: Check for any running import in ImportProgress
  const runningImport = await db.importProgress.findFirst({
    where: { status: 'RUNNING' },
    orderBy: { startTime: 'desc' },
  });

  if (runningImport) {
    await importOrchestrator.cancelImport(runningImport.id);
    console.log(`Import ${runningImport.id} cancelled by admin: ${adminId}`);
    return;
  }

  // Fallback: Check old syncStatus system
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });

  if (status && status.isRunning) {
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

    console.log(`Sync cancelled by admin: ${adminId}`);
    return;
  }

  throw new Error('No import operation currently running');
}

/**
 * Get current import status
 */
export async function getImportStatus() {
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  return status;
}
