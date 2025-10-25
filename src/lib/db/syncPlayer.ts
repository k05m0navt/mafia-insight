import { db } from '@/lib/db';
import { z } from 'zod';
import { PlayerData } from '@/lib/parsers/gomafiaParser';
import {
  transformPlayerData,
  validatePlayerData,
  hasPlayerDataChanged,
} from '@/lib/parsers/transformPlayer';

// Player sync operations schema
const _PlayerSyncCreateSchema = z.object({
  gomafiaId: z.string().min(1),
  name: z.string().min(2).max(50),
  eloRating: z.number().int().min(0).max(3000),
  totalGames: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  clubId: z.string().uuid().optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
  userId: z.string().uuid().optional(),
});

const _PlayerSyncUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  eloRating: z.number().int().min(0).max(3000).optional(),
  totalGames: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional(),
  clubId: z.string().uuid().optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

export type PlayerSyncCreate = z.infer<typeof _PlayerSyncCreateSchema>;
export type PlayerSyncUpdate = z.infer<typeof _PlayerSyncUpdateSchema>;

// Sync a single player from gomafia.pro data
export async function syncPlayer(
  playerData: PlayerData,
  userId?: string,
  clubId?: string
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    // Validate player data
    if (!validatePlayerData(playerData)) {
      return { success: false, error: 'Invalid player data' };
    }

    // Transform data for database
    const transformedData = transformPlayerData(
      playerData,
      clubId,
      new Date(),
      'SYNCED'
    );

    // Check if player already exists
    const existingPlayer = await db.player.findUnique({
      where: { gomafiaId: playerData.id },
    });

    if (existingPlayer) {
      // Check if data has changed
      if (
        !hasPlayerDataChanged(
          {
            ...existingPlayer,
            lastSyncAt: existingPlayer.lastSyncAt ?? undefined,
            syncStatus: existingPlayer.syncStatus ?? undefined,
            clubId: existingPlayer.clubId ?? undefined,
          },
          playerData
        )
      ) {
        // Update lastSyncAt even if no changes
        await db.player.update({
          where: { id: existingPlayer.id },
          data: {
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED',
          },
        });
        return { success: true, playerId: existingPlayer.id };
      }

      // Update existing player
      const updatedPlayer = await db.player.update({
        where: { id: existingPlayer.id },
        data: {
          name: transformedData.name,
          eloRating: transformedData.eloRating,
          totalGames: transformedData.totalGames,
          wins: transformedData.wins,
          losses: transformedData.losses,
          clubId: transformedData.clubId,
          lastSyncAt: transformedData.lastSyncAt,
          syncStatus: transformedData.syncStatus,
        },
      });

      return { success: true, playerId: updatedPlayer.id };
    } else {
      // Create new player
      const newPlayer = await db.player.create({
        data: {
          gomafiaId: transformedData.gomafiaId,
          name: transformedData.name,
          eloRating: transformedData.eloRating,
          totalGames: transformedData.totalGames,
          wins: transformedData.wins,
          losses: transformedData.losses,
          clubId: transformedData.clubId,
          lastSyncAt: transformedData.lastSyncAt,
          syncStatus: transformedData.syncStatus,
          userId: userId || '00000000-0000-0000-0000-000000000000', // Default user for synced players
        },
      });

      return { success: true, playerId: newPlayer.id };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Sync multiple players in batch
export async function syncPlayersBatch(
  playersData: PlayerData[],
  userId?: string,
  clubId?: string
): Promise<{ success: boolean; processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  for (const playerData of playersData) {
    try {
      const result = await syncPlayer(playerData, userId, clubId);
      if (result.success) {
        processed++;
      } else {
        errors.push(`Failed to sync player ${playerData.id}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to sync player ${playerData.id}: ${errorMessage}`);
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
  };
}

// Get players that need syncing
export async function getPlayersNeedingSync(limit: number = 100) {
  return await db.player.findMany({
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

// Mark player sync status
export async function markPlayerSyncStatus(
  gomafiaId: string,
  status: 'SYNCED' | 'PENDING' | 'ERROR',
  _error?: string
) {
  return await db.player.update({
    where: { gomafiaId },
    data: {
      syncStatus: status,
      lastSyncAt: new Date(),
    },
  });
}

// Get player sync statistics
export async function getPlayerSyncStats() {
  const totalPlayers = await db.player.count();
  const syncedPlayers = await db.player.count({
    where: { syncStatus: 'SYNCED' },
  });
  const pendingPlayers = await db.player.count({
    where: { syncStatus: 'PENDING' },
  });
  const errorPlayers = await db.player.count({
    where: { syncStatus: 'ERROR' },
  });

  const lastSyncTime = await db.player.findFirst({
    where: { syncStatus: 'SYNCED' },
    orderBy: { lastSyncAt: 'desc' },
    select: { lastSyncAt: true },
  });

  return {
    totalPlayers,
    syncedPlayers,
    pendingPlayers,
    errorPlayers,
    syncRate: totalPlayers > 0 ? (syncedPlayers / totalPlayers) * 100 : 0,
    lastSyncTime: lastSyncTime?.lastSyncAt,
  };
}

// Get players by sync status
export async function getPlayersBySyncStatus(
  status: 'SYNCED' | 'PENDING' | 'ERROR'
) {
  return await db.player.findMany({
    where: { syncStatus: status },
    orderBy: { lastSyncAt: 'desc' },
  });
}

// Get players with errors
export async function getPlayersWithErrors() {
  return await db.player.findMany({
    where: { syncStatus: 'ERROR' },
    orderBy: { lastSyncAt: 'desc' },
  });
}

// Retry failed player syncs
export async function retryFailedPlayerSyncs() {
  const failedPlayers = await getPlayersWithErrors();
  let retried = 0;
  const errors: string[] = [];

  for (const player of failedPlayers) {
    try {
      await markPlayerSyncStatus(player.gomafiaId, 'PENDING');
      retried++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(
        `Failed to retry player ${player.gomafiaId}: ${errorMessage}`
      );
    }
  }

  return {
    retried,
    errors,
  };
}

// Clean up old player sync data
export async function cleanupPlayerSyncData(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  return await db.player.updateMany({
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
