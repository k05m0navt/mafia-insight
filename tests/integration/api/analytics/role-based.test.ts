/**
 * Integration tests for role-based analytics API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/role-based/route';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/role-metrics.repository', () => ({
  RoleMetricsRepository: vi.fn().mockImplementation(() => ({
    getRoleParticipationData: vi.fn(),
    verifyPlayerAccess: vi.fn(),
  })),
}));

// Mock calculator
vi.mock('@/domain/services/role-metrics-calculator', () => ({
  RoleMetricsCalculator: vi.fn().mockImplementation(() => ({
    calculateRoleMetrics: vi.fn(),
    filterByRoles: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/role-based', () => {
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

  it('should return role metrics for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleMetricsRepository } = await import(
      '@/infrastructure/persistence/role-metrics.repository'
    );
    const { RoleMetricsCalculator } = await import(
      '@/domain/services/role-metrics-calculator'
    );

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    // Mock repository
    const mockRepository = new RoleMetricsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getRoleParticipationData).mockResolvedValue([
      {
        role: 'DON',
        gamesPlayed: 10,
        wins: 6,
        losses: 4,
        totalELO: 12000,
      },
      {
        role: 'MAFIA',
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        totalELO: 6000,
      },
    ] as any);

    // Mock calculator
    const mockCalculator = new RoleMetricsCalculator();
    vi.mocked(mockCalculator.calculateRoleMetrics).mockReturnValue([
      {
        role: 'DON',
        winRate: 60.0,
        gamesPlayed: 10,
        wins: 6,
        losses: 4,
        averageELO: 1200,
        performanceLevel: 'excellent',
      },
      {
        role: 'MAFIA',
        winRate: 60.0,
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        averageELO: 1200,
        performanceLevel: 'excellent',
      },
      {
        role: 'SHERIFF',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
        performanceLevel: 'needs_improvement',
      },
      {
        role: 'CITIZEN',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
        performanceLevel: 'needs_improvement',
      },
    ] as any);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-based`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('roleMetrics');
    expect(data.roleMetrics).toHaveLength(4);
    expect(data.roleMetrics[0]).toMatchObject({
      role: 'DON',
      winRate: 60.0,
      gamesPlayed: 10,
    });
  });

  it('should filter by roles when roles parameter is provided', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleMetricsRepository } = await import(
      '@/infrastructure/persistence/role-metrics.repository'
    );
    const { RoleMetricsCalculator } = await import(
      '@/domain/services/role-metrics-calculator'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleMetricsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getRoleParticipationData).mockResolvedValue([]);

    const mockCalculator = new RoleMetricsCalculator();
    const allMetrics = [
      { role: 'DON', winRate: 60, gamesPlayed: 10 } as any,
      { role: 'MAFIA', winRate: 50, gamesPlayed: 5 } as any,
      { role: 'SHERIFF', winRate: 0, gamesPlayed: 0 } as any,
      { role: 'CITIZEN', winRate: 0, gamesPlayed: 0 } as any,
    ];
    vi.mocked(mockCalculator.calculateRoleMetrics).mockReturnValue(allMetrics);
    vi.mocked(mockCalculator.filterByRoles).mockReturnValue([
      allMetrics[0],
      allMetrics[1],
    ]);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-based?roles=DON,MAFIA`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCalculator.filterByRoles).toHaveBeenCalledWith(
      expect.any(Array),
      ['DON', 'MAFIA']
    );
  });

  it('should return 404 when player not found', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { RoleMetricsRepository } = await import(
      '@/infrastructure/persistence/role-metrics.repository'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new RoleMetricsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-based`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });

  it('should return 400 for invalid player ID format', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const invalidPlayerId = 'not-a-uuid';
    const request = new NextRequest(
      `http://localhost:3000/api/players/${invalidPlayerId}/analytics/role-based`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: invalidPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockRejectedValue(
      new Error('Authentication required')
    );

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/role-based`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(401);
  });
});
