/**
 * Integration tests for performance trends API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/trends/route';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/trends.repository', () => ({
  TrendsRepository: vi.fn().mockImplementation(() => ({
    getTrendData: vi.fn(),
    verifyPlayerAccess: vi.fn(),
    getPeriodKey: vi.fn(),
  })),
}));

// Mock use case
vi.mock('@/application/use-cases/get-performance-trends.use-case', () => ({
  GetPerformanceTrendsUseCase: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/trends', () => {
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

  it('should return performance trends for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');
    const { GetPerformanceTrendsUseCase } =
      await import('@/application/use-cases/get-performance-trends.use-case');

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    // Mock repository
    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    // Mock use case
    const mockUseCase = new GetPerformanceTrendsUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      trends: [
        {
          period: 'month',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
          metrics: {
            winRate: 60.5,
            elo: 1500,
            gamesPlayed: 10,
          },
          trend: 'up',
          changeFromPrevious: 5.2,
        },
      ],
      comparison: undefined,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends?period=month`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('trends');
    expect(data.trends).toHaveLength(1);
    expect(data.trends[0].period).toBe('month');
    expect(data.trends[0].metrics.winRate).toBe(60.5);
  });

  it('should accept period query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');
    const { GetPerformanceTrendsUseCase } =
      await import('@/application/use-cases/get-performance-trends.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetPerformanceTrendsUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      trends: [],
      comparison: undefined,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends?period=week`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      mockPlayerId,
      'week',
      undefined,
      undefined
    );
  });

  it('should accept date range parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');
    const { GetPerformanceTrendsUseCase } =
      await import('@/application/use-cases/get-performance-trends.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetPerformanceTrendsUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      trends: [],
      comparison: undefined,
    });

    const startDate = '2024-01-01T00:00:00.000Z';
    const endDate = '2024-12-31T23:59:59.999Z';
    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends?period=month&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalled();
    const callArgs = vi.mocked(mockUseCase.execute).mock.calls[0];
    expect(callArgs[2]).toHaveProperty('startDate');
    expect(callArgs[2]).toHaveProperty('endDate');
  });

  it('should accept roles query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');
    const { GetPerformanceTrendsUseCase } =
      await import('@/application/use-cases/get-performance-trends.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetPerformanceTrendsUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      trends: [],
      comparison: undefined,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends?period=month&roles=DON,MAFIA`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalled();
    const callArgs = vi.mocked(mockUseCase.execute).mock.calls[0];
    expect(callArgs[3]).toEqual(['DON', 'MAFIA']);
  });

  it('should return 404 for non-existent player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const invalidPlayerId = 'non-existent-player-id';
    const request = new NextRequest(
      `http://localhost:3000/api/players/${invalidPlayerId}/analytics/trends?period=month`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: invalidPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });

  it('should return 400 for invalid period', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends?period=invalid`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid parameters');
  });

  it('should default to month period if not provided', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { TrendsRepository } =
      await import('@/infrastructure/persistence/trends.repository');
    const { GetPerformanceTrendsUseCase } =
      await import('@/application/use-cases/get-performance-trends.use-case');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new TrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockUseCase = new GetPerformanceTrendsUseCase(mockRepository);
    vi.mocked(mockUseCase.execute).mockResolvedValue({
      trends: [],
      comparison: undefined,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/trends`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      mockPlayerId,
      'month', // Default period
      undefined,
      undefined
    );
  });
});
