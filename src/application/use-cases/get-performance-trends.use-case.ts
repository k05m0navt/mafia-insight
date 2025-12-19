/**
 * GetPerformanceTrendsUseCase - Application layer use case for performance trends
 *
 * Orchestrates repository calls and calculates performance trends with period aggregation,
 * trend indicators, and comparative analysis.
 */

import { TrendsRepository } from '@/infrastructure/persistence/trends.repository';
import type {
  PerformanceTrend,
  TrendComparison,
  PerformanceTrendsResponse,
  DateRange,
  PlayerRole,
  TrendPeriod,
} from '@/types/analytics';
import type { RawTrendDataPoint } from '@/infrastructure/persistence/trends.repository';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns';

/**
 * Domain service for calculating performance trends
 */
export class GetPerformanceTrendsUseCase {
  constructor(private repository: TrendsRepository) {}

  /**
   * Execute the use case: get performance trends for a player
   *
   * @param playerId - Player ID
   * @param period - Aggregation period ('week', 'month', 'quarter')
   * @param dateRange - Optional date range filter
   * @param roles - Optional role filter
   * @returns Performance trends response with trends and comparison
   */
  async execute(
    playerId: string,
    period: TrendPeriod,
    dateRange?: DateRange,
    roles?: PlayerRole[]
  ): Promise<PerformanceTrendsResponse> {
    // Fetch raw data from repository
    const rawData = await this.repository.getTrendData(
      playerId,
      period,
      dateRange,
      roles
    );

    if (rawData.length === 0) {
      return {
        trends: [],
        comparison: undefined,
      };
    }

    // Group data by period and calculate metrics
    const trends = this.calculateTrends(rawData, period);

    // Calculate comparison if we have at least 2 periods
    const comparison =
      trends.length >= 2
        ? this.calculateComparison(
            trends[trends.length - 1],
            trends[trends.length - 2]
          )
        : undefined;

    return {
      trends,
      comparison,
    };
  }

  /**
   * Group raw data by period and calculate metrics for each period
   */
  private calculateTrends(
    rawData: RawTrendDataPoint[],
    period: TrendPeriod
  ): PerformanceTrend[] {
    // Group by period
    const periodMap = new Map<
      string,
      {
        startDate: Date;
        endDate: Date;
        games: RawTrendDataPoint[];
      }
    >();

    for (const point of rawData) {
      const periodKey = this.repository.getPeriodKey(point.gameDate, period);

      if (!periodMap.has(periodKey)) {
        // Calculate period start and end dates
        let startDate: Date;
        let endDate: Date;

        switch (period) {
          case 'week':
            startDate = startOfWeek(point.gameDate, { weekStartsOn: 1 });
            endDate = endOfWeek(point.gameDate, { weekStartsOn: 1 });
            break;
          case 'month':
            startDate = startOfMonth(point.gameDate);
            endDate = endOfMonth(point.gameDate);
            break;
          case 'quarter':
            startDate = startOfQuarter(point.gameDate);
            endDate = endOfQuarter(point.gameDate);
            break;
        }

        periodMap.set(periodKey, {
          startDate,
          endDate,
          games: [],
        });
      }

      const periodData = periodMap.get(periodKey)!;
      periodData.games.push(point);
    }

    // Convert to PerformanceTrend array
    const trends: PerformanceTrend[] = [];
    const sortedPeriods = Array.from(periodMap.entries()).sort(
      (a, b) => a[1].startDate.getTime() - b[1].startDate.getTime()
    );

    for (const [_periodKey, periodData] of sortedPeriods) {
      const games = periodData.games;
      const wins = games.filter((g) => g.isWinner).length;
      const totalGames = games.length;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      // Average ELO for the period (use the ELO after each game)
      const elos = games.map((g) => g.playerEloAfter ?? 0).filter((e) => e > 0);
      const avgELO =
        elos.length > 0
          ? elos.reduce((sum, elo) => sum + elo, 0) / elos.length
          : 0;

      // Calculate trend indicator by comparing to previous period
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let changeFromPrevious = 0;

      if (trends.length > 0) {
        const previousTrend = trends[trends.length - 1];
        const eloChange = avgELO - previousTrend.metrics.elo;
        const winRateChange = winRate - previousTrend.metrics.winRate;

        // Trend is up if both metrics improved, down if both declined, stable otherwise
        if (eloChange > 0 && winRateChange > 0) {
          trend = 'up';
          changeFromPrevious = (eloChange + winRateChange) / 2;
        } else if (eloChange < 0 && winRateChange < 0) {
          trend = 'down';
          changeFromPrevious = (eloChange + winRateChange) / 2;
        } else {
          trend = 'stable';
          changeFromPrevious = eloChange !== 0 ? eloChange : winRateChange;
        }
      }

      trends.push({
        period,
        startDate: periodData.startDate.toISOString(),
        endDate: periodData.endDate.toISOString(),
        metrics: {
          winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
          elo: Math.round(avgELO * 100) / 100, // Round to 2 decimal places
          gamesPlayed: totalGames,
        },
        trend,
        changeFromPrevious: Math.round(changeFromPrevious * 100) / 100,
      });
    }

    return trends;
  }

  /**
   * Calculate comparison between current and previous period
   */
  private calculateComparison(
    current: PerformanceTrend,
    previous: PerformanceTrend
  ): TrendComparison {
    const winRateChange = current.metrics.winRate - previous.metrics.winRate;
    const eloChange = current.metrics.elo - previous.metrics.elo;
    const gamesPlayedChange =
      current.metrics.gamesPlayed > 0 && previous.metrics.gamesPlayed > 0
        ? ((current.metrics.gamesPlayed - previous.metrics.gamesPlayed) /
            previous.metrics.gamesPlayed) *
          100
        : current.metrics.gamesPlayed - previous.metrics.gamesPlayed;

    return {
      currentPeriod: current,
      previousPeriod: previous,
      change: {
        winRate: Math.round(winRateChange * 100) / 100,
        elo: Math.round(eloChange * 100) / 100,
        gamesPlayed: Math.round(gamesPlayedChange * 100) / 100,
      },
    };
  }
}
