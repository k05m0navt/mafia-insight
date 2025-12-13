import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Browser, Page } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

const { resilientExecuteMock, mockDiscoverProfileData } = vi.hoisted(() => ({
  resilientExecuteMock: vi.fn(),
  mockDiscoverProfileData: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: (fn: (db: any) => unknown) => resilientExecuteMock(fn),
  },
}));

// Mock PlayerStatsScraper - must be hoisted for dynamic imports
vi.mock('@/lib/gomafia/scrapers/player-stats-scraper', () => ({
  PlayerStatsScraper: vi.fn().mockImplementation(() => ({
    discoverProfileData: mockDiscoverProfileData,
  })),
}));

describe('ImportOrchestrator - importHistoricalData', () => {
  let orchestrator: ImportOrchestrator;
  let mockDb: any;
  let mockBrowser: Browser;
  let mockPage: Page;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockDiscoverProfileData.mockReset();

    // Setup mock database
    mockDb = {
      syncLog: {
        create: vi.fn().mockResolvedValue({ id: 'sync-log-123' }),
        update: vi.fn().mockResolvedValue({}),
      },
      syncStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
      importCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      game: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      player: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      tournament: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gameParticipation: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      playerTournament: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    // Setup mock browser and page
    mockPage = {
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    } as unknown as Browser;

    (PrismaClient as any).mockImplementation(() => mockDb);
    resilientExecuteMock.mockImplementation((fn) => fn(mockDb));
    orchestrator = new ImportOrchestrator(mockDb, mockBrowser);
  });

  describe('importHistoricalData', () => {
    it('should create sync log entry and return job ID', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: new Date('2020-01-01'),
        latestGameDate: new Date('2024-12-31'),
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      const result = await orchestrator.importHistoricalData(userId, playerId);

      expect(result).toEqual({ jobId: 'sync-log-123' });
      expect(mockDb.syncLog.create).toHaveBeenCalledWith({
        data: {
          type: 'HISTORICAL',
          status: 'RUNNING',
          startTime: expect.any(Date),
        },
      });
    });

    it('should discover profile data using PlayerStatsScraper', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 250,
        earliestGameDate: new Date('2019-05-15'),
        latestGameDate: new Date('2024-11-20'),
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await orchestrator.importHistoricalData(userId, playerId);

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockDiscoverProfileData).toHaveBeenCalledWith(playerId);
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should initialize sync status with discovered game count', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 500,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await orchestrator.importHistoricalData(userId, playerId);

      expect(mockDb.syncStatus.upsert).toHaveBeenCalledWith({
        where: { id: `user-${userId}` },
        update: {
          isRunning: true,
          progress: 0,
          currentOperation: 'Initializing historical import...',
          lastError: null,
          totalRecordsProcessed: 500,
          updatedAt: expect.any(Date),
        },
        create: {
          id: `user-${userId}`,
          isRunning: true,
          progress: 0,
          currentOperation: 'Initializing historical import...',
          totalRecordsProcessed: 500,
        },
      });
    });

    it('should create import checkpoint with DISCOVERY phase', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await orchestrator.importHistoricalData(userId, playerId);

      expect(mockDb.importCheckpoint.upsert).toHaveBeenCalledWith({
        where: { id: `user-${userId}` },
        update: {
          currentPhase: 'DISCOVERY',
          currentBatch: 0,
          lastProcessedId: null,
          processedIds: [],
          progress: 0,
          isPaused: false,
          lastUpdated: expect.any(Date),
        },
        create: {
          id: `user-${userId}`,
          currentPhase: 'DISCOVERY',
          currentBatch: 0,
          lastProcessedId: null,
          processedIds: [],
          progress: 0,
          isPaused: false,
        },
      });
    });

    it('should use newest-first as default ordering', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await orchestrator.importHistoricalData(userId, playerId);

      // Verify the method completed successfully (newest-first is default)
      expect(mockDb.syncLog.create).toHaveBeenCalled();
    });

    it('should accept oldest-first ordering option', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await orchestrator.importHistoricalData(userId, playerId, {
        order: 'oldest-first',
      });

      // Verify the method completed successfully with oldest-first option
      expect(mockDb.syncLog.create).toHaveBeenCalled();
    });

    it('should throw error when profile does not exist', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 0,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: false,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      await expect(
        orchestrator.importHistoricalData(userId, playerId)
      ).rejects.toThrow('Profile not found for player ID: player-456');

      // Should still create sync log but not initialize status
      expect(mockDb.syncLog.create).toHaveBeenCalled();
      expect(mockDb.syncStatus.upsert).not.toHaveBeenCalled();
    });

    it('should handle errors during profile discovery', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';

      mockDiscoverProfileData.mockRejectedValue(
        new Error('Network error during discovery')
      );

      await expect(
        orchestrator.importHistoricalData(userId, playerId)
      ).rejects.toThrow('Network error during discovery');

      // Page should still be closed even on error
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should close page even if sync status initialization fails', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);
      mockDb.syncStatus.upsert.mockRejectedValue(new Error('Database error'));

      await expect(
        orchestrator.importHistoricalData(userId, playerId)
      ).rejects.toThrow('Database error');

      // Page should still be closed
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should handle missing date range gracefully', async () => {
      const userId = 'user-123';
      const playerId = 'player-456';
      const discoveryData = {
        totalGames: 100,
        earliestGameDate: null, // Missing dates
        latestGameDate: null,
        profileExists: true,
      };

      mockDiscoverProfileData.mockResolvedValue(discoveryData);

      const result = await orchestrator.importHistoricalData(userId, playerId);

      // Should still succeed even without date range
      expect(result).toEqual({ jobId: 'sync-log-123' });
      expect(mockDb.syncStatus.upsert).toHaveBeenCalled();
    });
  });
});
