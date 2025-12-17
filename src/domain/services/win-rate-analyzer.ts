/**
 * WinRateAnalyzer - Domain service for calculating win rate analysis
 *
 * This service calculates win rates from game participation data:
 * - Overall win rate
 * - Per-role win rates
 * - Scenario-based win rates (tournament vs casual, if available)
 * - Comparison to average win rates (if aggregated data available)
 */

import type { WinRateAnalysis } from '@/types/analytics';
import type { PlayerRole } from '@prisma/client';

/**
 * Raw participation data for win rate calculation
 */
export interface WinRateParticipationData {
  role: PlayerRole;
  isWinner: boolean;
  gameId: string;
  tournamentId?: string | null; // For scenario-based analysis
}

/**
 * Domain service for win rate analysis calculations
 *
 * This service contains pure business logic for calculating win rates.
 * It handles edge cases like division by zero and missing data gracefully.
 */
export class WinRateAnalyzer {
  /**
   * Calculate overall win rate
   *
   * @param data - Array of participation data
   * @returns Overall win rate percentage (0-100), or 0 if no games
   *
   * @example
   * ```typescript
   * const winRate = analyzer.calculateOverallWinRate([
   *   { role: 'DON', isWinner: true, gameId: 'game1' },
   *   { role: 'MAFIA', isWinner: false, gameId: 'game2' }
   * ]);
   * // Returns 50 (50% win rate)
   * ```
   */
  calculateOverallWinRate(data: WinRateParticipationData[]): number {
    if (data.length === 0) {
      return 0;
    }

    const wins = data.filter((d) => d.isWinner).length;
    const total = data.length;

    if (total === 0) {
      return 0;
    }

    return Math.round((wins / total) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate per-role win rates
   *
   * @param data - Array of participation data
   * @returns Record mapping role to win rate percentage (0-100)
   *
   * @example
   * ```typescript
   * const byRole = analyzer.calculatePerRoleWinRates([
   *   { role: 'DON', isWinner: true, gameId: 'game1' },
   *   { role: 'DON', isWinner: false, gameId: 'game2' },
   *   { role: 'MAFIA', isWinner: true, gameId: 'game3' }
   * ]);
   * // Returns { DON: 50, MAFIA: 100, SHERIFF: 0, CITIZEN: 0 }
   * ```
   */
  calculatePerRoleWinRates(
    data: WinRateParticipationData[]
  ): Record<string, number> {
    const allRoles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];
    const result: Record<string, number> = {};

    for (const role of allRoles) {
      const roleData = data.filter((d) => d.role === role);

      if (roleData.length === 0) {
        result[role] = 0;
        continue;
      }

      const wins = roleData.filter((d) => d.isWinner).length;
      const total = roleData.length;

      result[role] =
        total > 0
          ? Math.round((wins / total) * 100 * 100) / 100 // Round to 2 decimal places
          : 0;
    }

    return result;
  }

  /**
   * Calculate scenario-based win rates (tournament vs casual)
   *
   * @param data - Array of participation data with tournamentId
   * @returns Record mapping scenario to win rate percentage, or undefined if no scenario data
   *
   * **Behavior:**
   * - Returns `undefined` if no tournament data exists at all (all games are casual)
   * - Returns a result with both `tournament` and `casual` keys if any tournament data exists
   * - If one category has no games, it returns 0% for that category
   * - Example: Player with only tournament games returns `{ tournament: 75, casual: 0 }`
   *
   * @example
   * ```typescript
   * const byScenario = analyzer.calculateScenarioWinRates([
   *   { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: 'tour1' },
   *   { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null }
   * ]);
   * // Returns { tournament: 100, casual: 0 } or undefined if no tournament data
   * ```
   */
  calculateScenarioWinRates(
    data: WinRateParticipationData[]
  ): Record<string, number> | undefined {
    // Check if we have any tournament data
    // If no tournament data exists, return undefined (all games are casual, so scenario breakdown isn't meaningful)
    const hasTournamentData = data.some(
      (d) => d.tournamentId !== null && d.tournamentId !== undefined
    );

    if (!hasTournamentData) {
      return undefined;
    }

    const tournamentData = data.filter(
      (d) => d.tournamentId !== null && d.tournamentId !== undefined
    );
    const casualData = data.filter(
      (d) => d.tournamentId === null || d.tournamentId === undefined
    );

    const result: Record<string, number> = {};

    // Calculate tournament win rate
    // If no tournament games, return 0% (player has casual games but no tournament games in this dataset)
    if (tournamentData.length > 0) {
      const tournamentWins = tournamentData.filter((d) => d.isWinner).length;
      result.tournament =
        Math.round((tournamentWins / tournamentData.length) * 100 * 100) / 100;
    } else {
      result.tournament = 0;
    }

    // Calculate casual win rate
    // If no casual games, return 0% (player has tournament games but no casual games in this dataset)
    if (casualData.length > 0) {
      const casualWins = casualData.filter((d) => d.isWinner).length;
      result.casual =
        Math.round((casualWins / casualData.length) * 100 * 100) / 100;
    } else {
      result.casual = 0;
    }

    return result;
  }

  /**
   * Calculate comparison to average win rates
   *
   * @param winRates - Calculated win rate analysis
   * @param averageWinRates - Optional average win rates for comparison
   * @returns Difference from average (positive = above average, negative = below average), or undefined if no average data
   *
   * @example
   * ```typescript
   * const comparison = analyzer.calculateComparisonToAverage(
   *   { overall: 55, byRole: { DON: 60 } },
   *   { overall: 50, byRole: { DON: 55 } }
   * );
   * // Returns 5 (5% above average overall)
   * ```
   */
  calculateComparisonToAverage(
    winRates: WinRateAnalysis,
    averageWinRates?: WinRateAnalysis
  ): number | undefined {
    if (!averageWinRates) {
      return undefined;
    }

    // Compare overall win rates
    const difference = winRates.overall - averageWinRates.overall;
    return Math.round(difference * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate win/loss counts for overall and by role
   *
   * @param data - Array of participation data
   * @returns Win/loss counts structure
   */
  calculateWinLossCounts(data: WinRateParticipationData[]): {
    overall: {
      wins: number;
      losses: number;
      total: number;
    };
    byRole: Record<
      string,
      {
        wins: number;
        losses: number;
        total: number;
      }
    >;
  } {
    const allRoles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];

    // Calculate overall counts
    const overallWins = data.filter((d) => d.isWinner).length;
    const overallLosses = data.filter((d) => !d.isWinner).length;

    // Calculate per-role counts
    const byRole: Record<
      string,
      {
        wins: number;
        losses: number;
        total: number;
      }
    > = {};

    for (const role of allRoles) {
      const roleData = data.filter((d) => d.role === role);
      const wins = roleData.filter((d) => d.isWinner).length;
      const losses = roleData.filter((d) => !d.isWinner).length;

      byRole[role] = {
        wins,
        losses,
        total: roleData.length,
      };
    }

    return {
      overall: {
        wins: overallWins,
        losses: overallLosses,
        total: data.length,
      },
      byRole,
    };
  }

  /**
   * Calculate complete win rate analysis
   *
   * This is the main method that combines all calculations into a single WinRateAnalysis object.
   *
   * @param data - Array of participation data
   * @param averageWinRates - Optional average win rates for comparison
   * @returns Complete WinRateAnalysis object
   */
  calculateWinRateAnalysis(
    data: WinRateParticipationData[],
    averageWinRates?: WinRateAnalysis
  ): WinRateAnalysis {
    const overall = this.calculateOverallWinRate(data);
    const byRole = this.calculatePerRoleWinRates(data);
    const byScenario = this.calculateScenarioWinRates(data);
    const comparisonToAverage = this.calculateComparisonToAverage(
      { overall, byRole, byScenario },
      averageWinRates
    );
    const winLossCounts = this.calculateWinLossCounts(data);

    return {
      overall,
      byRole,
      byScenario,
      comparisonToAverage,
      winLossCounts,
    };
  }
}
