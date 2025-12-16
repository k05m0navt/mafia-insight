import { NextResponse } from 'next/server';
import { resilientDB } from '@/lib/db-resilient';
import type { CheckpointInfo } from '@/components/import/ResumeImportDialog';

/**
 * GET /api/gomafia-sync/import/checkpoint
 * Get current checkpoint information for resume capability
 */
export async function GET() {
  try {
    const checkpoint = await resilientDB.execute((db) =>
      db.importCheckpoint.findUnique({
        where: { id: 'current' },
      })
    );

    if (!checkpoint) {
      return NextResponse.json({ checkpoint: null }, { status: 200 });
    }

    // Check if import is currently running
    const status = await resilientDB.execute((db) =>
      db.syncStatus.findUnique({
        where: { id: 'current' },
      })
    );

    // If import is running, don't show resume dialog
    if (status?.isRunning) {
      return NextResponse.json({ checkpoint: null }, { status: 200 });
    }

    // Parse phase progress to get processed/total counts
    let processedCount: number | undefined;
    let totalCount: number | undefined;

    if (
      checkpoint.phaseProgress &&
      typeof checkpoint.phaseProgress === 'object'
    ) {
      const phaseProgress = checkpoint.phaseProgress as Record<
        string,
        { processed: number; total: number }
      >;
      const currentPhaseProgress = phaseProgress[checkpoint.currentPhase];
      if (currentPhaseProgress) {
        processedCount = currentPhaseProgress.processed;
        totalCount = currentPhaseProgress.total;
      }
    }

    const checkpointInfo: CheckpointInfo = {
      phase: checkpoint.currentPhase,
      batch: checkpoint.currentBatch,
      progress: checkpoint.progress,
      lastUpdated: checkpoint.lastUpdated.toISOString(),
      importStartTimestamp: checkpoint.importStartTimestamp?.toISOString(),
      processedCount,
      totalCount,
    };

    return NextResponse.json({ checkpoint: checkpointInfo });
  } catch (error: unknown) {
    console.error('Failed to fetch checkpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch checkpoint',
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
 * DELETE /api/gomafia-sync/import/checkpoint
 * Clear checkpoint (for "Start fresh" option)
 */
export async function DELETE() {
  try {
    await resilientDB.execute((db) =>
      db.importCheckpoint
        .delete({
          where: { id: 'current' },
        })
        .catch(() => {
          // Ignore if checkpoint doesn't exist
        })
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to clear checkpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear checkpoint',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
