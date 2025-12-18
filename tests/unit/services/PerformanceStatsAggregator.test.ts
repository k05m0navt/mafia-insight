/**
 * Unit tests for PerformanceStatsAggregator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceStatsAggregator } from '@/domain/services/performance-stats-aggregator';
import {
  PerformanceSummaryRepository,
  type PerformanceSummaryParticipationData,
} from '@/infrastructure/persistence/performance-summary.repository';
import type { DateRange, PlayerRole } from '@/types/analytics';

// Mock the repository
const mockRepository = {
  getPerformanceSummaryData: vi.fn(),
  getRecentActivity: vi.fn(),
  verifyPlayerAccess: vi.fn(),
};

describe('PerformanceStatsAggregator', () => {
  let aggregator: PerformanceStatsAggregator;
  let mockRepo: typeof mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = { ...mockRepository };
    aggregator = new PerformanceStatsAggregator(
      mockRepo as unknown as PerformanceSummaryRepository
    );
  });

  describe('calculateSummary', () => {
    it('should calculate complete performance summary correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1250,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: 1260,
          durationMinutes: 50,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: false,
          eloRating: 1255,
          durationMinutes: 40,
          role: 'DON',
        },
        {
          gameId: 'game4',
          gameDate: new Date('2024-01-04'),
          isWinner: true,
          eloRating: 1270,
          durationMinutes: 55,
          role: 'SHERIFF',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 2,
        thisMonth: 4,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.totalGames).toBe(4);
      expect(result.totalWins).toBe(3);
      expect(result.totalLosses).toBe(1);
      expect(result.winPercentage).toBe(75); // 3/4 * 100 = 75
      expect(result.averageGameDuration).toBe(47.5); // (45+50+40+55)/4 = 47.5
      expect(result.longestWinStreak).toBe(2); // First two games are wins
      expect(result.bestELOAchieved).toBe(1270); // Max ELO
      expect(result.recentActivity.thisWeek).toBe(2);
      expect(result.recentActivity.thisMonth).toBe(4);
    });

    it('should handle empty participation data', async () => {
      mockRepo.getPerformanceSummaryData.mockResolvedValue([]);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 0,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.totalGames).toBe(0);
      expect(result.totalWins).toBe(0);
      expect(result.totalLosses).toBe(0);
      expect(result.winPercentage).toBe(0);
      expect(result.averageGameDuration).toBeUndefined();
      expect(result.longestWinStreak).toBe(0);
      expect(result.bestELOAchieved).toBe(0);
      expect(result.recentActivity.thisWeek).toBe(0);
      expect(result.recentActivity.thisMonth).toBe(0);
    });

    it('should calculate win percentage correctly with rounding', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: 50,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: 40,
          role: 'DON',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 3,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.winPercentage).toBe(33.33); // 1/3 * 100 = 33.333... rounded to 33.33
    });

    it('should handle missing duration data gracefully', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: null,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: undefined,
          role: 'DON',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 3,
      });

      const result = await aggregator.calculateSummary('player-id');

      // Should only calculate average from games with duration (game1)
      expect(result.averageGameDuration).toBe(45);
    });

    it('should return undefined for average duration when no games have duration', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: null,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: null,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 2,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.averageGameDuration).toBeUndefined();
    });

    it('should calculate longest win streak correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: 1210,
          durationMinutes: 50,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: true,
          eloRating: 1220,
          durationMinutes: 40,
          role: 'DON',
        },
        {
          gameId: 'game4',
          gameDate: new Date('2024-01-04'),
          isWinner: false,
          eloRating: 1215,
          durationMinutes: 55,
          role: 'SHERIFF',
        },
        {
          gameId: 'game5',
          gameDate: new Date('2024-01-05'),
          isWinner: true,
          eloRating: 1225,
          durationMinutes: 50,
          role: 'DON',
        },
        {
          gameId: 'game6',
          gameDate: new Date('2024-01-06'),
          isWinner: true,
          eloRating: 1230,
          durationMinutes: 45,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 6,
      });

      const result = await aggregator.calculateSummary('player-id');

      // Longest streak is 3 (games 1-3), not 2 (games 5-6)
      expect(result.longestWinStreak).toBe(3);
    });

    it('should handle all wins correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: 1210,
          durationMinutes: 50,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 2,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.totalWins).toBe(2);
      expect(result.totalLosses).toBe(0);
      expect(result.winPercentage).toBe(100);
      expect(result.longestWinStreak).toBe(2);
    });

    it('should handle all losses correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: false,
          eloRating: 1190,
          durationMinutes: 50,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 2,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.totalWins).toBe(0);
      expect(result.totalLosses).toBe(2);
      expect(result.winPercentage).toBe(0);
      expect(result.longestWinStreak).toBe(0);
    });

    it('should calculate best ELO correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: 1300,
          durationMinutes: 50,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: false,
          eloRating: 1250,
          durationMinutes: 40,
          role: 'DON',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 3,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.bestELOAchieved).toBe(1300);
    });

    it('should handle ELO ratings with null values', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: null,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 50,
          role: 'MAFIA',
        },
        {
          gameId: 'game3',
          gameDate: new Date('2024-01-03'),
          isWinner: false,
          eloRating: undefined,
          durationMinutes: 40,
          role: 'DON',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 3,
      });

      const result = await aggregator.calculateSummary('player-id');

      // Should only use valid ELO ratings (1200)
      expect(result.bestELOAchieved).toBe(1200);
    });

    it('should return 0 for best ELO when no valid ELO ratings exist', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: null,
          durationMinutes: 45,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: true,
          eloRating: undefined,
          durationMinutes: 50,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 2,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.bestELOAchieved).toBe(0);
    });

    it('should pass date range and roles to repository', async () => {
      const dateRange: DateRange = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const roles: PlayerRole[] = ['DON', 'MAFIA'];

      mockRepo.getPerformanceSummaryData.mockResolvedValue([]);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 0,
      });

      await aggregator.calculateSummary('player-id', dateRange, roles);

      expect(mockRepo.getPerformanceSummaryData).toHaveBeenCalledWith(
        'player-id',
        dateRange,
        roles
      );
      expect(mockRepo.getRecentActivity).toHaveBeenCalledWith(
        'player-id',
        dateRange,
        roles
      );
    });

    it('should round average game duration to 2 decimal places', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45.333,
          role: 'DON',
        },
        {
          gameId: 'game2',
          gameDate: new Date('2024-01-02'),
          isWinner: false,
          eloRating: 1200,
          durationMinutes: 50.666,
          role: 'MAFIA',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 2,
      });

      const result = await aggregator.calculateSummary('player-id');

      // (45.333 + 50.666) / 2 = 48.0 (rounded to 2 decimals)
      expect(result.averageGameDuration).toBe(48);
    });

    it('should handle single game correctly', async () => {
      const participationData: PerformanceSummaryParticipationData[] = [
        {
          gameId: 'game1',
          gameDate: new Date('2024-01-01'),
          isWinner: true,
          eloRating: 1200,
          durationMinutes: 45,
          role: 'DON',
        },
      ];

      mockRepo.getPerformanceSummaryData.mockResolvedValue(participationData);
      mockRepo.getRecentActivity.mockResolvedValue({
        thisWeek: 0,
        thisMonth: 1,
      });

      const result = await aggregator.calculateSummary('player-id');

      expect(result.totalGames).toBe(1);
      expect(result.totalWins).toBe(1);
      expect(result.totalLosses).toBe(0);
      expect(result.winPercentage).toBe(100);
      expect(result.longestWinStreak).toBe(1);
      expect(result.averageGameDuration).toBe(45);
    });
  });
});
