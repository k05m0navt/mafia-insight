import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerService } from '../../../src/services/playerService';

// Mock Prisma
vi.mock('../../../src/lib/db', () => ({
  prisma: {
    player: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('PlayerService', () => {
  let playerService: PlayerService;
  let mockPrisma: any;

  beforeEach(async () => {
    playerService = new PlayerService();
    const { prisma } = await import('../../../src/lib/db');
    mockPrisma = vi.mocked(prisma);
    vi.clearAllMocks();
  });

  describe('getPlayers', () => {
    it('should return paginated players', async () => {
      const mockPlayers = [
        {
          id: '1',
          name: 'Player 1',
          eloRating: 1500,
          totalGames: 10,
          wins: 6,
          losses: 4,
        },
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockPlayers);
      mockPrisma.player.count.mockResolvedValue(1);

      const result = await playerService.getPlayers(1, 20);

      expect(result).toEqual({
        data: mockPlayers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should filter players by search term', async () => {
      const mockPlayers = [
        {
          id: '1',
          name: 'John Doe',
          eloRating: 1500,
          totalGames: 10,
          wins: 6,
          losses: 4,
        },
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockPlayers);
      mockPrisma.player.count.mockResolvedValue(1);

      await playerService.getPlayers(1, 20, 'John');

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'John',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should filter players by club', async () => {
      const mockPlayers = [
        {
          id: '1',
          name: 'Player 1',
          eloRating: 1500,
          totalGames: 10,
          wins: 6,
          losses: 4,
          clubId: 'club-1',
        },
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockPlayers);
      mockPrisma.player.count.mockResolvedValue(1);

      await playerService.getPlayers(1, 20, undefined, 'club-1');

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: 'club-1',
          }),
        })
      );
    });
  });

  describe('getPlayerById', () => {
    it('should return player with all relations', async () => {
      const mockPlayer = {
        id: '1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 10,
        wins: 6,
        losses: 4,
        user: {
          id: 'user-1',
          name: 'User 1',
          email: 'user@example.com',
          subscriptionTier: 'FREE',
        },
        club: {
          id: 'club-1',
          name: 'Club 1',
          description: 'Test club',
          logoUrl: null,
        },
        roleStats: [
          {
            role: 'DON',
            gamesPlayed: 5,
            wins: 3,
            losses: 2,
            winRate: 0.6,
          },
        ],
        participations: [],
      };

      mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await playerService.getPlayerById('1');

      expect(result).toEqual(mockPlayer);
      expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw error if player not found', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);

      await expect(playerService.getPlayerById('nonexistent')).rejects.toThrow(
        'Player not found'
      );
    });
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const playerData = {
        gomafiaId: 'gm-123',
        name: 'New Player',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      };

      const mockCreatedPlayer = {
        id: '1',
        ...playerData,
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'User 1',
          email: 'user@example.com',
        },
        club: null,
      };

      mockPrisma.player.create.mockResolvedValue(mockCreatedPlayer);

      const result = await playerService.createPlayer(playerData, 'user-1');

      expect(result).toEqual(mockCreatedPlayer);
      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          ...playerData,
          userId: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should validate player data', async () => {
      const invalidData = {
        gomafiaId: '',
        name: 'A', // Too short
        eloRating: -100, // Invalid
        totalGames: 5,
        wins: 3,
        losses: 1, // Doesn't add up
      };

      await expect(
        playerService.createPlayer(invalidData, 'user-1')
      ).rejects.toThrow();
    });
  });

  describe('updatePlayer', () => {
    it('should update player data', async () => {
      const updateData = {
        name: 'Updated Player',
        eloRating: 1600,
      };

      const mockUpdatedPlayer = {
        id: '1',
        name: 'Updated Player',
        eloRating: 1600,
        totalGames: 10,
        wins: 6,
        losses: 4,
        user: {
          id: 'user-1',
          name: 'User 1',
          email: 'user@example.com',
        },
        club: null,
        roleStats: [],
      };

      mockPrisma.player.update.mockResolvedValue(mockUpdatedPlayer);

      const result = await playerService.updatePlayer('1', updateData);

      expect(result).toEqual(mockUpdatedPlayer);
      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
        include: expect.any(Object),
      });
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player', async () => {
      mockPrisma.player.delete.mockResolvedValue({});

      await playerService.deletePlayer('1');

      expect(mockPrisma.player.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getPlayerAnalytics', () => {
    it('should return player analytics', async () => {
      const mockPlayer = {
        id: '1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 10,
        wins: 6,
        losses: 4,
        roleStats: [
          {
            role: 'DON',
            gamesPlayed: 5,
            wins: 3,
            losses: 2,
            winRate: 0.6,
          },
        ],
        participations: [
          {
            game: {
              id: 'game-1',
              date: new Date(),
              status: 'COMPLETED',
              winnerTeam: 'BLACK',
            },
            role: 'DON',
            team: 'BLACK',
            isWinner: true,
            performanceScore: 85,
          },
        ],
      };

      mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await playerService.getPlayerAnalytics('1');

      expect(result).toEqual({
        player: mockPlayer,
        overallStats: {
          totalGames: 10,
          wins: 6,
          losses: 4,
          winRate: 60,
          eloRating: 1500,
        },
        roleStats: mockPlayer.roleStats,
        recentGames: [
          {
            gameId: 'game-1',
            date: mockPlayer.participations[0].game.date,
            role: 'DON',
            team: 'BLACK',
            isWinner: true,
            performanceScore: 85,
            gameStatus: 'COMPLETED',
            winnerTeam: 'BLACK',
          },
        ],
      });
    });
  });
});
