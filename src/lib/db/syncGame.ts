import { db } from '@/lib/db';
import { z } from 'zod';
import { GameData } from '@/lib/parsers/gomafiaParser';
import {
  transformGameData,
  validateGameData,
  hasGameDataChanged,
} from '@/lib/parsers/transformGame';

// Game sync operations schema
const _GameSyncCreateSchema = z.object({
  gomafiaId: z.string().min(1),
  tournamentId: z.string().uuid().optional(),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

const _GameSyncUpdateSchema = z.object({
  date: z.date().optional(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

export type GameSyncCreate = z.infer<typeof _GameSyncCreateSchema>;
export type GameSyncUpdate = z.infer<typeof _GameSyncUpdateSchema>;

// Sync a single game from gomafia.pro data
export async function syncGame(
  gameData: GameData,
  tournamentId?: string
): Promise<{ success: boolean; gameId?: string; error?: string }> {
  try {
    // Validate game data
    if (!validateGameData(gameData)) {
      return { success: false, error: 'Invalid game data' };
    }

    // Transform data for database
    const transformedData = transformGameData(
      gameData,
      tournamentId,
      new Date(),
      'SYNCED'
    );

    // Check if game already exists
    const existingGame = await db.game.findUnique({
      where: { gomafiaId: gameData.id },
    });

    if (existingGame) {
      // Check if data has changed
      if (
        !hasGameDataChanged(
          {
            ...existingGame,
            lastSyncAt: existingGame.lastSyncAt ?? undefined,
            syncStatus: existingGame.syncStatus ?? undefined,
            durationMinutes: existingGame.durationMinutes ?? undefined,
            winnerTeam: existingGame.winnerTeam ?? undefined,
            tournamentId: existingGame.tournamentId ?? undefined,
          },
          gameData
        )
      ) {
        // Update lastSyncAt even if no changes
        await db.game.update({
          where: { id: existingGame.id },
          data: {
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED',
          },
        });
        return { success: true, gameId: existingGame.id };
      }

      // Update existing game
      const updatedGame = await db.game.update({
        where: { id: existingGame.id },
        data: {
          date: transformedData.date,
          durationMinutes: transformedData.durationMinutes,
          winnerTeam: transformedData.winnerTeam,
          status: transformedData.status,
          lastSyncAt: transformedData.lastSyncAt,
          syncStatus: transformedData.syncStatus,
        },
      });

      return { success: true, gameId: updatedGame.id };
    } else {
      // Create new game
      const newGame = await db.game.create({
        data: {
          gomafiaId: transformedData.gomafiaId,
          tournamentId: transformedData.tournamentId,
          date: transformedData.date,
          durationMinutes: transformedData.durationMinutes,
          winnerTeam: transformedData.winnerTeam,
          status: transformedData.status,
          lastSyncAt: transformedData.lastSyncAt,
          syncStatus: transformedData.syncStatus,
        },
      });

      return { success: true, gameId: newGame.id };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Sync multiple games in batch
export async function syncGamesBatch(
  gamesData: GameData[],
  tournamentId?: string
): Promise<{ success: boolean; processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  for (const gameData of gamesData) {
    try {
      const result = await syncGame(gameData, tournamentId);
      if (result.success) {
        processed++;
      } else {
        errors.push(`Failed to sync game ${gameData.id}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to sync game ${gameData.id}: ${errorMessage}`);
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
  };
}

// Get games that need syncing
export async function getGamesNeedingSync(limit: number = 100) {
  return await db.game.findMany({
    where: {
      OR: [
        { syncStatus: 'PENDING' },
        { syncStatus: 'ERROR' },
        { lastSyncAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Older than 24 hours
      ],
    },
    take: limit,
    orderBy: { lastSyncAt: 'asc' },
  });
}

// Mark game sync status
export async function markGameSyncStatus(
  gomafiaId: string,
  status: 'SYNCED' | 'PENDING' | 'ERROR',
  _error?: string
) {
  return await db.game.update({
    where: { gomafiaId },
    data: {
      syncStatus: status,
      lastSyncAt: new Date(),
    },
  });
}

// Get game sync statistics
export async function getGameSyncStats() {
  const totalGames = await db.game.count();
  const syncedGames = await db.game.count({
    where: { syncStatus: 'SYNCED' },
  });
  const pendingGames = await db.game.count({
    where: { syncStatus: 'PENDING' },
  });
  const errorGames = await db.game.count({
    where: { syncStatus: 'ERROR' },
  });

  const lastSyncTime = await db.game.findFirst({
    where: { syncStatus: 'SYNCED' },
    orderBy: { lastSyncAt: 'desc' },
    select: { lastSyncAt: true },
  });

  return {
    totalGames,
    syncedGames,
    pendingGames,
    errorGames,
    syncRate: totalGames > 0 ? (syncedGames / totalGames) * 100 : 0,
    lastSyncTime: lastSyncTime?.lastSyncAt,
  };
}

// Get games by sync status
export async function getGamesBySyncStatus(
  status: 'SYNCED' | 'PENDING' | 'ERROR'
) {
  return await db.game.findMany({
    where: { syncStatus: status },
    orderBy: { lastSyncAt: 'desc' },
  });
}

// Get games with errors
export async function getGamesWithErrors() {
  return await db.game.findMany({
    where: { syncStatus: 'ERROR' },
    orderBy: { lastSyncAt: 'desc' },
  });
}

// Retry failed game syncs
export async function retryFailedGameSyncs() {
  const failedGames = await getGamesWithErrors();
  let retried = 0;
  const errors: string[] = [];

  for (const game of failedGames) {
    try {
      await markGameSyncStatus(game.gomafiaId, 'PENDING');
      retried++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to retry game ${game.gomafiaId}: ${errorMessage}`);
    }
  }

  return {
    retried,
    errors,
  };
}

// Clean up old game sync data
export async function cleanupGameSyncData(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  return await db.game.updateMany({
    where: {
      lastSyncAt: {
        lt: cutoffDate,
      },
      syncStatus: 'ERROR',
    },
    data: {
      syncStatus: 'PENDING',
    },
  });
}

// Get games by date range
export async function getGamesByDateRange(startDate: Date, endDate: Date) {
  return await db.game.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'desc' },
  });
}

// Get games by status
export async function getGamesByStatus(
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) {
  return await db.game.findMany({
    where: { status },
    orderBy: { date: 'desc' },
  });
}

// Get games by winner team
export async function getGamesByWinnerTeam(
  winnerTeam: 'BLACK' | 'RED' | 'DRAW'
) {
  return await db.game.findMany({
    where: { winnerTeam },
    orderBy: { date: 'desc' },
  });
}

// Get recent games
export async function getRecentGames(limit: number = 10) {
  return await db.game.findMany({
    where: { syncStatus: 'SYNCED' },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
