/**
 * PerformanceStatsAggregator - Domain service for calculating performance summary statistics
 *
 * This service handles all business logic for aggregating performance statistics
 * from game participation data. It follows Clean Architecture principles by
 * keeping business logic separate from data access and presentation concerns.
 */

import type { PerformanceSummary } from '@/types/analytics';
import type { DateRange, PlayerRole } from '@/types/analytics';
import {
  PerformanceSummaryRepository,
  type PerformanceSummaryParticipationData,
} from '@/infrastructure/persistence/performance-summary.repository';

/**
 * Domain service for aggregating performance statistics
 */
export class PerformanceStatsAggregator {
  constructor(
    private readonly repository: PerformanceSummaryRepository = new PerformanceSummaryRepository()
  ) {}

  /**
   * Calculate performance summary for a player
   *
   * Aggregates all performance statistics including:
   * - Total games, wins, losses, win percentage
   * - Average game duration (if available)
   * - Longest win streak
   * - Best ELO achieved
   * - Recent activity (last 7 days, last 30 days)
   *
   * @param playerId - Player ID to calculate summary for
   * @param dateRange - Optional date range filter
   * @param roles - Optional role filter
   * @returns Promise resolving to PerformanceSummary
   * @throws Error if player not found or calculation fails
   *
   * @example
   * ```typescript
   * const aggregator = new PerformanceStatsAggregator();
   * const summary = await aggregator.calculateSummary(
   *   'player-id',
   *   { startDate: '2024-01-01', endDate: '2024-12-31' },
   *   ['DON', 'MAFIA']
   * );
   * ```
   */
  async calculateSummary(
    playerId: string,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<PerformanceSummary> {
    // Fetch participation data
    const [participationData, recentActivity] = await Promise.all([
      this.repository.getPerformanceSummaryData(playerId, dateRange, roles),
      this.repository.getRecentActivity(playerId, dateRange, roles),
    ]);

    // Calculate basic statistics
    const totalGames = participationData.length;
    const totalWins = participationData.filter((p) => p.isWinner).length;
    const totalLosses = totalGames - totalWins;
    const winPercentage = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    // Calculate average game duration (if available)
    const gamesWithDuration = participationData.filter(
      (p) => p.durationMinutes !== null && p.durationMinutes !== undefined
    );
    const averageGameDuration =
      gamesWithDuration.length > 0
        ? gamesWithDuration.reduce(
            (sum, p) => sum + (p.durationMinutes ?? 0),
            0
          ) / gamesWithDuration.length
        : undefined;

    // Calculate longest win streak
    const longestWinStreak = this.calculateLongestWinStreak(participationData);

    // Calculate best ELO achieved
    // Note: For accurate best ELO, we'd need historical ELO tracking.
    // For now, we use the maximum ELO from participation data or current player ELO
    const bestELOAchieved = this.calculateBestELO(participationData);

    return {
      totalGames,
      totalWins,
      totalLosses,
      winPercentage: Math.round(winPercentage * 100) / 100, // Round to 2 decimal places
      averageGameDuration:
        averageGameDuration !== undefined
          ? Math.round(averageGameDuration * 100) / 100
          : undefined,
      longestWinStreak,
      bestELOAchieved,
      recentActivity,
    };
  }

  /**
   * Calculate longest win streak from participation data
   *
   * Finds the maximum number of consecutive wins in chronological order.
   *
   * @param participationData - Array of participation data in chronological order
   * @returns Longest win streak count
   */
  private calculateLongestWinStreak(
    participationData: PerformanceSummaryParticipationData[]
  ): number {
    if (participationData.length === 0) {
      return 0;
    }

    let longestStreak = 0;
    let currentStreak = 0;

    for (const participation of participationData) {
      if (participation.isWinner) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  }

  /**
   * Calculate best ELO achieved from participation data
   *
   * Finds the maximum ELO rating across all games. Since we're using current ELO
   * as an approximation for historical ELOs, this will return the current ELO.
   * For accurate historical best ELO, we'd need to track ELO after each game.
   *
   * @param participationData - Array of participation data
   * @returns Best ELO rating achieved (current ELO as approximation)
   */
  private calculateBestELO(
    participationData: PerformanceSummaryParticipationData[]
  ): number {
    if (participationData.length === 0) {
      return 0;
    }

    const eloRatings = participationData
      .map((p) => p.eloRating)
      .filter((elo): elo is number => elo !== null && elo !== undefined);

    if (eloRatings.length === 0) {
      return 0;
    }

    // Return the maximum ELO (which will be current ELO in our approximation)
    return Math.max(...eloRatings);
  }
}
