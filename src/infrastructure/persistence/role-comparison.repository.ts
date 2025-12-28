/**
 * RoleComparisonRepository - Infrastructure layer repository for querying role comparison data
 */

import { prisma } from '@/lib/db';
import type { DateRange, PlayerRole } from '@/types/analytics';

/**
 * Raw role comparison data from database query
 */
export interface RawRoleComparisonData {
  role: PlayerRole;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalELO: number;
  eloCount: number;
  participations: Array<{
    gameDate: Date;
    isWinner: boolean;
  }>;
}

/**
 * Repository for querying role comparison data from database
 *
 * This repository handles all database queries related to role comparison.
 * It follows the Repository pattern from Clean Architecture, isolating data access
 * concerns from domain logic.
 */
export class RoleComparisonRepository {
  /**
   * Get role comparison data for a player
   *
   * Fetches aggregated metrics per role with date range and role filtering.
   * Returns raw data that can be processed by the domain service to calculate
   * win rates, average ELO, and win streaks.
   *
   * @param playerId - Player ID to query (UUID format)
   * @param dateRange - Optional date range filter with startDate, endDate, or preset
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Promise resolving to array of RawRoleComparisonData grouped by role
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const data = await repository.getRoleComparison(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async getRoleComparison(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<RawRoleComparisonData[]> {
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
      select: { id: true },
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
        role: true,
        isWinner: true,
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

    // Group by role and calculate aggregates
    const roleMap = new Map<
      PlayerRole,
      {
        gamesPlayed: number;
        wins: number;
        losses: number;
        totalELO: number;
        eloCount: number;
        participations: Array<{
          gameDate: Date;
          isWinner: boolean;
        }>;
      }
    >();

    // We need to calculate ELO after each game
    // Start with current player ELO and work backwards
    const playerWithELO = await prisma.player.findUnique({
      where: { id: playerId },
      select: { eloRating: true },
    });

    let runningELO = playerWithELO?.eloRating ?? 1200;

    // Process from most recent to oldest (reverse order) to calculate ELO at each game
    const reversed = [...participations].reverse();
    const eloByGame = new Map<string, number>();

    for (const p of reversed) {
      // ELO after this game
      const eloAfterGame = runningELO;
      eloByGame.set(p.game.id, eloAfterGame);

      // ELO before this game (for next iteration going backwards)
      const eloBeforeGame = runningELO - (p.eloChange ?? 0);
      runningELO = eloBeforeGame;
    }

    // Now process in chronological order to group by role
    for (const p of participations) {
      const role = p.role as PlayerRole;
      const eloAfterGame = eloByGame.get(p.game.id) ?? 0;

      if (!roleMap.has(role)) {
        roleMap.set(role, {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          totalELO: 0,
          eloCount: 0,
          participations: [],
        });
      }

      const roleData = roleMap.get(role)!;
      roleData.gamesPlayed += 1;
      if (p.isWinner) {
        roleData.wins += 1;
      } else {
        roleData.losses += 1;
      }

      if (eloAfterGame > 0) {
        roleData.totalELO += eloAfterGame;
        roleData.eloCount += 1;
      }

      roleData.participations.push({
        gameDate: p.game.date,
        isWinner: p.isWinner,
      });
    }

    // Convert to RawRoleComparisonData array
    const result: RawRoleComparisonData[] = [];
    for (const [role, data] of roleMap.entries()) {
      result.push({
        role,
        gamesPlayed: data.gamesPlayed,
        wins: data.wins,
        losses: data.losses,
        totalELO: data.totalELO,
        eloCount: data.eloCount,
        participations: data.participations,
      });
    }

    return result;
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
