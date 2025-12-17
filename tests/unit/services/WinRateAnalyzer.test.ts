/**
 * Unit tests for WinRateAnalyzer
 */

import { describe, it, expect } from 'vitest';
import {
  WinRateAnalyzer,
  type WinRateParticipationData,
} from '@/domain/services/win-rate-analyzer';
import type { PlayerRole } from '@prisma/client';

describe('WinRateAnalyzer', () => {
  const analyzer = new WinRateAnalyzer();

  describe('calculateOverallWinRate', () => {
    it('should calculate overall win rate correctly', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game3', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game4', tournamentId: null },
      ];

      const result = analyzer.calculateOverallWinRate(data);

      expect(result).toBe(75); // 3 wins / 4 games * 100
    });

    it('should return 0 for empty data', () => {
      const data: WinRateParticipationData[] = [];

      const result = analyzer.calculateOverallWinRate(data);

      expect(result).toBe(0);
    });

    it('should handle all wins correctly', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game2', tournamentId: null },
      ];

      const result = analyzer.calculateOverallWinRate(data);

      expect(result).toBe(100);
    });

    it('should handle all losses correctly', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: false, gameId: 'game1', tournamentId: null },
        { role: 'MAFIA', isWinner: false, gameId: 'game2', tournamentId: null },
      ];

      const result = analyzer.calculateOverallWinRate(data);

      expect(result).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game3', tournamentId: null },
      ];

      const result = analyzer.calculateOverallWinRate(data);

      expect(result).toBe(33.33); // 1/3 * 100 = 33.333... rounded to 33.33
    });
  });

  describe('calculatePerRoleWinRates', () => {
    it('should calculate win rates for all roles', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game3', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game4', tournamentId: null },
        {
          role: 'SHERIFF',
          isWinner: false,
          gameId: 'game5',
          tournamentId: null,
        },
        // CITIZEN has no data
      ];

      const result = analyzer.calculatePerRoleWinRates(data);

      expect(result.DON).toBe(50); // 1/2 * 100
      expect(result.MAFIA).toBe(100); // 2/2 * 100
      expect(result.SHERIFF).toBe(0); // 0/1 * 100
      expect(result.CITIZEN).toBe(0); // No games
    });

    it('should return 0 for all roles when data is empty', () => {
      const data: WinRateParticipationData[] = [];

      const result = analyzer.calculatePerRoleWinRates(data);

      expect(result.DON).toBe(0);
      expect(result.MAFIA).toBe(0);
      expect(result.SHERIFF).toBe(0);
      expect(result.CITIZEN).toBe(0);
    });
  });

  describe('calculateScenarioWinRates', () => {
    it('should calculate tournament and casual win rates', () => {
      const data: WinRateParticipationData[] = [
        {
          role: 'DON',
          isWinner: true,
          gameId: 'game1',
          tournamentId: 'tour1',
        },
        {
          role: 'DON',
          isWinner: true,
          gameId: 'game2',
          tournamentId: 'tour1',
        },
        {
          role: 'MAFIA',
          isWinner: false,
          gameId: 'game3',
          tournamentId: null,
        },
        {
          role: 'MAFIA',
          isWinner: true,
          gameId: 'game4',
          tournamentId: null,
        },
      ];

      const result = analyzer.calculateScenarioWinRates(data);

      expect(result).toBeDefined();
      expect(result?.tournament).toBe(100); // 2/2 * 100
      expect(result?.casual).toBe(50); // 1/2 * 100
    });

    it('should return undefined when no tournament data available', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'MAFIA', isWinner: false, gameId: 'game2', tournamentId: null },
      ];

      const result = analyzer.calculateScenarioWinRates(data);

      expect(result).toBeUndefined();
    });

    it('should handle only tournament games', () => {
      const data: WinRateParticipationData[] = [
        {
          role: 'DON',
          isWinner: true,
          gameId: 'game1',
          tournamentId: 'tour1',
        },
        {
          role: 'MAFIA',
          isWinner: false,
          gameId: 'game2',
          tournamentId: 'tour1',
        },
      ];

      const result = analyzer.calculateScenarioWinRates(data);

      expect(result).toBeDefined();
      expect(result?.tournament).toBe(50);
      expect(result?.casual).toBe(0);
    });
  });

  describe('calculateComparisonToAverage', () => {
    it('should calculate difference from average', () => {
      const winRates = {
        overall: 60,
        byRole: { DON: 70, MAFIA: 50 },
        winLossCounts: {
          overall: { wins: 6, losses: 4, total: 10 },
          byRole: {},
        },
      };

      const averageWinRates = {
        overall: 50,
        byRole: { DON: 55, MAFIA: 45 },
        winLossCounts: {
          overall: { wins: 5, losses: 5, total: 10 },
          byRole: {},
        },
      };

      const result = analyzer.calculateComparisonToAverage(
        winRates,
        averageWinRates
      );

      expect(result).toBe(10); // 60 - 50
    });

    it('should return undefined when average data not available', () => {
      const winRates = {
        overall: 60,
        byRole: { DON: 70 },
        winLossCounts: {
          overall: { wins: 6, losses: 4, total: 10 },
          byRole: {},
        },
      };

      const result = analyzer.calculateComparisonToAverage(winRates);

      expect(result).toBeUndefined();
    });

    it('should handle negative difference (below average)', () => {
      const winRates = {
        overall: 40,
        byRole: { DON: 30 },
        winLossCounts: {
          overall: { wins: 4, losses: 6, total: 10 },
          byRole: {},
        },
      };

      const averageWinRates = {
        overall: 50,
        byRole: { DON: 55 },
        winLossCounts: {
          overall: { wins: 5, losses: 5, total: 10 },
          byRole: {},
        },
      };

      const result = analyzer.calculateComparisonToAverage(
        winRates,
        averageWinRates
      );

      expect(result).toBe(-10); // 40 - 50
    });
  });

  describe('calculateWinLossCounts', () => {
    it('should calculate win/loss counts correctly', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null },
        { role: 'MAFIA', isWinner: true, gameId: 'game3', tournamentId: null },
        {
          role: 'SHERIFF',
          isWinner: false,
          gameId: 'game4',
          tournamentId: null,
        },
      ];

      const result = analyzer.calculateWinLossCounts(data);

      expect(result.overall.wins).toBe(2);
      expect(result.overall.losses).toBe(2);
      expect(result.overall.total).toBe(4);

      expect(result.byRole.DON.wins).toBe(1);
      expect(result.byRole.DON.losses).toBe(1);
      expect(result.byRole.DON.total).toBe(2);

      expect(result.byRole.MAFIA.wins).toBe(1);
      expect(result.byRole.MAFIA.losses).toBe(0);
      expect(result.byRole.MAFIA.total).toBe(1);

      expect(result.byRole.SHERIFF.wins).toBe(0);
      expect(result.byRole.SHERIFF.losses).toBe(1);
      expect(result.byRole.SHERIFF.total).toBe(1);

      expect(result.byRole.CITIZEN.wins).toBe(0);
      expect(result.byRole.CITIZEN.losses).toBe(0);
      expect(result.byRole.CITIZEN.total).toBe(0);
    });
  });

  describe('calculateWinRateAnalysis', () => {
    it('should calculate complete win rate analysis', () => {
      const data: WinRateParticipationData[] = [
        {
          role: 'DON',
          isWinner: true,
          gameId: 'game1',
          tournamentId: 'tour1',
        },
        {
          role: 'DON',
          isWinner: false,
          gameId: 'game2',
          tournamentId: null,
        },
        {
          role: 'MAFIA',
          isWinner: true,
          gameId: 'game3',
          tournamentId: 'tour1',
        },
      ];

      const result = analyzer.calculateWinRateAnalysis(data);

      expect(result.overall).toBe(66.67); // 2/3 * 100 rounded
      expect(result.byRole.DON).toBe(50); // 1/2 * 100
      expect(result.byRole.MAFIA).toBe(100); // 1/1 * 100
      expect(result.byScenario).toBeDefined();
      expect(result.byScenario?.tournament).toBe(100); // 2/2 * 100
      expect(result.byScenario?.casual).toBe(0); // 0/1 * 100
      expect(result.winLossCounts.overall.wins).toBe(2);
      expect(result.winLossCounts.overall.losses).toBe(1);
      expect(result.winLossCounts.overall.total).toBe(3);
    });

    it('should include comparison to average when provided', () => {
      const data: WinRateParticipationData[] = [
        { role: 'DON', isWinner: true, gameId: 'game1', tournamentId: null },
        { role: 'DON', isWinner: false, gameId: 'game2', tournamentId: null },
      ];

      const averageWinRates = {
        overall: 50,
        byRole: { DON: 50, MAFIA: 50, SHERIFF: 50, CITIZEN: 50 },
        winLossCounts: {
          overall: { wins: 1, losses: 1, total: 2 },
          byRole: {},
        },
      };

      const result = analyzer.calculateWinRateAnalysis(data, averageWinRates);

      expect(result.comparisonToAverage).toBe(0); // 50 - 50
    });
  });
});
