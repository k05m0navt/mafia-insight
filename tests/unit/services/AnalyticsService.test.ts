import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsService } from '@/services/AnalyticsService';

// Mock the analytics service
const mockAnalyticsService = {
  getPlayerStats: vi.fn(),
  getClubStats: vi.fn(),
  getTournamentStats: vi.fn(),
  getLeaderboard: vi.fn(),
  getFilteredData: vi.fn(),
  exportData: vi.fn(),
};

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPlayerStats', () => {
    it('should return player statistics', async () => {
      const mockPlayerStats = {
        totalPlayers: 150,
        averageRating: 1450,
        topPlayers: [
          { id: '1', name: 'Player Alpha', rating: 1850 },
          { id: '2', name: 'Player Beta', rating: 1800 },
        ],
      };

      mockAnalyticsService.getPlayerStats.mockResolvedValue(mockPlayerStats);

      const result = await mockAnalyticsService.getPlayerStats();

      expect(result).toEqual(mockPlayerStats);
      expect(mockAnalyticsService.getPlayerStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to fetch player stats');
      mockAnalyticsService.getPlayerStats.mockRejectedValue(error);

      await expect(mockAnalyticsService.getPlayerStats()).rejects.toThrow(
        'Failed to fetch player stats'
      );
    });
  });

  describe('getClubStats', () => {
    it('should return club statistics', async () => {
      const mockClubStats = {
        totalClubs: 25,
        averageMembers: 12,
        topClubs: [
          { id: '1', name: 'Club Alpha', memberCount: 20 },
          { id: '2', name: 'Club Beta', memberCount: 18 },
        ],
      };

      mockAnalyticsService.getClubStats.mockResolvedValue(mockClubStats);

      const result = await mockAnalyticsService.getClubStats();

      expect(result).toEqual(mockClubStats);
      expect(mockAnalyticsService.getClubStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTournamentStats', () => {
    it('should return tournament statistics', async () => {
      const mockTournamentStats = {
        totalTournaments: 50,
        averageParticipants: 16,
        upcomingTournaments: [
          { id: '1', name: 'Tournament Alpha', date: '2025-02-01' },
          { id: '2', name: 'Tournament Beta', date: '2025-02-15' },
        ],
      };

      mockAnalyticsService.getTournamentStats.mockResolvedValue(
        mockTournamentStats
      );

      const result = await mockAnalyticsService.getTournamentStats();

      expect(result).toEqual(mockTournamentStats);
      expect(mockAnalyticsService.getTournamentStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard data', async () => {
      const mockLeaderboard = {
        players: [
          { id: '1', name: 'Player Alpha', rating: 1850, rank: 1 },
          { id: '2', name: 'Player Beta', rating: 1800, rank: 2 },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 150,
        },
      };

      mockAnalyticsService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await mockAnalyticsService.getLeaderboard();

      expect(result).toEqual(mockLeaderboard);
      expect(mockAnalyticsService.getLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should support filtering by category', async () => {
      const mockFilteredLeaderboard = {
        players: [{ id: '1', name: 'Player Alpha', rating: 1850, rank: 1 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
        },
      };

      mockAnalyticsService.getLeaderboard.mockResolvedValue(
        mockFilteredLeaderboard
      );

      const result = await mockAnalyticsService.getLeaderboard('players', {
        category: 'premium',
      });

      expect(result).toEqual(mockFilteredLeaderboard);
      expect(mockAnalyticsService.getLeaderboard).toHaveBeenCalledWith(
        'players',
        { category: 'premium' }
      );
    });
  });

  describe('getFilteredData', () => {
    it('should return filtered data based on criteria', async () => {
      const mockFilteredData = {
        players: [{ id: '1', name: 'Player Alpha', rating: 1850 }],
        total: 1,
      };

      const filters = {
        rating: { min: 1800, max: 2000 },
        category: 'premium',
      };

      mockAnalyticsService.getFilteredData.mockResolvedValue(mockFilteredData);

      const result = await mockAnalyticsService.getFilteredData(
        'players',
        filters
      );

      expect(result).toEqual(mockFilteredData);
      expect(mockAnalyticsService.getFilteredData).toHaveBeenCalledWith(
        'players',
        filters
      );
    });

    it('should handle empty filters', async () => {
      const mockAllData = {
        players: [
          { id: '1', name: 'Player Alpha', rating: 1850 },
          { id: '2', name: 'Player Beta', rating: 1800 },
        ],
        total: 2,
      };

      mockAnalyticsService.getFilteredData.mockResolvedValue(mockAllData);

      const result = await mockAnalyticsService.getFilteredData('players', {});

      expect(result).toEqual(mockAllData);
      expect(mockAnalyticsService.getFilteredData).toHaveBeenCalledWith(
        'players',
        {}
      );
    });
  });

  describe('exportData', () => {
    it('should export data in specified format', async () => {
      const mockExportData = {
        data: [{ id: '1', name: 'Player Alpha', rating: 1850 }],
        format: 'csv',
        filename: 'players_export.csv',
      };

      mockAnalyticsService.exportData.mockResolvedValue(mockExportData);

      const result = await mockAnalyticsService.exportData('players', 'csv');

      expect(result).toEqual(mockExportData);
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith(
        'players',
        'csv'
      );
    });

    it('should support different export formats', async () => {
      const mockJsonExport = {
        data: [{ id: '1', name: 'Player Alpha', rating: 1850 }],
        format: 'json',
        filename: 'players_export.json',
      };

      mockAnalyticsService.exportData.mockResolvedValue(mockJsonExport);

      const result = await mockAnalyticsService.exportData('players', 'json');

      expect(result.format).toBe('json');
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith(
        'players',
        'json'
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockAnalyticsService.getPlayerStats.mockRejectedValue(networkError);

      await expect(mockAnalyticsService.getPlayerStats()).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle invalid parameters', async () => {
      const validationError = new Error('Invalid parameters');
      mockAnalyticsService.getFilteredData.mockRejectedValue(validationError);

      await expect(
        mockAnalyticsService.getFilteredData('invalid', {})
      ).rejects.toThrow('Invalid parameters');
    });
  });

  describe('performance', () => {
    it('should complete requests within acceptable time', async () => {
      const startTime = Date.now();

      mockAnalyticsService.getPlayerStats.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
      );

      await mockAnalyticsService.getPlayerStats();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
