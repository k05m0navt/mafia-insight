/**
 * TrendsRepository - Infrastructure layer repository for querying performance trends
 */

import { prisma } from '@/lib/db';
import type { DateRange, PlayerRole, TrendPeriod } from '@/types/analytics';
import { startOfWeek, startOfMonth, startOfQuarter, format } from 'date-fns';

/**
 * Raw trend data point from database query
 */
export interface RawTrendDataPoint {
  gameId: string;
  gameDate: Date;
  eloChange: number | null;
  playerEloAfter: number | null;
  isWinner: boolean;
  role: PlayerRole;
}

/**
 * Repository for querying performance trends from database
 *
 * This repository handles all database queries related to performance trends.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class TrendsRepository {
  /**
   * Get trend data for a player grouped by period
   *
   * Fetches game participation data with win/loss information, ordered chronologically.
   * Returns raw data that can be processed by the domain service to calculate
   * trends grouped by week, month, or quarter.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param period - Aggregation period ('week', 'month', 'quarter')
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Promise resolving to array of RawTrendDataPoint ordered by game date
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getTrendData(
   *   'player-id',
   *   'month',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async getTrendData(
    playerId: string,
    period: TrendPeriod,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<RawTrendDataPoint[]> {
    // Build date filter for game date
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateRange?.startDate) {
      dateFilter.gte = new Date(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      dateFilter.lte = new Date(dateRange.endDate);
    }

    // Build role filter
    const roleFilter: PlayerRole[] | undefined =
      roles && roles.length > 0 ? roles : undefined;

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, eloRating: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Query participations with game data, ordered chronologically
    const participations = await prisma.gameParticipation.findMany({
      where: {
        playerId,
        ...(roleFilter && { role: { in: roleFilter } }),
        game: {
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
          status: 'COMPLETED', // Only count completed games
        },
      },
      select: {
        gameId: true,
        eloChange: true,
        isWinner: true,
        role: true,
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

    // Transform to RawTrendDataPoint format
    // We need to calculate the ELO after each game by working backwards from current ELO
    const transformed: RawTrendDataPoint[] = [];
    let runningELO = player.eloRating;

    // Process from most recent to oldest (reverse order)
    const reversed = [...participations].reverse();

    for (const p of reversed) {
      // ELO before this game
      const eloBeforeGame = runningELO - (p.eloChange ?? 0);
      const eloAfterGame = runningELO;

      transformed.unshift({
        gameId: p.game.id,
        gameDate: p.game.date,
        eloChange: p.eloChange ?? 0,
        playerEloAfter: eloAfterGame,
        isWinner: p.isWinner,
        role: p.role as PlayerRole,
      });

      // Update running ELO for next iteration (going backwards)
      runningELO = eloBeforeGame;
    }

    return transformed;
  }

  /**
   * Get period key for a given date and period type
   *
   * @param date - Date to get period key for
   * @param period - Period type ('week', 'month', 'quarter')
   * @returns Period key string (format varies by period)
   */
  getPeriodKey(date: Date, period: TrendPeriod): string {
    switch (period) {
      case 'week': {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
        return format(weekStart, 'yyyy-MM-dd');
      }
      case 'month': {
        const monthStart = startOfMonth(date);
        return format(monthStart, 'yyyy-MM-dd');
      }
      case 'quarter': {
        const quarterStart = startOfQuarter(date);
        return format(quarterStart, 'yyyy-MM-dd');
      }
    }
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
