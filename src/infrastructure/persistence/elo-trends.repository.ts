/**
 * ELOTrendsRepository - Infrastructure layer repository for querying ELO trends
 */

import { prisma } from '@/lib/db';
import type { DateRange } from '@/types/analytics';

/**
 * Raw ELO data point from database
 */
export interface RawELODataPoint {
  gameId: string;
  gameDate: Date;
  eloChange: number | null;
  playerEloAfter: number | null; // We'll calculate this
}

/**
 * Repository for querying ELO trends from database
 *
 * This repository handles all database queries related to ELO trends.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class ELOTrendsRepository {
  /**
   * Get ELO trend data for a player
   *
   * Fetches game participation data with ELO changes, ordered chronologically.
   * Returns raw data that can be processed by the domain service to calculate
   * historical ELO values.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @returns Promise resolving to array of RawELODataPoint ordered by game date
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getELOTrendData(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' }
   * );
   * ```
   */
  async getELOTrendData(
    playerId: string,
    dateRange?: DateRange
  ): Promise<RawELODataPoint[]> {
    // Build date filter for game date
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateRange?.startDate) {
      dateFilter.gte = new Date(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      dateFilter.lte = new Date(dateRange.endDate);
    }

    // Get player's current ELO
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { eloRating: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Query participations with game data, ordered chronologically
    const participations = await prisma.gameParticipation.findMany({
      where: {
        playerId,
        game: {
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
          status: 'COMPLETED', // Only count completed games
        },
      },
      select: {
        gameId: true,
        eloChange: true,
        game: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: {
        game: {
          date: 'asc', // Chronological order (oldest first)
        },
      },
    });

    // Transform to RawELODataPoint format
    return participations.map((p) => ({
      gameId: p.game.id,
      gameDate: p.game.date,
      eloChange: p.eloChange ?? 0,
      playerEloAfter: null, // Will be calculated by domain service
    }));
  }

  /**
   * Get player's current ELO rating
   *
   * @param playerId - Player ID to query
   * @returns Promise resolving to current ELO rating
   * @throws Error if player not found
   */
  async getCurrentELO(playerId: string): Promise<number> {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { eloRating: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    return player.eloRating;
  }

  /**
   * Verify that a player exists and optionally check ownership
   *
   * Used for authorization checks to ensure users can only access their own player data,
   * or admins can access any player's data.
   *
   * @param playerId - Player ID to verify (UUID format)
   * @param userId - Optional user ID to verify ownership. If provided, checks if the player belongs to this user
   * @returns Promise resolving to true if player exists (and optionally belongs to user), false otherwise
   *
   * @example
   * ```typescript
   * // Check if player exists
   * const exists = await repository.verifyPlayerAccess('player-id');
   *
   * // Check if player belongs to user
   * const hasAccess = await repository.verifyPlayerAccess('player-id', 'user-id');
   * ```
   */
  async verifyPlayerAccess(
    playerId: string,
    userId?: string
  ): Promise<boolean> {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!player) {
      return false;
    }

    // If userId provided, verify ownership
    if (userId && player.userId !== userId) {
      return false;
    }

    return true;
  }
}
