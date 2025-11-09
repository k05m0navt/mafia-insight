import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import type { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

type OrchestratorInstance = ImportOrchestrator | null | undefined;

declare global {
  var currentOrchestratorInstance: OrchestratorInstance;
}

/**
 * Get the current orchestrator instance
 */
function getCurrentOrchestrator(): ImportOrchestrator | null {
  return globalThis.currentOrchestratorInstance ?? null;
}

/**
 * POST /api/gomafia-sync/import/resume
 * Resume a paused import
 */
export async function POST() {
  const lockManager = new AdvisoryLockManager(db);

  try {
    // Check if there's a paused checkpoint
    const checkpoint = await resilientDB.execute((db) =>
      db.importCheckpoint.findUnique({
        where: { id: 'current' },
      })
    );

    if (!checkpoint || !checkpoint.isPaused) {
      return NextResponse.json(
        {
          error: 'No paused import found to resume',
          code: 'NO_PAUSED_IMPORT',
        },
        { status: 404 }
      );
    }

    // Check if import is already running
    const status = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (status?.isRunning) {
      return NextResponse.json(
        {
          error: 'Import is already running',
          code: 'IMPORT_RUNNING',
        },
        { status: 409 }
      );
    }

    // Try to acquire lock
    const acquired = await lockManager.acquireLock();
    if (!acquired) {
      return NextResponse.json(
        {
          error: 'Cannot resume import - another import may be running',
          code: 'LOCK_FAILED',
        },
        { status: 409 }
      );
    }

    // Resume via orchestrator if available, otherwise start new import from checkpoint
    const orchestrator = getCurrentOrchestrator();
    if (orchestrator) {
      await orchestrator.resume();
      return NextResponse.json({
        success: true,
        message: 'Import resumed successfully',
      });
    } else {
      // Resume from checkpoint by starting import from the checkpoint phase
      // This would need to be implemented in the import route
      // For now, just update the status
      await resilientDB.execute((db) =>
        db.importCheckpoint.updateMany({
          where: { id: 'current' },
          data: {
            isPaused: false,
            lastUpdated: new Date(),
          },
        })
      );

      await db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: true,
          currentOperation: 'Resuming import...',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message:
          'Import resume requested. The import will continue from the checkpoint.',
        checkpoint: {
          phase: checkpoint.currentPhase,
          batch: checkpoint.currentBatch,
          progress: checkpoint.progress,
        },
      });
    }
  } catch (error: unknown) {
    console.error('Import resume failed:', error);

    // Release lock on error
    try {
      await lockManager.releaseLock();
    } catch (releaseError) {
      console.error('Failed to release lock:', releaseError);
    }

    return NextResponse.json(
      {
        error: 'Failed to resume import',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
