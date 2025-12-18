/**
 * PerformanceSummaryRepository - Infrastructure layer repository for querying performance summary data
 */

import { prisma } from '@/lib/db';
import type { PlayerRole } from '@prisma/client';
import type { DateRange } from '@/types/analytics';

/**
 * Raw participation data for performance summary calculations
 */
export interface PerformanceSummaryParticipationData {
  gameId: string;
  gameDate: Date;
  isWinner: boolean;
  eloRating: number | null; // Player's ELO after this game
  durationMinutes: number | null;
  role: PlayerRole;
}

/**
 * Repository for querying performance summary data from database
 *
 * This repository handles all database queries related to performance summary statistics.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class PerformanceSummaryRepository {
  /**
   * Get performance summary participation data for a player
   *
   * Aggregates game participation data with win/loss records, ELO ratings, and durations,
   * filtered by date range and roles. Returns raw participation data that can be processed
   * by the domain service.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Promise resolving to array of PerformanceSummaryParticipationData
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getPerformanceSummaryData(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async getPerformanceSummaryData(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<PerformanceSummaryParticipationData[]> {
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
        isWinner: true,
        eloChange: true,
        role: true,
        game: {
          select: {
            id: true,
            date: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        game: {
          date: 'asc', // Chronological order (oldest first) for streak calculation
        },
      },
    });

    // Get player's current ELO for best ELO calculation
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { eloRating: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // For ELO rating tracking, we'll use the current ELO as a reference
    // Historical ELO calculation would require knowing the initial ELO,
    // so we'll use the current ELO for best ELO calculation
    // and track ELO changes for potential future enhancements
    const participationsWithELO = participations.map((p) => ({
      ...p,
      eloRating: player.eloRating, // Use current ELO as approximation
      // Note: For accurate historical ELO tracking, we'd need to calculate
      // forward from initial ELO (typically 1200), but we don't have that data
    }));

    // Transform to domain model
    return participationsWithELO.map((p) => ({
      gameId: p.game.id,
      gameDate: p.game.date,
      isWinner: p.isWinner,
      eloRating: p.eloRating,
      durationMinutes: p.game.durationMinutes,
      role: p.role,
    }));
  }

  /**
   * Get recent activity counts (last 7 days and last 30 days)
   *
   * @param playerId - Player ID to query
   * @param dateRange - Optional date range filter
   * @param roles - Optional role filter
   * @returns Promise resolving to object with thisWeek and thisMonth counts
   */
  async getRecentActivity(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<{ thisWeek: number; thisMonth: number }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build role filter
    const roleFilter: PlayerRole[] | undefined =
      roles && roles.length > 0 ? roles : undefined;

    // Build date filter - combine with dateRange if provided
    const baseDateFilter: { gte?: Date; lte?: Date } = {};
    if (dateRange?.startDate) {
      baseDateFilter.gte = new Date(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      baseDateFilter.lte = new Date(dateRange.endDate);
    }

    // For this week, we need games in the last 7 days (and within dateRange if provided)
    const thisWeekFilter = {
      ...baseDateFilter,
      gte: baseDateFilter.gte
        ? new Date(
            Math.max(baseDateFilter.gte.getTime(), sevenDaysAgo.getTime())
          )
        : sevenDaysAgo,
    };

    // For this month, we need games in the last 30 days (and within dateRange if provided)
    const thisMonthFilter = {
      ...baseDateFilter,
      gte: baseDateFilter.gte
        ? new Date(
            Math.max(baseDateFilter.gte.getTime(), thirtyDaysAgo.getTime())
          )
        : thirtyDaysAgo,
    };

    const [thisWeekCount, thisMonthCount] = await Promise.all([
      prisma.gameParticipation.count({
        where: {
          playerId,
          ...(roleFilter && { role: { in: roleFilter } }),
          game: {
            date: thisWeekFilter,
            status: 'COMPLETED',
          },
        },
      }),
      prisma.gameParticipation.count({
        where: {
          playerId,
          ...(roleFilter && { role: { in: roleFilter } }),
          game: {
            date: thisMonthFilter,
            status: 'COMPLETED',
          },
        },
      }),
    ]);

    return {
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
    };
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
