/**
 * WinRateRepository - Infrastructure layer repository for querying win rate data
 */

import { prisma } from '@/lib/db';
import type { PlayerRole } from '@prisma/client';
import type { DateRange } from '@/types/analytics';
import type { WinRateParticipationData } from '@/domain/services/win-rate-analyzer';

/**
 * Repository for querying win rate data from database
 *
 * This repository handles all database queries related to win rate analysis.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class WinRateRepository {
  /**
   * Get win rate participation data for a player
   *
   * Aggregates game participation data with win/loss records, filtered by
   * date range and roles. Returns raw participation data that can be processed
   * by the domain service.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Promise resolving to array of WinRateParticipationData
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getWinRateData(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async getWinRateData(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<WinRateParticipationData[]> {
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

    // Query participations with optimized filtering
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
        role: true,
        isWinner: true,
        gameId: true,
        game: {
          select: {
            tournamentId: true,
          },
        },
      },
    });

    // Transform to domain model
    return participations.map((p) => ({
      role: p.role,
      isWinner: p.isWinner,
      gameId: p.gameId,
      tournamentId: p.game.tournamentId,
    }));
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
