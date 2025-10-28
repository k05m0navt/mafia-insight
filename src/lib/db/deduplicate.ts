import { db } from '@/lib/db';

export interface DuplicateRecord {
  id: string;
  gomafiaId: string;
  name: string;
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface DeduplicationResult {
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: string[];
}

/**
 * Find and remove duplicate players based on gomafiaId
 */
export async function deduplicatePlayers(): Promise<DeduplicationResult> {
  const result: DeduplicationResult = {
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: [],
  };

  try {
    // Find all players grouped by gomafiaId
    const players = await db.player.findMany({
      select: {
        id: true,
        gomafiaId: true,
        name: true,
        createdAt: true,
        lastSyncAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by gomafiaId
    const groupedPlayers = new Map<string, DuplicateRecord[]>();

    for (const player of players) {
      if (!groupedPlayers.has(player.gomafiaId)) {
        groupedPlayers.set(player.gomafiaId, []);
      }
      groupedPlayers.get(player.gomafiaId)!.push({
        id: player.id,
        gomafiaId: player.gomafiaId,
        name: player.name,
        createdAt: player.createdAt,
        lastSyncAt: player.lastSyncAt || undefined,
      });
    }

    // Process each group
    for (const [, playerGroup] of groupedPlayers) {
      if (playerGroup.length > 1) {
        result.duplicatesFound += playerGroup.length - 1;

        // Keep the most recent record (highest lastSyncAt or latest createdAt)
        const sortedPlayers = playerGroup.sort((a, b) => {
          const aTime = a.lastSyncAt || a.createdAt;
          const bTime = b.lastSyncAt || b.createdAt;
          return bTime.getTime() - aTime.getTime();
        });

        const duplicatePlayers = sortedPlayers.slice(1);

        // Remove duplicates
        for (const duplicate of duplicatePlayers) {
          try {
            await db.player.delete({
              where: { id: duplicate.id },
            });
            result.duplicatesRemoved++;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(
              `Failed to remove duplicate player ${duplicate.id}: ${errorMessage}`
            );
          }
        }
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Deduplication failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Find and remove duplicate games based on gomafiaId
 */
export async function deduplicateGames(): Promise<DeduplicationResult> {
  const result: DeduplicationResult = {
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: [],
  };

  try {
    // Find all games grouped by gomafiaId
    const games = await db.game.findMany({
      select: {
        id: true,
        gomafiaId: true,
        date: true,
        createdAt: true,
        lastSyncAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by gomafiaId
    const groupedGames = new Map<
      string,
      Array<{
        id: string;
        gomafiaId: string;
        createdAt: Date;
        lastSyncAt: Date | null;
      }>
    >();

    for (const game of games) {
      if (!groupedGames.has(game.gomafiaId)) {
        groupedGames.set(game.gomafiaId, []);
      }
      groupedGames.get(game.gomafiaId)!.push({
        id: game.id,
        gomafiaId: game.gomafiaId,
        date: game.date,
        createdAt: game.createdAt,
        lastSyncAt: game.lastSyncAt || undefined,
      });
    }

    // Process each group
    for (const [, gameGroup] of groupedGames) {
      if (gameGroup.length > 1) {
        result.duplicatesFound += gameGroup.length - 1;

        // Keep the most recent record (highest lastSyncAt or latest createdAt)
        const sortedGames = gameGroup.sort((a, b) => {
          const aTime = a.lastSyncAt || a.createdAt;
          const bTime = b.lastSyncAt || b.createdAt;
          return bTime.getTime() - aTime.getTime();
        });

        const duplicateGames = sortedGames.slice(1);

        // Remove duplicates
        for (const duplicate of duplicateGames) {
          try {
            await db.game.delete({
              where: { id: duplicate.id },
            });
            result.duplicatesRemoved++;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(
              `Failed to remove duplicate game ${duplicate.id}: ${errorMessage}`
            );
          }
        }
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Deduplication failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Check for potential duplicates based on name similarity
 */
export async function findPotentialDuplicates(): Promise<{
  potentialDuplicates: Array<{
    players: DuplicateRecord[];
    similarity: number;
  }>;
  errors: string[];
}> {
  const result = {
    potentialDuplicates: [] as Array<{
      players: DuplicateRecord[];
      similarity: number;
    }>,
    errors: [] as string[],
  };

  try {
    const players = await db.player.findMany({
      select: {
        id: true,
        gomafiaId: true,
        name: true,
        createdAt: true,
        lastSyncAt: true,
      },
    });

    // Simple name similarity check
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const similarity = calculateNameSimilarity(
          players[i].name,
          players[j].name
        );

        if (similarity > 0.8) {
          // 80% similarity threshold
          result.potentialDuplicates.push({
            players: [
              {
                id: players[i].id,
                gomafiaId: players[i].gomafiaId,
                name: players[i].name,
                createdAt: players[i].createdAt,
                lastSyncAt: players[i].lastSyncAt || undefined,
              },
              {
                id: players[j].id,
                gomafiaId: players[j].gomafiaId,
                name: players[j].name,
                createdAt: players[j].createdAt,
                lastSyncAt: players[j].lastSyncAt || undefined,
              },
            ],
            similarity,
          });
        }
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Potential duplicate detection failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Calculate name similarity using Levenshtein distance
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const longer = name1.length > name2.length ? name1 : name2;
  const shorter = name1.length > name2.length ? name2 : name1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}
