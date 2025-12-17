/**
 * Unit tests for ELOTrendCalculator
 */

import { describe, it, expect } from 'vitest';
import { ELOTrendCalculator } from '@/domain/services/elo-trend-calculator';
import type { RawELODataPoint } from '@/infrastructure/persistence/elo-trends.repository';
import type { ELOTrendPeriod } from '@/types/analytics';

describe('ELOTrendCalculator', () => {
  const calculator = new ELOTrendCalculator();

  describe('calculateTrends', () => {
    it('should calculate historical ELO correctly working backwards from current ELO', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-01'),
          eloChange: 10,
          playerEloAfter: null,
        },
        {
          gameId: 'game-2',
          gameDate: new Date('2024-01-02'),
          eloChange: -5,
          playerEloAfter: null,
        },
        {
          gameId: 'game-3',
          gameDate: new Date('2024-01-03'),
          eloChange: 20,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateTrends(rawData, currentELO, 'day');

      expect(result).toHaveLength(3);
      // Working backwards: 1500 - 20 = 1480 (before game-3), so after game-3 = 1500
      // 1480 - (-5) = 1485 (before game-2), so after game-2 = 1480
      // 1485 - 10 = 1475 (before game-1), so after game-1 = 1485
      expect(result[0].elo).toBe(1485); // After game-1
      expect(result[1].elo).toBe(1480); // After game-2
      expect(result[2].elo).toBe(1500); // After game-3 (current)
    });

    it('should handle empty data', () => {
      const result = calculator.calculateTrends([], 1500, 'day');
      expect(result).toHaveLength(0);
    });

    it('should handle single data point', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-01'),
          eloChange: 10,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateTrends(rawData, currentELO, 'day');

      expect(result).toHaveLength(1);
      expect(result[0].elo).toBe(1500);
      expect(result[0].gameId).toBe('game-1');
    });

    it('should aggregate by week', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-01'), // Monday
          eloChange: 10,
          playerEloAfter: null,
        },
        {
          gameId: 'game-2',
          gameDate: new Date('2024-01-02'), // Tuesday (same week)
          eloChange: -5,
          playerEloAfter: null,
        },
        {
          gameId: 'game-3',
          gameDate: new Date('2024-01-08'), // Next Monday (different week)
          eloChange: 20,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateTrends(rawData, currentELO, 'week');

      // Should aggregate into 2 weeks
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should aggregate by month', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-15'),
          eloChange: 10,
          playerEloAfter: null,
        },
        {
          gameId: 'game-2',
          gameDate: new Date('2024-01-20'),
          eloChange: -5,
          playerEloAfter: null,
        },
        {
          gameId: 'game-3',
          gameDate: new Date('2024-02-10'),
          eloChange: 20,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateTrends(rawData, currentELO, 'month');

      // Should aggregate into 2 months
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle null eloChange values', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-01'),
          eloChange: null,
          playerEloAfter: null,
        },
        {
          gameId: 'game-2',
          gameDate: new Date('2024-01-02'),
          eloChange: 10,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateTrends(rawData, currentELO, 'day');

      expect(result).toHaveLength(2);
      // null eloChange should be treated as 0
      expect(result[0].elo).toBe(1490); // 1500 - 10 = 1490 (before game-2)
      expect(result[1].elo).toBe(1500); // Current ELO
    });
  });

  describe('calculateCurrentELO', () => {
    it('should return current ELO when data exists', () => {
      const rawData: RawELODataPoint[] = [
        {
          gameId: 'game-1',
          gameDate: new Date('2024-01-01'),
          eloChange: 10,
          playerEloAfter: null,
        },
      ];
      const currentELO = 1500;

      const result = calculator.calculateCurrentELO(rawData, currentELO);
      expect(result).toBe(1500);
    });

    it('should return current ELO when no data', () => {
      const result = calculator.calculateCurrentELO([], 1500);
      expect(result).toBe(1500);
    });
  });

  describe('calculateHistoricalHighLow', () => {
    it('should calculate high and low from trends', () => {
      const trends = [
        { date: '2024-01-01', elo: 1450, gameId: 'game-1' },
        { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
        { date: '2024-01-03', elo: 1480, gameId: 'game-3' },
        { date: '2024-01-04', elo: 1520, gameId: 'game-4' },
      ];
      const currentELO = 1500;

      const result = calculator.calculateHistoricalHighLow(trends, currentELO);

      expect(result.high).toBe(1520);
      expect(result.low).toBe(1450);
    });

    it('should include current ELO in high/low calculation', () => {
      const trends = [
        { date: '2024-01-01', elo: 1450, gameId: 'game-1' },
        { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
      ];
      const currentELO = 1600; // Higher than all trends

      const result = calculator.calculateHistoricalHighLow(trends, currentELO);

      expect(result.high).toBe(1600); // Current ELO is highest
      expect(result.low).toBe(1450);
    });

    it('should handle empty trends', () => {
      const currentELO = 1500;
      const result = calculator.calculateHistoricalHighLow([], currentELO);

      expect(result.high).toBe(1500);
      expect(result.low).toBe(1500);
    });
  });

  describe('calculateELOChange', () => {
    it('should calculate change from previous period', () => {
      const trends = [
        { date: '2024-01-01', elo: 1450, gameId: 'game-1' },
        { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
        { date: '2024-01-03', elo: 1520, gameId: 'game-3' },
      ];
      const currentELO = 1520;

      const result = calculator.calculateELOChange(trends, currentELO);

      expect(result).toBe(20); // 1520 - 1500
    });

    it('should return 0 for insufficient data', () => {
      const trends = [{ date: '2024-01-01', elo: 1500, gameId: 'game-1' }];
      const currentELO = 1500;

      const result = calculator.calculateELOChange(trends, currentELO);

      expect(result).toBe(0);
    });

    it('should handle negative change', () => {
      const trends = [
        { date: '2024-01-01', elo: 1520, gameId: 'game-1' },
        { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
      ];
      const currentELO = 1480; // Lower than both previous points

      const result = calculator.calculateELOChange(trends, currentELO);

      // Compares with second-to-last: trends[0] = 1520
      expect(result).toBe(-40); // 1480 - 1520
    });
  });
});
