import { z } from 'zod';
import { GameData } from './gomafiaParser';

// Database Game model schema
const DatabaseGameSchema = z.object({
  gomafiaId: z.string().min(1),
  tournamentId: z.string().uuid().optional(),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

export type DatabaseGame = z.infer<typeof DatabaseGameSchema>;

// Game participation schema
const GameParticipationSchema = z.object({
  playerId: z.string().uuid(),
  gameId: z.string().uuid(),
  role: z.string(),
  team: z.enum(['BLACK', 'RED']),
  isWinner: z.boolean(),
});

export type GameParticipation = z.infer<typeof GameParticipationSchema>;

// Transform game data from gomafia.pro format to database format
export function transformGameData(
  gameData: GameData,
  tournamentId?: string,
  lastSyncAt?: Date,
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR' = 'SYNCED'
): DatabaseGame {
  const transformedData = {
    gomafiaId: gameData.id,
    tournamentId,
    date: new Date(gameData.date),
    durationMinutes: gameData.duration,
    winnerTeam: gameData.winnerTeam,
    status: gameData.status,
    lastSyncAt: lastSyncAt || new Date(),
    syncStatus,
  };

  // Validate the transformed data
  return DatabaseGameSchema.parse(transformedData);
}

// Transform game participants data
export function transformGameParticipants(
  gameData: GameData,
  gameId: string,
  playerIdMap: Map<string, string> // Maps gomafia player IDs to database player IDs
): GameParticipation[] {
  if (!gameData.participants) return [];

  const participants = gameData.participants.map((participant) => {
    const databasePlayerId = playerIdMap.get(participant.playerId);
    if (!databasePlayerId) {
      throw new Error(
        `Player ID not found in mapping: ${participant.playerId}`
      );
    }

    const isWinner = gameData.winnerTeam === participant.team;

    return {
      playerId: databasePlayerId,
      gameId,
      role: participant.role,
      team: participant.team,
      isWinner,
    };
  });

  // Validate the transformed data
  return participants.map((participant) =>
    GameParticipationSchema.parse(participant)
  );
}

// Validate game data consistency
export function validateGameData(gameData: GameData): boolean {
  try {
    // Check date validity
    const gameDate = new Date(gameData.date);
    if (isNaN(gameDate.getTime())) {
      return false;
    }

    // Check duration if provided
    if (
      gameData.duration &&
      (gameData.duration < 0 || gameData.duration > 1440)
    ) {
      // Max 24 hours
      return false;
    }

    // Check participants if provided
    if (gameData.participants) {
      for (const participant of gameData.participants) {
        if (!participant.playerId || !participant.role || !participant.team) {
          return false;
        }

        if (!['BLACK', 'RED'].includes(participant.team)) {
          return false;
        }
      }
    }

    // Check winner team consistency
    if (
      gameData.winnerTeam &&
      !['BLACK', 'RED', 'DRAW'].includes(gameData.winnerTeam)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Check if game data has changed
export function hasGameDataChanged(
  oldData: Partial<DatabaseGame>,
  newData: GameData
): boolean {
  if (!oldData) return true;

  const newDate = new Date(newData.date);
  const oldDate = oldData.date;

  return (
    oldData.status !== newData.status ||
    oldData.winnerTeam !== newData.winnerTeam ||
    oldData.durationMinutes !== newData.duration ||
    (oldDate ? Math.abs(oldDate.getTime() - newDate.getTime()) > 1000 : false) // More than 1 second difference
  );
}

// Calculate game statistics
export function calculateGameStats(gameData: GameData): {
  participantCount: number;
  hasWinner: boolean;
  isCompleted: boolean;
  durationHours: number;
} {
  const participantCount = gameData.participants?.length || 0;
  const hasWinner = !!gameData.winnerTeam && gameData.winnerTeam !== 'DRAW';
  const isCompleted = gameData.status === 'COMPLETED';
  const durationHours = gameData.duration ? gameData.duration / 60 : 0;

  return {
    participantCount,
    hasWinner,
    isCompleted,
    durationHours: Math.round(durationHours * 100) / 100,
  };
}

// Generate game summary for logging
export function generateGameSummary(gameData: GameData): string {
  const stats = calculateGameStats(gameData);
  const date = new Date(gameData.date).toLocaleDateString();

  return (
    `Game ${gameData.id} (${date}): ` +
    `${stats.participantCount} participants, ` +
    `Status: ${gameData.status}, ` +
    `Winner: ${gameData.winnerTeam || 'None'}, ` +
    `Duration: ${stats.durationHours}h`
  );
}

// Extract tournament information from game data
export function extractTournamentInfo(_gameData: GameData): string | undefined {
  // This would need to be implemented based on how tournaments are identified
  // in the gomafia.pro data structure
  return undefined;
}

// Check if game is part of a tournament
export function isTournamentGame(_gameData: GameData): boolean {
  // This would need to be implemented based on how tournaments are identified
  // in the gomafia.pro data structure
  return false;
}
