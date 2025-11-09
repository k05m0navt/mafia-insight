import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
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
 * GET /api/gomafia-sync/import/pause
 * Check if import is paused
 */
export async function GET() {
  try {
    const checkpoint = await resilientDB.execute((db) =>
      db.importCheckpoint.findUnique({
        where: { id: 'current' },
      })
    );

    const isPaused = checkpoint?.isPaused || false;

    return NextResponse.json({
      isPaused,
      checkpoint: checkpoint
        ? {
            phase: checkpoint.currentPhase,
            batch: checkpoint.currentBatch,
            progress: checkpoint.progress,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('Failed to check pause status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check pause status',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gomafia-sync/import/pause
 * Pause the running import
 */
export async function POST() {
  try {
    const status = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (!status?.isRunning) {
      return NextResponse.json(
        {
          error: 'No import operation is currently running',
          code: 'NO_IMPORT_RUNNING',
        },
        { status: 404 }
      );
    }

    // Pause via orchestrator if available
    const orchestrator = getCurrentOrchestrator();
    if (orchestrator) {
      await orchestrator.pause();
      return NextResponse.json({
        success: true,
        message: 'Import paused successfully. Checkpoint saved for resume.',
      });
    } else {
      // Fallback: Update database directly
      await resilientDB.execute((db) =>
        db.importCheckpoint.updateMany({
          where: { id: 'current' },
          data: {
            isPaused: true,
            lastUpdated: new Date(),
          },
        })
      );

      await db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          currentOperation: 'Import paused',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Import pause requested (fallback mode).',
      });
    }
  } catch (error: unknown) {
    console.error('Import pause failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to pause import',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
