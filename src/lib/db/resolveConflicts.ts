import { db } from '@/lib/db';

export interface DataConflict {
  id: string;
  field: string;
  currentValue: unknown;
  newValue: unknown;
  conflictType: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT' | 'CREATE_CONFLICT';
  timestamp: Date;
}

export interface ConflictResolutionResult {
  conflictsResolved: number;
  conflictsRemaining: number;
  errors: string[];
}

/**
 * Resolve data conflicts for players
 */
export async function resolveDataConflicts(): Promise<ConflictResolutionResult> {
  const result: ConflictResolutionResult = {
    conflictsResolved: 0,
    conflictsRemaining: 0,
    errors: [],
  };

  try {
    // Find players with sync status ERROR
    const conflictedPlayers = await db.player.findMany({
      where: {
        syncStatus: 'ERROR',
      },
    });

    for (const player of conflictedPlayers) {
      try {
        // Attempt to resolve the conflict by updating with latest data
        await db.player.update({
          where: { id: player.id },
          data: {
            syncStatus: 'PENDING',
            lastSyncAt: new Date(),
          },
        });

        result.conflictsResolved++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Failed to resolve conflict for player ${player.id}: ${errorMessage}`
        );
        result.conflictsRemaining++;
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Conflict resolution failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Resolve data conflicts for games
 */
export async function resolveGameConflicts(): Promise<ConflictResolutionResult> {
  const result: ConflictResolutionResult = {
    conflictsResolved: 0,
    conflictsRemaining: 0,
    errors: [],
  };

  try {
    // Find games with sync status ERROR
    const conflictedGames = await db.game.findMany({
      where: {
        syncStatus: 'ERROR',
      },
    });

    for (const game of conflictedGames) {
      try {
        // Attempt to resolve the conflict by updating with latest data
        await db.game.update({
          where: { id: game.id },
          data: {
            syncStatus: 'PENDING',
            lastSyncAt: new Date(),
          },
        });

        result.conflictsResolved++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Failed to resolve conflict for game ${game.id}: ${errorMessage}`
        );
        result.conflictsRemaining++;
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Game conflict resolution failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Detect and log data conflicts
 */
export async function detectDataConflicts(): Promise<{
  conflicts: DataConflict[];
  errors: string[];
}> {
  const result = {
    conflicts: [] as DataConflict[],
    errors: [] as string[],
  };

  try {
    // Check for players with inconsistent data
    const players = await db.player.findMany({
      where: {
        OR: [
          { wins: { gt: 0 }, totalGames: 0 },
          { losses: { gt: 0 }, totalGames: 0 },
          { eloRating: { lt: 0 } },
          { eloRating: { gt: 3000 } },
        ],
      },
    });

    for (const player of players) {
      if (player.wins > 0 && player.totalGames === 0) {
        result.conflicts.push({
          id: player.id,
          field: 'totalGames',
          currentValue: player.totalGames,
          newValue: player.wins + player.losses,
          conflictType: 'UPDATE_CONFLICT',
          timestamp: new Date(),
        });
      }

      if (player.losses > 0 && player.totalGames === 0) {
        result.conflicts.push({
          id: player.id,
          field: 'totalGames',
          currentValue: player.totalGames,
          newValue: player.wins + player.losses,
          conflictType: 'UPDATE_CONFLICT',
          timestamp: new Date(),
        });
      }

      if (player.eloRating < 0 || player.eloRating > 3000) {
        result.conflicts.push({
          id: player.id,
          field: 'eloRating',
          currentValue: player.eloRating,
          newValue: Math.max(0, Math.min(3000, player.eloRating)),
          conflictType: 'UPDATE_CONFLICT',
          timestamp: new Date(),
        });
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Conflict detection failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Auto-resolve detected conflicts
 */
export async function autoResolveConflicts(conflicts: DataConflict[]): Promise<{
  resolved: number;
  errors: string[];
}> {
  const result = {
    resolved: 0,
    errors: [] as string[],
  };

  for (const conflict of conflicts) {
    try {
      if (conflict.conflictType === 'UPDATE_CONFLICT') {
        await db.player.update({
          where: { id: conflict.id },
          data: {
            [conflict.field]: conflict.newValue,
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED',
          },
        });
        result.resolved++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(
        `Failed to auto-resolve conflict for ${conflict.id}: ${errorMessage}`
      );
    }
  }

  return result;
}

/**
 * Manual conflict resolution for specific player
 */
export async function manualResolvePlayerConflict(
  playerId: string,
  resolution: {
    name?: string;
    eloRating?: number;
    totalGames?: number;
    wins?: number;
    losses?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.player.update({
      where: { id: playerId },
      data: {
        ...resolution,
        lastSyncAt: new Date(),
        syncStatus: 'SYNCED',
      },
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get conflict statistics
 */
export async function getConflictStatistics(): Promise<{
  totalConflicts: number;
  playerConflicts: number;
  gameConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
}> {
  try {
    const playerConflicts = await db.player.count({
      where: { syncStatus: 'ERROR' },
    });

    const gameConflicts = await db.game.count({
      where: { syncStatus: 'ERROR' },
    });

    const resolvedPlayers = await db.player.count({
      where: { syncStatus: 'SYNCED' },
    });

    const pendingPlayers = await db.player.count({
      where: { syncStatus: 'PENDING' },
    });

    return {
      totalConflicts: playerConflicts + gameConflicts,
      playerConflicts,
      gameConflicts,
      resolvedConflicts: resolvedPlayers,
      pendingConflicts: pendingPlayers,
    };
  } catch {
    return {
      totalConflicts: 0,
      playerConflicts: 0,
      gameConflicts: 0,
      resolvedConflicts: 0,
      pendingConflicts: 0,
    };
  }
}
