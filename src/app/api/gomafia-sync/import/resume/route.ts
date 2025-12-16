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
 * Resume an interrupted import from checkpoint
 */
export async function POST() {
  const lockManager = new AdvisoryLockManager(db);

  try {
    // Load checkpoint from database
    const checkpoint = await resilientDB.execute((db) =>
      db.importCheckpoint.findUnique({
        where: { id: 'current' },
      })
    );

    // Validate checkpoint exists
    if (!checkpoint) {
      return NextResponse.json(
        {
          error: 'No checkpoint found to resume from',
          code: 'NO_CHECKPOINT',
        },
        { status: 404 }
      );
    }

    // Validate checkpoint is valid (not corrupted)
    if (!checkpoint.currentPhase || checkpoint.currentBatch < 0) {
      return NextResponse.json(
        {
          error: 'Invalid checkpoint: missing required fields',
          code: 'INVALID_CHECKPOINT',
        },
        { status: 400 }
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
          details: {
            progress: status.progress || 0,
            currentOperation: status.currentOperation || 'Unknown',
          },
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

    // Resume via orchestrator if available
    const orchestrator = getCurrentOrchestrator();
    if (orchestrator) {
      try {
        await orchestrator.resumeFromCheckpoint();
        return NextResponse.json({
          success: true,
          message: 'Import resumed successfully from checkpoint',
          checkpoint: {
            phase: checkpoint.currentPhase,
            batch: checkpoint.currentBatch,
            progress: checkpoint.progress,
          },
        });
      } catch (resumeError) {
        // Release lock on error
        await lockManager.releaseLock();
        throw resumeError;
      }
    } else {
      // No orchestrator instance - this means we need to start a new import
      // that will resume from checkpoint. For now, mark checkpoint as ready to resume
      // The actual import route will handle resuming from checkpoint
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
          currentOperation: 'Resuming import from checkpoint...',
          progress: checkpoint.progress,
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
