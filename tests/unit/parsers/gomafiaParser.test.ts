import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsePlayer,
  parseGame,
  parsePlayerList,
} from '@/lib/parsers/gomafiaParser';

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        evaluate: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('GomafiaParser', () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      goto: vi.fn(),
      waitForSelector: vi.fn(),
      evaluate: vi.fn(),
      close: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('parsePlayer', () => {
    it('should parse player data from gomafia.pro player page', async () => {
      const mockPlayerData = {
        id: 'player123',
        name: 'Test Player',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        club: 'Test Club',
        lastActive: '2024-01-15',
      };

      mockPage.evaluate.mockResolvedValue(mockPlayerData);

      const result = await parsePlayer('player123');

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/player/player123'
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.player-info');
      expect(result).toEqual(mockPlayerData);
    });

    it('should handle player not found error', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Player not found'));

      await expect(parsePlayer('nonexistent')).rejects.toThrow(
        'Player not found'
      );
    });

    it('should handle network timeout', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      await expect(parsePlayer('player123')).rejects.toThrow(
        'Navigation timeout'
      );
    });

    it('should retry on temporary failures', async () => {
      mockPage.goto
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      mockPage.evaluate.mockResolvedValue({
        id: 'player123',
        name: 'Test Player',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
      });

      const result = await parsePlayer('player123');

      expect(mockPage.goto).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });

  describe('parseGame', () => {
    it('should parse game data from gomafia.pro game page', async () => {
      const mockGameData = {
        id: 'game456',
        date: '2024-01-15T20:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        participants: [
          { playerId: 'player1', role: 'MAFIA', team: 'BLACK' },
          { playerId: 'player2', role: 'CITIZEN', team: 'RED' },
        ],
      };

      mockPage.evaluate.mockResolvedValue(mockGameData);

      const result = await parseGame('game456');

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/game/game456'
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.game-info');
      expect(result).toEqual(mockGameData);
    });

    it('should handle game not found error', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Game not found'));

      await expect(parseGame('nonexistent')).rejects.toThrow('Game not found');
    });

    it('should handle incomplete game data', async () => {
      const mockIncompleteGameData = {
        id: 'game456',
        date: '2024-01-15T20:00:00Z',
        status: 'IN_PROGRESS',
        participants: [],
      };

      mockPage.evaluate.mockResolvedValue(mockIncompleteGameData);

      const result = await parseGame('game456');

      expect(result).toEqual(mockIncompleteGameData);
      expect(result.participants).toEqual([]);
    });
  });

  describe('parsePlayerList', () => {
    it('should parse list of players from gomafia.pro players page', async () => {
      const mockPlayerList = [
        { id: 'player1', name: 'Player 1', eloRating: 1500 },
        { id: 'player2', name: 'Player 2', eloRating: 1600 },
        { id: 'player3', name: 'Player 3', eloRating: 1400 },
      ];

      mockPage.evaluate.mockResolvedValue(mockPlayerList);

      const result = await parsePlayerList(1, 10);

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/players?page=1&limit=10'
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.players-list');
      expect(result).toEqual(mockPlayerList);
    });

    it('should handle empty player list', async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const result = await parsePlayerList(1, 10);

      expect(result).toEqual([]);
    });

    it('should handle pagination errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Page not found'));

      await expect(parsePlayerList(999, 10)).rejects.toThrow('Page not found');
    });
  });

  describe('retry logic', () => {
    it('should retry with exponential backoff', async () => {
      const startTime = Date.now();

      mockPage.goto
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      mockPage.evaluate.mockResolvedValue({
        id: 'player123',
        name: 'Test Player',
      });

      await parsePlayer('player123');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited at least 1 second (1000ms) for first retry
      expect(duration).toBeGreaterThan(1000);
      expect(mockPage.goto).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retries', async () => {
      mockPage.goto.mockRejectedValue(new Error('Persistent error'));

      await expect(parsePlayer('player123')).rejects.toThrow(
        'Persistent error'
      );
    });
  });

  describe('data validation', () => {
    it('should validate player data structure', async () => {
      const invalidPlayerData = {
        id: 'player123',
        // Missing required fields
      };

      mockPage.evaluate.mockResolvedValue(invalidPlayerData);

      await expect(parsePlayer('player123')).rejects.toThrow(
        'Invalid player data'
      );
    });

    it('should validate game data structure', async () => {
      const invalidGameData = {
        id: 'game456',
        // Missing required fields
      };

      mockPage.evaluate.mockResolvedValue(invalidGameData);

      await expect(parseGame('game456')).rejects.toThrow('Invalid game data');
    });
  });
});
