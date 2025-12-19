/**
 * GetRoleComparisonUseCase - Application layer use case for role comparison
 *
 * Orchestrates repository calls and calculates role comparison metrics including
 * win rates, average ELO, games played, win streaks, and best-performing role.
 */

import { RoleComparisonRepository } from '@/infrastructure/persistence/role-comparison.repository';
import type {
  RoleComparison,
  RoleComparisonMetrics,
  DateRange,
  PlayerRole,
} from '@/types/analytics';

/**
 * Domain service for calculating role comparison
 */
export class GetRoleComparisonUseCase {
  constructor(private repository: RoleComparisonRepository) {}

  /**
   * Execute the use case: get role comparison for a player
   *
   * @param playerId - Player ID
   * @param dateRange - Optional date range filter
   * @param roles - Optional role filter
   * @returns Role comparison response with metrics and best-performing role
   */
  async execute(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<RoleComparison> {
    // Fetch raw data from repository
    const rawData = await this.repository.getRoleComparison(
      playerId,
      dateRange,
      roles
    );

    if (rawData.length === 0) {
      // Return empty comparison
      return {
        roles: [],
        bestPerformingRole: 'CITIZEN' as PlayerRole, // Default fallback
        metrics: {
          winRate: {},
          gamesPlayed: {},
          averageELO: {},
          winStreak: {},
        },
      };
    }

    // Calculate metrics for each role
    const roleMetrics: RoleComparisonMetrics[] = rawData.map((data) => {
      const winRate =
        data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0;
      const averageELO = data.eloCount > 0 ? data.totalELO / data.eloCount : 0;
      const winStreak = this.calculateWinStreak(data.participations);

      return {
        role: data.role,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        gamesPlayed: data.gamesPlayed,
        averageELO: Math.round(averageELO * 100) / 100, // Round to 2 decimal places
        winStreak,
      };
    });

    // Calculate best-performing role (based on win rate and ELO)
    const bestPerformingRole = this.calculateBestPerformingRole(roleMetrics);

    // Build metrics records for chart display
    const metrics = {
      winRate: {} as Record<string, number>,
      gamesPlayed: {} as Record<string, number>,
      averageELO: {} as Record<string, number>,
      winStreak: {} as Record<string, number>,
    };

    for (const metric of roleMetrics) {
      metrics.winRate[metric.role] = metric.winRate;
      metrics.gamesPlayed[metric.role] = metric.gamesPlayed;
      metrics.averageELO[metric.role] = metric.averageELO;
      metrics.winStreak[metric.role] = metric.winStreak;
    }

    return {
      roles: roleMetrics,
      bestPerformingRole,
      metrics,
    };
  }

  /**
   * Calculate win streak for a role
   *
   * Win streak is the number of consecutive wins from the most recent games.
   * If the most recent game is a loss, streak is 0.
   *
   * @param participations - Array of participations ordered chronologically (oldest first)
   * @returns Current win streak (number of consecutive wins from the end)
   */
  private calculateWinStreak(
    participations: Array<{
      gameDate: Date;
      isWinner: boolean;
    }>
  ): number {
    if (participations.length === 0) {
      return 0;
    }

    // Process from most recent to oldest (reverse order)
    const reversed = [...participations].reverse();
    let streak = 0;

    for (const p of reversed) {
      if (p.isWinner) {
        streak += 1;
      } else {
        // First loss breaks the streak
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate best-performing role based on win rate and ELO
   *
   * Best-performing role is determined by:
   * 1. Higher win rate (primary factor)
   * 2. Higher average ELO (secondary factor, used as tiebreaker)
   * 3. More games played (tertiary factor, used as second tiebreaker)
   *
   * @param roleMetrics - Array of role metrics
   * @returns Best-performing role
   */
  private calculateBestPerformingRole(
    roleMetrics: RoleComparisonMetrics[]
  ): PlayerRole {
    if (roleMetrics.length === 0) {
      return 'CITIZEN' as PlayerRole; // Default fallback
    }

    // Sort by win rate (desc), then average ELO (desc), then games played (desc)
    const sorted = [...roleMetrics].sort((a, b) => {
      // Primary: win rate
      if (a.winRate !== b.winRate) {
        return b.winRate - a.winRate;
      }

      // Secondary: average ELO
      if (a.averageELO !== b.averageELO) {
        return b.averageELO - a.averageELO;
      }

      // Tertiary: games played (more games = more reliable)
      return b.gamesPlayed - a.gamesPlayed;
    });

    return sorted[0].role;
  }
}
