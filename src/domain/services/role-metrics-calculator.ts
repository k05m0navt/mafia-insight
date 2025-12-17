/**
 * RoleMetricsCalculator - Domain service for calculating role-based performance metrics
 *
 * This service calculates performance metrics (win rate, games played, average ELO)
 * per role for a given player.
 */

import type {
  RoleMetrics,
  PlayerRole,
  PerformanceLevel,
} from '@/types/analytics';

/**
 * Raw participation data from database queries
 */
export interface GameParticipationData {
  role: PlayerRole;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalELO: number; // Sum of ELO for calculation of average
}

/**
 * Calculates performance level based on win rate
 * @param winRate - Win rate percentage (0-100)
 * @returns Performance level indicator
 */
function calculatePerformanceLevel(winRate: number): PerformanceLevel {
  if (winRate >= 60) {
    return 'excellent';
  } else if (winRate >= 45) {
    return 'good';
  } else {
    return 'needs_improvement';
  }
}

/**
 * Domain service for calculating role-based performance metrics
 *
 * This service contains the business logic for calculating role-based metrics
 * from raw participation data. It ensures all four roles (DON, MAFIA, SHERIFF, CITIZEN)
 * are always represented in the output, even if no data exists for a role.
 */
export class RoleMetricsCalculator {
  /**
   * Calculate role metrics from participation data
   *
   * Processes raw participation data and calculates win rate, games played,
   * wins, losses, average ELO, and performance level for each role.
   * Always returns metrics for all four roles, with zero values for roles with no data.
   *
   * @param participationData - Raw participation data grouped by role from repository
   * @returns Array of RoleMetrics for each role (always 4 items: DON, MAFIA, SHERIFF, CITIZEN)
   *
   * @example
   * ```typescript
   * const metrics = calculator.calculateRoleMetrics([
   *   { role: 'DON', gamesPlayed: 10, wins: 6, losses: 4, totalELO: 12000 },
   *   { role: 'MAFIA', gamesPlayed: 5, wins: 3, losses: 2, totalELO: 6000 }
   * ]);
   * // Returns 4 RoleMetrics objects (one for each role)
   * ```
   */
  calculateRoleMetrics(
    participationData: GameParticipationData[]
  ): RoleMetrics[] {
    // Ensure we always return metrics for all four roles
    const allRoles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];

    return allRoles.map((role) => {
      const data = participationData.find((d) => d.role === role);

      // If no data for this role, return empty metrics
      if (!data || data.gamesPlayed === 0) {
        return {
          role,
          winRate: 0,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          averageELO: 0,
          performanceLevel: 'needs_improvement',
        };
      }

      // Calculate win rate percentage (handle division by zero)
      const winRate =
        data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0;

      // Calculate average ELO (handle division by zero)
      const averageELO =
        data.gamesPlayed > 0 ? data.totalELO / data.gamesPlayed : 0;

      return {
        role,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        gamesPlayed: data.gamesPlayed,
        wins: data.wins,
        losses: data.losses,
        averageELO: Math.round(averageELO * 100) / 100, // Round to 2 decimal places
        performanceLevel: calculatePerformanceLevel(winRate),
      };
    });
  }

  /**
   * Filter role metrics by role list
   *
   * Filters the provided role metrics array to include only the specified roles.
   * If no roles are provided or the list is empty, returns all metrics unchanged.
   *
   * @param metrics - Array of RoleMetrics to filter
   * @param roles - Optional list of roles to filter by (DON, MAFIA, SHERIFF, CITIZEN)
   * @returns Filtered array of RoleMetrics containing only the specified roles
   *
   * @example
   * ```typescript
   * const filtered = calculator.filterByRoles(allMetrics, ['DON', 'MAFIA']);
   * // Returns only DON and MAFIA metrics
   * ```
   */
  filterByRoles(metrics: RoleMetrics[], roles?: PlayerRole[]): RoleMetrics[] {
    if (!roles || roles.length === 0) {
      return metrics;
    }

    return metrics.filter((m) => roles.includes(m.role));
  }
}
