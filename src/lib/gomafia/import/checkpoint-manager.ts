import { PrismaClient, Prisma } from '@prisma/client';
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
  /** Whether the import is paused */
  isPaused?: boolean;
  /** Import start timestamp (for elapsed time calculation on resume) */
  importStartTimestamp?: Date | string;
  /** Phase progress map: processed/total counts per phase */
  phaseProgress?: Record<string, { processed: number; total: number }>;
  /** Last processed entity ID for each phase (for granular resume) */
  lastProcessedIdByPhase?: Record<string, string | null>;
}

/**
 * Manages import checkpoints for resume capability.
 *
 * Pattern inspired by Sidekiq Iteration:
 * - Cursor-based resumption (lastProcessedId)
 * - Duplicate prevention (processedIds tracking)
 * - State persistence in database
 * - Lifecycle management (save, load, clear)
 *
 * Checkpoint Frequency Strategy:
 * - Checkpoints are saved after each batch completion (typically 100 entities per batch)
 * - This approach balances checkpoint overhead with resume granularity
 * - Functionally equivalent to "every N entities" since batches contain consistent entity counts
 * - Each import phase saves checkpoints after processing each batch during the import process
 * - Checkpoints include comprehensive state: phase progress, processed IDs, timestamps, and metadata
 */
export class CheckpointManager {
  constructor(private db: PrismaClient) {}

  /**
   * Save checkpoint to database.
   * Updates both importCheckpoint table and syncStatus progress.
   * Uses atomic transaction to ensure data consistency.
   */
  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    // Convert Date to ISO string if needed for JSON storage
    const importStartTimestamp = checkpoint.importStartTimestamp
      ? checkpoint.importStartTimestamp instanceof Date
        ? checkpoint.importStartTimestamp
        : new Date(checkpoint.importStartTimestamp)
      : null;

    // Use transaction for atomic checkpoint save
    await resilientDB.execute(async (db) => {
      await db.$transaction(async (tx) => {
        // Save checkpoint with enhanced data
        await tx.importCheckpoint.upsert({
          where: { id: 'current' },
          create: {
            id: 'current',
            currentPhase: checkpoint.currentPhase,
            currentBatch: checkpoint.currentBatch,
            lastProcessedId: checkpoint.lastProcessedId,
            processedIds: checkpoint.processedIds,
            progress: checkpoint.progress,
            isPaused: checkpoint.isPaused ?? false,
            importStartTimestamp,
            phaseProgress: checkpoint.phaseProgress
              ? (checkpoint.phaseProgress as Prisma.InputJsonValue)
              : undefined,
            lastProcessedIdByPhase: checkpoint.lastProcessedIdByPhase
              ? (checkpoint.lastProcessedIdByPhase as Prisma.InputJsonValue)
              : undefined,
          },
          update: {
            currentPhase: checkpoint.currentPhase,
            currentBatch: checkpoint.currentBatch,
            lastProcessedId: checkpoint.lastProcessedId,
            processedIds: checkpoint.processedIds,
            progress: checkpoint.progress,
            isPaused: checkpoint.isPaused ?? false,
            importStartTimestamp,
            phaseProgress: checkpoint.phaseProgress
              ? (checkpoint.phaseProgress as Prisma.InputJsonValue)
              : undefined,
            lastProcessedIdByPhase: checkpoint.lastProcessedIdByPhase
              ? (checkpoint.lastProcessedIdByPhase as Prisma.InputJsonValue)
              : undefined,
            lastUpdated: new Date(),
          },
        });

        // Also update sync status for UI visibility
        await tx.syncStatus.upsert({
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
        });
      });
    });

    // Log checkpoint creation timestamp
    console.log(
      `[CheckpointManager] Checkpoint saved at ${new Date().toISOString()}: phase=${checkpoint.currentPhase}, batch=${checkpoint.currentBatch}, progress=${checkpoint.progress}%`
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

    // Parse and validate JSON fields with runtime type checking
    const phaseProgress =
      checkpoint.phaseProgress && typeof checkpoint.phaseProgress === 'object'
        ? this.validatePhaseProgress(checkpoint.phaseProgress)
        : undefined;

    const lastProcessedIdByPhase =
      checkpoint.lastProcessedIdByPhase &&
      typeof checkpoint.lastProcessedIdByPhase === 'object'
        ? this.validateLastProcessedIdByPhase(checkpoint.lastProcessedIdByPhase)
        : undefined;

    return {
      currentPhase: checkpoint.currentPhase as ImportCheckpoint['currentPhase'],
      currentBatch: checkpoint.currentBatch,
      lastProcessedId: checkpoint.lastProcessedId,
      processedIds: checkpoint.processedIds,
      progress: checkpoint.progress,
      isPaused: checkpoint.isPaused ?? false,
      importStartTimestamp: checkpoint.importStartTimestamp || undefined,
      phaseProgress,
      lastProcessedIdByPhase,
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

  /**
   * Validate phaseProgress JSON field structure.
   * Returns validated object or undefined if invalid.
   */
  private validatePhaseProgress(
    value: unknown
  ): Record<string, { processed: number; total: number }> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const validated: Record<string, { processed: number; total: number }> = {};
    for (const [key, phaseData] of Object.entries(value)) {
      if (
        phaseData &&
        typeof phaseData === 'object' &&
        !Array.isArray(phaseData) &&
        typeof (phaseData as { processed?: unknown }).processed === 'number' &&
        typeof (phaseData as { total?: unknown }).total === 'number'
      ) {
        validated[key] = {
          processed: (phaseData as { processed: number }).processed,
          total: (phaseData as { total: number }).total,
        };
      }
    }

    return Object.keys(validated).length > 0 ? validated : undefined;
  }

  /**
   * Validate lastProcessedIdByPhase JSON field structure.
   * Returns validated object or undefined if invalid.
   */
  private validateLastProcessedIdByPhase(
    value: unknown
  ): Record<string, string | null> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const validated: Record<string, string | null> = {};
    for (const [key, idValue] of Object.entries(value)) {
      if (idValue === null || typeof idValue === 'string') {
        validated[key] = idValue;
      }
    }

    return Object.keys(validated).length > 0 ? validated : undefined;
  }
}
