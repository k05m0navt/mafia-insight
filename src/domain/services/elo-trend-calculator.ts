/**
 * ELOTrendCalculator - Domain service for calculating ELO trends
 *
 * This service calculates ELO progression over time from historical game data.
 * It aggregates ELO data by time period and calculates statistics like current ELO,
 * historical high/low values, and change indicators.
 */

import type { ELOTrendPoint, ELOTrendPeriod } from '@/types/analytics';
import type { RawELODataPoint } from '@/infrastructure/persistence/elo-trends.repository';

/**
 * Calculates historical ELO values from raw game data
 *
 * Works backwards from current ELO by subtracting eloChange values.
 * This gives us the ELO rating at each game date.
 *
 * @param rawData - Raw ELO data points ordered chronologically (oldest first)
 * @param currentELO - Player's current ELO rating
 * @returns Array of ELO trend points with calculated ELO values
 */
function calculateHistoricalELO(
  rawData: RawELODataPoint[],
  currentELO: number
): ELOTrendPoint[] {
  // Work backwards from current ELO
  // Since data is ordered oldest first, we need to reverse to work backwards
  const reversed = [...rawData].reverse();
  let runningELO = currentELO;

  const trendPoints: ELOTrendPoint[] = [];

  // Process from most recent to oldest
  for (const point of reversed) {
    // Subtract the eloChange to get the ELO before this game
    // Then this game's ELO is runningELO - eloChange
    const eloBeforeGame = runningELO - (point.eloChange ?? 0);
    const eloAfterGame = runningELO;

    // Store the ELO after this game (which is the ELO before the next game in reverse order)
    trendPoints.unshift({
      date: point.gameDate.toISOString(),
      elo: eloAfterGame,
      gameId: point.gameId,
    });

    // Update running ELO for next iteration (going backwards)
    runningELO = eloBeforeGame;
  }

  return trendPoints;
}

/**
 * Aggregates ELO trend points by time period
 *
 * Groups data points by day, week, or month and calculates average ELO for each period.
 *
 * @param trendPoints - Array of ELO trend points
 * @param period - Aggregation period ('day', 'week', or 'month')
 * @returns Array of aggregated ELO trend points
 */
function aggregateByPeriod(
  trendPoints: ELOTrendPoint[],
  period: ELOTrendPeriod
): ELOTrendPoint[] {
  if (trendPoints.length === 0) {
    return [];
  }

  // Group by period
  const periodMap = new Map<string, { elos: number[]; gameIds: string[] }>();

  for (const point of trendPoints) {
    const date = new Date(point.date);
    let periodKey: string;

    switch (period) {
      case 'day':
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week': {
        // Get start of week (Monday)
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        weekStart.setDate(diff);
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        break;
    }

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, { elos: [], gameIds: [] });
    }

    const periodData = periodMap.get(periodKey)!;
    periodData.elos.push(point.elo);
    periodData.gameIds.push(point.gameId);
  }

  // Convert to trend points (use average ELO for the period, use first game ID as representative)
  const aggregated: ELOTrendPoint[] = [];
  for (const [periodKey, data] of periodMap.entries()) {
    const avgELO =
      data.elos.reduce((sum, elo) => sum + elo, 0) / data.elos.length;
    const representativeGameId = data.gameIds[0]; // Use first game ID

    // Convert period key back to ISO date string
    let dateStr: string;
    if (period === 'month') {
      // YYYY-MM -> first day of month
      dateStr = `${periodKey}-01T00:00:00.000Z`;
    } else {
      // YYYY-MM-DD -> that date
      dateStr = `${periodKey}T00:00:00.000Z`;
    }

    aggregated.push({
      date: dateStr,
      elo: Math.round(avgELO * 100) / 100, // Round to 2 decimal places
      gameId: representativeGameId,
    });
  }

  // Sort by date
  aggregated.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return aggregated;
}

/**
 * Domain service for calculating ELO trends
 *
 * This service contains the business logic for calculating ELO trends
 * from raw participation data. It handles aggregation, historical calculations,
 * and statistics computation.
 */
export class ELOTrendCalculator {
  /**
   * Calculate ELO trends from raw data
   *
   * Processes raw participation data and calculates:
   * - Historical ELO values at each game date
   * - Aggregated trends by time period
   * - Current ELO (most recent game's ELO or player's current ELO)
   * - Historical high/low ELO values
   *
   * @param rawData - Raw ELO data points from repository
   * @param currentELO - Player's current ELO rating
   * @param period - Optional aggregation period ('day', 'week', 'month'). Defaults to 'day'
   * @returns Array of ELOTrendPoint with calculated ELO values
   *
   * @example
   * ```typescript
   * const trends = calculator.calculateTrends(rawData, 1500, 'week');
   * ```
   */
  calculateTrends(
    rawData: RawELODataPoint[],
    currentELO: number,
    period: ELOTrendPeriod = 'day'
  ): ELOTrendPoint[] {
    if (rawData.length === 0) {
      return [];
    }

    // Handle single data point - return it as-is
    if (rawData.length === 1) {
      const point = rawData[0];
      return [
        {
          date: point.gameDate.toISOString(),
          elo: currentELO,
          gameId: point.gameId,
        },
      ];
    }

    // Calculate historical ELO values
    const historicalPoints = calculateHistoricalELO(rawData, currentELO);

    // If insufficient data for aggregation, return as-is
    if (period !== 'day' && historicalPoints.length < 2) {
      return historicalPoints;
    }

    // Aggregate by period if needed
    if (period === 'day') {
      return historicalPoints;
    }

    return aggregateByPeriod(historicalPoints, period);
  }

  /**
   * Calculate current ELO
   *
   * Returns the most recent game's ELO or the player's current ELO if no games.
   *
   * @param rawData - Raw ELO data points
   * @param currentELO - Player's current ELO rating
   * @returns Current ELO value
   */
  calculateCurrentELO(rawData: RawELODataPoint[], currentELO: number): number {
    if (rawData.length === 0) {
      return currentELO;
    }

    // Most recent game's ELO is the current ELO
    return currentELO;
  }

  /**
   * Calculate historical high and low ELO values
   *
   * @param trendPoints - Array of ELO trend points
   * @param currentELO - Player's current ELO rating
   * @returns Object with high and low ELO values
   */
  calculateHistoricalHighLow(
    trendPoints: ELOTrendPoint[],
    currentELO: number
  ): { high: number; low: number } {
    if (trendPoints.length === 0) {
      return { high: currentELO, low: currentELO };
    }

    const elos = trendPoints.map((p) => p.elo);
    const high = Math.max(...elos, currentELO);
    const low = Math.min(...elos, currentELO);

    return { high, low };
  }

  /**
   * Calculate ELO change from previous period
   *
   * @param trendPoints - Array of ELO trend points
   * @param currentELO - Player's current ELO rating
   * @returns Change in ELO (positive for increase, negative for decrease)
   */
  calculateELOChange(trendPoints: ELOTrendPoint[], currentELO: number): number {
    if (trendPoints.length < 2) {
      return 0;
    }

    // Get second-to-last ELO (previous period)
    const previousELO = trendPoints[trendPoints.length - 2].elo;
    return currentELO - previousELO;
  }
}
