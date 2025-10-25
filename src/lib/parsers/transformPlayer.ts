import { z } from 'zod';
import { PlayerData } from './gomafiaParser';

// Database Player model schema
const DatabasePlayerSchema = z.object({
  gomafiaId: z.string().min(1),
  name: z.string().min(2).max(50),
  eloRating: z.number().int().min(0).max(3000),
  totalGames: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  clubId: z.string().uuid().optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

export type DatabasePlayer = z.infer<typeof DatabasePlayerSchema>;

// Transform player data from gomafia.pro format to database format
export function transformPlayerData(
  playerData: PlayerData,
  clubId?: string,
  lastSyncAt?: Date,
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR' = 'SYNCED'
): DatabasePlayer {
  const transformedData = {
    gomafiaId: playerData.id,
    name: playerData.name,
    eloRating: playerData.eloRating,
    totalGames: playerData.totalGames,
    wins: playerData.wins,
    losses: playerData.losses,
    clubId,
    lastSyncAt: lastSyncAt || new Date(),
    syncStatus,
  };

  // Validate the transformed data
  return DatabasePlayerSchema.parse(transformedData);
}

// Validate player data consistency
export function validatePlayerData(playerData: PlayerData): boolean {
  try {
    // Check basic constraints
    if (playerData.wins + playerData.losses > playerData.totalGames) {
      return false;
    }

    if (playerData.wins + playerData.losses !== playerData.totalGames) {
      return false;
    }

    if (playerData.eloRating < 0 || playerData.eloRating > 3000) {
      return false;
    }

    if (
      playerData.totalGames < 0 ||
      playerData.wins < 0 ||
      playerData.losses < 0
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Extract club information from player data
export function extractClubInfo(playerData: PlayerData): string | undefined {
  return playerData.club;
}

// Calculate player statistics
export function calculatePlayerStats(playerData: PlayerData): {
  winRate: number;
  averageElo: number;
  gamesPerMonth: number;
} {
  const winRate =
    playerData.totalGames > 0
      ? (playerData.wins / playerData.totalGames) * 100
      : 0;
  const averageElo = playerData.eloRating;

  // Estimate games per month (assuming 30 days per month)
  const daysSinceLastActive = playerData.lastActive
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(playerData.lastActive).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 30;
  const gamesPerMonth =
    playerData.totalGames / Math.max(1, daysSinceLastActive / 30);

  return {
    winRate: Math.round(winRate * 100) / 100,
    averageElo: averageElo,
    gamesPerMonth: Math.round(gamesPerMonth * 100) / 100,
  };
}

// Check if player data has changed
export function hasPlayerDataChanged(
  oldData: Partial<DatabasePlayer>,
  newData: PlayerData
): boolean {
  if (!oldData) return true;

  return (
    oldData.name !== newData.name ||
    oldData.eloRating !== newData.eloRating ||
    oldData.totalGames !== newData.totalGames ||
    oldData.wins !== newData.wins ||
    oldData.losses !== newData.losses
  );
}

// Generate player summary for logging
export function generatePlayerSummary(playerData: PlayerData): string {
  const stats = calculatePlayerStats(playerData);

  return (
    `Player ${playerData.name} (${playerData.id}): ` +
    `ELO ${playerData.eloRating}, ` +
    `${playerData.totalGames} games, ` +
    `${stats.winRate}% win rate, ` +
    `Club: ${playerData.club || 'None'}`
  );
}
