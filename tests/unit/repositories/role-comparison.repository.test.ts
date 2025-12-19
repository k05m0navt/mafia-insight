/**
 * Unit tests for RoleComparisonRepository
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoleComparisonRepository } from '@/infrastructure/persistence/role-comparison.repository';
import { prisma } from '@/lib/db';
import type { PlayerRole } from '@/types/analytics';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    gameParticipation: {
      findMany: vi.fn(),
    },
  },
}));

describe('RoleComparisonRepository', () => {
  let repository: RoleComparisonRepository;

  beforeEach(() => {
    repository = new RoleComparisonRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoleComparison', () => {
    const mockPlayerId = 'test-player-id';
    const mockUserId = 'test-user-id';

    it('should return role comparison data for a player', async () => {
      // Mock player exists
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        eloRating: 1500,
      } as any);

      // Mock participations
      const mockParticipations = [
        {
          role: 'DON' as PlayerRole,
          isWinner: true,
          eloChange: 10,
          game: {
            id: 'game-1',
            date: new Date('2024-01-01'),
          },
        },
        {
          role: 'DON' as PlayerRole,
          isWinner: false,
          eloChange: -10,
          game: {
            id: 'game-2',
            date: new Date('2024-01-02'),
          },
        },
        {
          role: 'MAFIA' as PlayerRole,
          isWinner: true,
          eloChange: 15,
          game: {
            id: 'game-3',
            date: new Date('2024-01-03'),
          },
        },
      ];

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce(
        mockParticipations as any
      );

      const result = await repository.getRoleComparison(mockPlayerId);

      expect(result).toHaveLength(2); // DON and MAFIA
      expect(result.find((r) => r.role === 'DON')).toBeDefined();
      expect(result.find((r) => r.role === 'MAFIA')).toBeDefined();

      const donData = result.find((r) => r.role === 'DON')!;
      expect(donData.gamesPlayed).toBe(2);
      expect(donData.wins).toBe(1);
      expect(donData.losses).toBe(1);
      expect(donData.participations).toHaveLength(2);
    });

    it('should apply date range filtering', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        eloRating: 1500,
      } as any);

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce([]);

      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      await repository.getRoleComparison(mockPlayerId, dateRange);

      expect(prisma.gameParticipation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            game: expect.objectContaining({
              date: {
                gte: new Date('2024-01-01'),
                lte: new Date('2024-01-31'),
              },
            }),
          }),
        })
      );
    });

    it('should apply role filtering', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        eloRating: 1500,
      } as any);

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce([]);

      const roles: PlayerRole[] = ['DON', 'MAFIA'];

      await repository.getRoleComparison(mockPlayerId, undefined, roles);

      expect(prisma.gameParticipation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { in: roles },
          }),
        })
      );
    });

    it('should calculate ELO correctly for each role', async () => {
      vi.mocked(prisma.player.findUnique)
        .mockResolvedValueOnce({
          id: mockPlayerId,
          eloRating: 1500,
        } as any)
        .mockResolvedValueOnce({
          id: mockPlayerId,
          eloRating: 1500,
        } as any);

      // Games in chronological order (oldest first)
      // Game 1: ELO 1490 -> 1500 (win, +10)
      // Game 2: ELO 1500 -> 1510 (win, +10)
      const mockParticipations = [
        {
          role: 'DON' as PlayerRole,
          isWinner: true,
          eloChange: 10,
          game: {
            id: 'game-1',
            date: new Date('2024-01-01'),
          },
        },
        {
          role: 'DON' as PlayerRole,
          isWinner: true,
          eloChange: 10,
          game: {
            id: 'game-2',
            date: new Date('2024-01-02'),
          },
        },
      ];

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce(
        mockParticipations as any
      );

      const result = await repository.getRoleComparison(mockPlayerId);

      const donData = result.find((r) => r.role === 'DON')!;
      // Average ELO should be calculated from ELO after each game
      // Game 1: ELO after = 1500, Game 2: ELO after = 1510
      // Average = (1500 + 1510) / 2 = 1505
      expect(donData.eloCount).toBe(2);
      expect(donData.totalELO).toBeGreaterThan(0);
    });

    it('should throw error if player not found', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce(null);

      await expect(
        repository.getRoleComparison('non-existent-player-id')
      ).rejects.toThrow('Player not found');
    });

    it('should handle empty participations', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        eloRating: 1500,
      } as any);

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce([]);

      const result = await repository.getRoleComparison(mockPlayerId);

      expect(result).toHaveLength(0);
    });

    it('should group participations by role correctly', async () => {
      vi.mocked(prisma.player.findUnique)
        .mockResolvedValueOnce({
          id: mockPlayerId,
          eloRating: 1500,
        } as any)
        .mockResolvedValueOnce({
          id: mockPlayerId,
          eloRating: 1500,
        } as any);

      const mockParticipations = [
        {
          role: 'DON' as PlayerRole,
          isWinner: true,
          eloChange: 10,
          game: { id: 'game-1', date: new Date('2024-01-01') },
        },
        {
          role: 'DON' as PlayerRole,
          isWinner: false,
          eloChange: -10,
          game: { id: 'game-2', date: new Date('2024-01-02') },
        },
        {
          role: 'MAFIA' as PlayerRole,
          isWinner: true,
          eloChange: 15,
          game: { id: 'game-3', date: new Date('2024-01-03') },
        },
        {
          role: 'SHERIFF' as PlayerRole,
          isWinner: true,
          eloChange: 5,
          game: { id: 'game-4', date: new Date('2024-01-04') },
        },
      ];

      vi.mocked(prisma.gameParticipation.findMany).mockResolvedValueOnce(
        mockParticipations as any
      );

      const result = await repository.getRoleComparison(mockPlayerId);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.role)).toEqual(
        expect.arrayContaining(['DON', 'MAFIA', 'SHERIFF'])
      );

      const donData = result.find((r) => r.role === 'DON')!;
      expect(donData.gamesPlayed).toBe(2);
      expect(donData.wins).toBe(1);
      expect(donData.losses).toBe(1);
    });

    it('should only count completed games', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        eloRating: 1500,
      } as any);

      await repository.getRoleComparison(mockPlayerId);

      expect(prisma.gameParticipation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            game: expect.objectContaining({
              status: 'COMPLETED',
            }),
          }),
        })
      );
    });
  });

  describe('verifyPlayerAccess', () => {
    const mockPlayerId = 'test-player-id';
    const mockUserId = 'test-user-id';
    const otherUserId = 'other-user-id';

    it('should return true if player exists', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        userId: mockUserId,
      } as any);

      const result = await repository.verifyPlayerAccess(mockPlayerId);

      expect(result).toBe(true);
    });

    it('should return false if player does not exist', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce(null);

      const result = await repository.verifyPlayerAccess('non-existent-id');

      expect(result).toBe(false);
    });

    it('should return true if player belongs to user', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        userId: mockUserId,
      } as any);

      const result = await repository.verifyPlayerAccess(
        mockPlayerId,
        mockUserId
      );

      expect(result).toBe(true);
    });

    it('should return false if player does not belong to user', async () => {
      vi.mocked(prisma.player.findUnique).mockResolvedValueOnce({
        id: mockPlayerId,
        userId: otherUserId,
      } as any);

      const result = await repository.verifyPlayerAccess(
        mockPlayerId,
        mockUserId
      );

      expect(result).toBe(false);
    });
  });
});
