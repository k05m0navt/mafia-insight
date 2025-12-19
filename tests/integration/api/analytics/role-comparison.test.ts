/**
 * Integration tests for role comparison API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/role-comparison/route';
import type { PlayerRole } from '@/types/analytics';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/role-comparison.repository', () => ({
  RoleComparisonRepository: vi.fn().mockImplementation(() => ({
    getRoleComparison: vi.fn(),
    verifyPlayerAccess: vi.fn(),
  })),
}));

// Mock use case
vi.mock('@/application/use-cases/get-role-comparison.use-case', () => ({
  GetRoleComparisonUseCase: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/role-comparison', () => {
  let mockUserId: string;
  let mockPlayerId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = 'test-user-id';
    mockPlayerId = 'test-player-id';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return role comparison for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    // Mock repository
    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    // Mock use case
    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [
        {
          role: 'DON' as PlayerRole,
          winRate: 60.0,
          gamesPlayed: 10,
          averageELO: 1500,
          winStreak: 3,
        },
        {
          role: 'MAFIA' as PlayerRole,
          winRate: 50.0,
          gamesPlayed: 8,
          averageELO: 1450,
          winStreak: 1,
        },
      ],
      bestPerformingRole: 'DON' as PlayerRole,
      metrics: {
        winRate: { DON: 60.0, MAFIA: 50.0 },
        gamesPlayed: { DON: 10, MAFIA: 8 },
        averageELO: { DON: 1500, MAFIA: 1450 },
        winStreak: { DON: 3, MAFIA: 1 },
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('roles');
    expect(data.roles).toHaveLength(2);
    expect(data.bestPerformingRole).toBe('DON');
    expect(data.metrics).toBeDefined();
  });

  it('should accept startDate and endDate query parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [],
      bestPerformingRole: 'CITIZEN' as PlayerRole,
      metrics: {},
    });

    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison?startDate=${startDate}&endDate=${endDate}`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalled();
    const callArgs = vi.mocked(mockUseCase.execute).mock.calls[0];
    expect(callArgs[1]).toHaveProperty('startDate', startDate);
    expect(callArgs[1]).toHaveProperty('endDate', endDate);
  });

  it('should accept dateRangePreset query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [],
      bestPerformingRole: 'CITIZEN' as PlayerRole,
      metrics: {},
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison?dateRangePreset=last_month`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalled();
    const callArgs = vi.mocked(mockUseCase.execute).mock.calls[0];
    expect(callArgs[1]).toHaveProperty('preset', 'last_month');
  });

  it('should accept roles query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [],
      bestPerformingRole: 'CITIZEN' as PlayerRole,
      metrics: {},
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison?roles=DON,MAFIA`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalled();
    const callArgs = vi.mocked(mockUseCase.execute).mock.calls[0];
    expect(callArgs[2]).toEqual(['DON', 'MAFIA']);
  });

  it('should return 404 for non-existent player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const invalidPlayerId = 'non-existent-player-id';
    const request = new NextRequest(
      `http://localhost:3000/api/players/${invalidPlayerId}/analytics/role-comparison`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: invalidPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });

  it('should return 400 for invalid query parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison?roles=INVALID_ROLE`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid parameters');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison`
    );

    await expect(
      GET(request, {
        params: Promise.resolve({ id: mockPlayerId }),
      })
    ).rejects.toThrow();
  });

  it('should allow admin to access any player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: 'admin-user-id' },
      role: 'admin',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [],
      bestPerformingRole: 'CITIZEN' as PlayerRole,
      metrics: {},
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockRepository.verifyPlayerAccess).toHaveBeenCalledWith(
      mockPlayerId
    );
  });

  it('should return 500 for server errors', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle empty comparison data', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleComparisonRepository } =
      await import('@/infrastructure/persistence/role-comparison.repository');
    const { GetRoleComparisonUseCase } =
      await import('@/application/use-cases/get-role-comparison.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleComparisonRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetRoleComparisonUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      roles: [],
      bestPerformingRole: 'CITIZEN' as PlayerRole,
      metrics: {
        winRate: {},
        gamesPlayed: {},
        averageELO: {},
        winStreak: {},
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-comparison`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.roles).toHaveLength(0);
    expect(data.bestPerformingRole).toBe('CITIZEN');
  });
});
