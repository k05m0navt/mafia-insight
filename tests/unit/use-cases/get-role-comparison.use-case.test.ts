/**
 * Unit tests for GetRoleComparisonUseCase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetRoleComparisonUseCase } from '@/application/use-cases/get-role-comparison.use-case';
import { RoleComparisonRepository } from '@/infrastructure/persistence/role-comparison.repository';
import type { PlayerRole } from '@/types/analytics';
import type { RawRoleComparisonData } from '@/infrastructure/persistence/role-comparison.repository';

// Mock repository
vi.mock('@/infrastructure/persistence/role-comparison.repository');

describe('GetRoleComparisonUseCase', () => {
  let useCase: GetRoleComparisonUseCase;
  let mockRepository: {
    getRoleComparison: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      getRoleComparison: vi.fn(),
    };

    vi.mocked(RoleComparisonRepository).mockImplementation(
      () => mockRepository as any
    );

    useCase = new GetRoleComparisonUseCase(
      mockRepository as unknown as RoleComparisonRepository
    );
  });

  describe('execute', () => {
    const mockPlayerId = 'test-player-id';

    it('should return role comparison with calculated metrics', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 10,
          wins: 6,
          losses: 4,
          totalELO: 15000,
          eloCount: 10,
          participations: [
            { gameDate: new Date('2024-01-01'), isWinner: true },
            { gameDate: new Date('2024-01-02'), isWinner: false },
            { gameDate: new Date('2024-01-03'), isWinner: true },
            { gameDate: new Date('2024-01-04'), isWinner: true },
            { gameDate: new Date('2024-01-05'), isWinner: true },
          ],
        },
        {
          role: 'MAFIA' as PlayerRole,
          gamesPlayed: 8,
          wins: 4,
          losses: 4,
          totalELO: 12000,
          eloCount: 8,
          participations: [
            { gameDate: new Date('2024-01-06'), isWinner: true },
            { gameDate: new Date('2024-01-07'), isWinner: false },
          ],
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      expect(result.roles).toHaveLength(2);
      expect(result.bestPerformingRole).toBe('DON'); // Higher win rate

      const donMetrics = result.roles.find((r) => r.role === 'DON')!;
      expect(donMetrics.winRate).toBe(60); // 6/10 * 100
      expect(donMetrics.gamesPlayed).toBe(10);
      expect(donMetrics.averageELO).toBe(1500); // 15000/10
      expect(donMetrics.winStreak).toBe(3); // Last 3 games are wins

      const mafiaMetrics = result.roles.find((r) => r.role === 'MAFIA')!;
      expect(mafiaMetrics.winRate).toBe(50); // 4/8 * 100
      expect(mafiaMetrics.averageELO).toBe(1500); // 12000/8
      expect(mafiaMetrics.winStreak).toBe(0); // Last game is a loss

      // Check metrics records
      expect(result.metrics.winRate['DON']).toBe(60);
      expect(result.metrics.gamesPlayed['DON']).toBe(10);
      expect(result.metrics.averageELO['DON']).toBe(1500);
      expect(result.metrics.winStreak['DON']).toBe(3);
    });

    it('should return empty comparison when no data', async () => {
      mockRepository.getRoleComparison.mockResolvedValueOnce([]);

      const result = await useCase.execute(mockPlayerId);

      expect(result.roles).toHaveLength(0);
      expect(result.bestPerformingRole).toBe('CITIZEN'); // Default fallback
      expect(result.metrics.winRate).toEqual({});
      expect(result.metrics.gamesPlayed).toEqual({});
      expect(result.metrics.averageELO).toEqual({});
      expect(result.metrics.winStreak).toEqual({});
    });

    it('should calculate win rate correctly for zero games', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          totalELO: 0,
          eloCount: 0,
          participations: [],
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      const donMetrics = result.roles.find((r) => r.role === 'DON')!;
      expect(donMetrics.winRate).toBe(0);
      expect(donMetrics.averageELO).toBe(0);
      expect(donMetrics.winStreak).toBe(0);
    });

    it('should calculate win streak correctly', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 5,
          wins: 3,
          losses: 2,
          totalELO: 7500,
          eloCount: 5,
          participations: [
            { gameDate: new Date('2024-01-01'), isWinner: false }, // Oldest
            { gameDate: new Date('2024-01-02'), isWinner: true },
            { gameDate: new Date('2024-01-03'), isWinner: false },
            { gameDate: new Date('2024-01-04'), isWinner: true }, // Last 3 are wins
            { gameDate: new Date('2024-01-05'), isWinner: true }, // Most recent
          ],
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      const donMetrics = result.roles.find((r) => r.role === 'DON')!;
      // Win streak should be 2 (last 2 games are wins)
      expect(donMetrics.winStreak).toBe(2);
    });

    it('should calculate win streak as 0 when last game is a loss', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 3,
          wins: 2,
          losses: 1,
          totalELO: 4500,
          eloCount: 3,
          participations: [
            { gameDate: new Date('2024-01-01'), isWinner: true },
            { gameDate: new Date('2024-01-02'), isWinner: true },
            { gameDate: new Date('2024-01-03'), isWinner: false }, // Most recent is loss
          ],
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      const donMetrics = result.roles.find((r) => r.role === 'DON')!;
      expect(donMetrics.winStreak).toBe(0);
    });

    it('should determine best-performing role by win rate', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 10,
          wins: 7,
          losses: 3,
          totalELO: 15000,
          eloCount: 10,
          participations: Array(10).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
        {
          role: 'MAFIA' as PlayerRole,
          gamesPlayed: 10,
          wins: 5,
          losses: 5,
          totalELO: 15000,
          eloCount: 10,
          participations: Array(10).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      expect(result.bestPerformingRole).toBe('DON'); // 70% vs 50% win rate
    });

    it('should use average ELO as tiebreaker when win rates are equal', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 10,
          wins: 5,
          losses: 5,
          totalELO: 16000, // Higher average ELO
          eloCount: 10,
          participations: Array(10).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
        {
          role: 'MAFIA' as PlayerRole,
          gamesPlayed: 10,
          wins: 5,
          losses: 5,
          totalELO: 15000, // Lower average ELO
          eloCount: 10,
          participations: Array(10).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      expect(result.bestPerformingRole).toBe('DON'); // Same win rate, higher ELO
    });

    it('should use games played as second tiebreaker', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 20, // More games = more reliable
          wins: 10,
          losses: 10,
          totalELO: 30000,
          eloCount: 20,
          participations: Array(20).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
        {
          role: 'MAFIA' as PlayerRole,
          gamesPlayed: 10, // Fewer games
          wins: 5,
          losses: 5,
          totalELO: 15000,
          eloCount: 10,
          participations: Array(10).fill({
            gameDate: new Date(),
            isWinner: true,
          }),
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      expect(result.bestPerformingRole).toBe('DON'); // Same win rate and ELO, more games
    });

    it('should round win rate and average ELO to 2 decimal places', async () => {
      const mockRawData: RawRoleComparisonData[] = [
        {
          role: 'DON' as PlayerRole,
          gamesPlayed: 3,
          wins: 1,
          losses: 2,
          totalELO: 4501.333, // Will result in 1500.444...
          eloCount: 3,
          participations: [
            { gameDate: new Date('2024-01-01'), isWinner: true },
          ],
        },
      ];

      mockRepository.getRoleComparison.mockResolvedValueOnce(mockRawData);

      const result = await useCase.execute(mockPlayerId);

      const donMetrics = result.roles.find((r) => r.role === 'DON')!;
      expect(donMetrics.winRate).toBe(33.33); // 1/3 * 100 = 33.333... rounded to 33.33
      expect(donMetrics.averageELO).toBe(1500.44); // 4501.333/3 = 1500.444... rounded to 1500.44
    });

    it('should pass date range and roles to repository', async () => {
      mockRepository.getRoleComparison.mockResolvedValueOnce([]);

      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const roles: PlayerRole[] = ['DON', 'MAFIA'];

      await useCase.execute(mockPlayerId, dateRange, roles);

      expect(mockRepository.getRoleComparison).toHaveBeenCalledWith(
        mockPlayerId,
        dateRange,
        roles
      );
    });
  });
});
