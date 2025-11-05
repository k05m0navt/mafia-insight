import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Import checkpoint data structure for resume capability.
 * Inspired by Sidekiq Iteration's cursor-based resumption pattern.
 */
export interface ImportCheckpoint {
  /** Current phase of the import (e.g., 'CLUBS', 'PLAYERS') */
  currentPhase:
    | 'CLUBS'
    | 'PLAYERS'
    | 'CLUB_MEMBERS'
    | 'PLAYER_YEAR_STATS'
    | 'TOURNAMENTS'
    | 'TOURNAMENT_CHIEF_JUDGE'
    | 'PLAYER_TOURNAMENT_HISTORY'
    | 'JUDGES'
    | 'GAMES'
    | 'STATISTICS';
  /** Current batch index within the phase */
  currentBatch: number;
  /** ID of the last successfully processed entity (cursor) */
  lastProcessedId: string | null;
  /** Array of all processed entity IDs for duplicate prevention */
  processedIds: string[];
  /** Current progress percentage (0-100) */
  progress: number;
}

/**
 * Manages import checkpoints for resume capability.
 *
 * Pattern inspired by Sidekiq Iteration:
 * - Cursor-based resumption (lastProcessedId)
 * - Duplicate prevention (processedIds tracking)
 * - State persistence in database
 * - Lifecycle management (save, load, clear)
 */
export class CheckpointManager {
  constructor(private db: PrismaClient) {}

  /**
   * Save checkpoint to database.
   * Updates both importCheckpoint table and syncStatus progress.
   */
  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    await resilientDB.execute((db) =>
      db.importCheckpoint.upsert({
        where: { id: 'current' },
        create: {
          id: 'current',
          currentPhase: checkpoint.currentPhase,
          currentBatch: checkpoint.currentBatch,
          lastProcessedId: checkpoint.lastProcessedId,
          processedIds: checkpoint.processedIds,
          progress: checkpoint.progress,
        },
        update: {
          currentPhase: checkpoint.currentPhase,
          currentBatch: checkpoint.currentBatch,
          lastProcessedId: checkpoint.lastProcessedId,
          processedIds: checkpoint.processedIds,
          progress: checkpoint.progress,
          lastUpdated: new Date(),
        },
      })
    );

    // Also update sync status for UI visibility - use upsert to handle missing records
    await resilientDB.execute((db) =>
      db.syncStatus.upsert({
        where: { id: 'current' },
        create: {
          id: 'current',
          isRunning: true,
          progress: checkpoint.progress,
          currentOperation: `Processing ${checkpoint.currentPhase} (batch ${checkpoint.currentBatch})`,
        },
        update: {
          progress: checkpoint.progress,
          currentOperation: `Processing ${checkpoint.currentPhase} (batch ${checkpoint.currentBatch})`,
          updatedAt: new Date(),
        },
      })
    );
  }

  /**
   * Load checkpoint from database.
   * Returns null if no checkpoint exists.
   */
  async loadCheckpoint(): Promise<ImportCheckpoint | null> {
    const checkpoint = await resilientDB.execute((db) =>
      db.importCheckpoint.findUnique({
        where: { id: 'current' },
      })
    );

    if (!checkpoint) {
      return null;
    }

    return {
      currentPhase: checkpoint.currentPhase as ImportCheckpoint['currentPhase'],
      currentBatch: checkpoint.currentBatch,
      lastProcessedId: checkpoint.lastProcessedId,
      processedIds: checkpoint.processedIds,
      progress: checkpoint.progress,
    };
  }

  /**
   * Clear checkpoint from database.
   * Called when import completes successfully.
   */
  async clearCheckpoint(): Promise<void> {
    await resilientDB.execute((db) =>
      db.importCheckpoint
        .delete({
          where: { id: 'current' },
        })
        .catch(() => {
          // Ignore errors if checkpoint doesn't exist
        })
    );
  }
}
