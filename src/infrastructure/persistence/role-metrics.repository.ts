/**
 * RoleMetricsRepository - Infrastructure layer repository for querying role-based metrics
 */

import { prisma } from '@/lib/db';
import type { PlayerRole } from '@prisma/client';
import type { DateRange } from '@/types/analytics';
import type { GameParticipationData } from '@/domain/services/role-metrics-calculator';

/**
 * Repository for querying role-based metrics from database
 *
 * This repository handles all database queries related to role-based performance metrics.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class RoleMetricsRepository {
  /**
   * Get role-based participation data for a player
   *
   * Aggregates game participation data by role with optional date and role filtering.
   * Returns raw participation data that can be processed by the domain service.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Promise resolving to array of GameParticipationData grouped by role
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getRoleParticipationData(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async getRoleParticipationData(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<GameParticipationData[]> {
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

    // Get player's current ELO for average calculation
    // NOTE: We use current ELO as approximation since we don't store historical ELO per game
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { eloRating: true },
    });

    const currentELO = player?.eloRating || 0;

    // Query participations with optimized filtering
    // Using groupBy would be ideal but Prisma's groupBy has limitations, so we use aggregation query
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
      },
    });

    // Aggregate data by role (in-memory aggregation is fast for typical dataset sizes)
    const roleMap = new Map<PlayerRole, GameParticipationData>();

    for (const participation of participations) {
      const role = participation.role as PlayerRole;

      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          totalELO: 0,
        });
      }

      const data = roleMap.get(role)!;
      data.gamesPlayed += 1;

      if (participation.isWinner) {
        data.wins += 1;
      } else {
        data.losses += 1;
      }

      // Use current ELO for all games (approximation)
      data.totalELO += currentELO;
    }

    return Array.from(roleMap.values());
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
