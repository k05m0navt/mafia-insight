/**
 * Integration tests for ELO trends API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/elo-trends/route';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/elo-trends.repository', () => ({
  ELOTrendsRepository: vi.fn().mockImplementation(() => ({
    getELOTrendData: vi.fn(),
    getCurrentELO: vi.fn(),
    verifyPlayerAccess: vi.fn(),
  })),
}));

// Mock calculator
vi.mock('@/domain/services/elo-trend-calculator', () => ({
  ELOTrendCalculator: vi.fn().mockImplementation(() => ({
    calculateTrends: vi.fn(),
    calculateCurrentELO: vi.fn(),
    calculateHistoricalHighLow: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/elo-trends', () => {
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

  it('should return ELO trends for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { ELOTrendsRepository } = await import(
      '@/infrastructure/persistence/elo-trends.repository'
    );
    const { ELOTrendCalculator } = await import(
      '@/domain/services/elo-trend-calculator'
    );

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    // Mock repository
    const mockRepository = new ELOTrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getCurrentELO).mockResolvedValue(1500);
    vi.mocked(mockRepository.getELOTrendData).mockResolvedValue([
      {
        gameId: 'game-1',
        gameDate: new Date('2024-01-01'),
        eloChange: 10,
        playerEloAfter: null,
      },
      {
        gameId: 'game-2',
        gameDate: new Date('2024-01-02'),
        eloChange: -5,
        playerEloAfter: null,
      },
    ] as any);

    // Mock calculator
    const mockCalculator = new ELOTrendCalculator();
    vi.mocked(mockCalculator.calculateTrends).mockReturnValue([
      { date: '2024-01-01', elo: 1485, gameId: 'game-1' },
      { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
    ] as any);
    vi.mocked(mockCalculator.calculateCurrentELO).mockReturnValue(1500);
    vi.mocked(mockCalculator.calculateHistoricalHighLow).mockReturnValue({
      high: 1500,
      low: 1485,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('trends');
    expect(data).toHaveProperty('currentELO');
    expect(data).toHaveProperty('historicalHigh');
    expect(data).toHaveProperty('historicalLow');
    expect(data.trends).toHaveLength(2);
    expect(data.currentELO).toBe(1500);
  });

  it('should filter by date range preset', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { ELOTrendsRepository } = await import(
      '@/infrastructure/persistence/elo-trends.repository'
    );
    const { ELOTrendCalculator } = await import(
      '@/domain/services/elo-trend-calculator'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new ELOTrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getCurrentELO).mockResolvedValue(1500);
    vi.mocked(mockRepository.getELOTrendData).mockResolvedValue([]);

    const mockCalculator = new ELOTrendCalculator();
    vi.mocked(mockCalculator.calculateTrends).mockReturnValue([]);
    vi.mocked(mockCalculator.calculateCurrentELO).mockReturnValue(1500);
    vi.mocked(mockCalculator.calculateHistoricalHighLow).mockReturnValue({
      high: 1500,
      low: 1500,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends?dateRangePreset=last_month`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockRepository.getELOTrendData).toHaveBeenCalled();
  });

  it('should support period aggregation', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { ELOTrendsRepository } = await import(
      '@/infrastructure/persistence/elo-trends.repository'
    );
    const { ELOTrendCalculator } = await import(
      '@/domain/services/elo-trend-calculator'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new ELOTrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getCurrentELO).mockResolvedValue(1500);
    vi.mocked(mockRepository.getELOTrendData).mockResolvedValue([]);

    const mockCalculator = new ELOTrendCalculator();
    vi.mocked(mockCalculator.calculateTrends).mockReturnValue([]);
    vi.mocked(mockCalculator.calculateCurrentELO).mockReturnValue(1500);
    vi.mocked(mockCalculator.calculateHistoricalHighLow).mockReturnValue({
      high: 1500,
      low: 1500,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends?period=week`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCalculator.calculateTrends).toHaveBeenCalledWith(
      expect.any(Array),
      1500,
      'week'
    );
  });

  it('should return 404 when player not found', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { ELOTrendsRepository } = await import(
      '@/infrastructure/persistence/elo-trends.repository'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new ELOTrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends`
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
      `http://localhost:3000/api/players/${invalidPlayerId}/analytics/elo-trends`
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
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(401);
  });

  it('should handle all_time preset correctly', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { ELOTrendsRepository } = await import(
      '@/infrastructure/persistence/elo-trends.repository'
    );
    const { ELOTrendCalculator } = await import(
      '@/domain/services/elo-trend-calculator'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new ELOTrendsRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getCurrentELO).mockResolvedValue(1500);
    vi.mocked(mockRepository.getELOTrendData).mockResolvedValue([]);

    const mockCalculator = new ELOTrendCalculator();
    vi.mocked(mockCalculator.calculateTrends).mockReturnValue([]);
    vi.mocked(mockCalculator.calculateCurrentELO).mockReturnValue(1500);
    vi.mocked(mockCalculator.calculateHistoricalHighLow).mockReturnValue({
      high: 1500,
      low: 1500,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/elo-trends?dateRangePreset=all_time`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    // all_time should not filter by date
    expect(mockRepository.getELOTrendData).toHaveBeenCalledWith(
      mockPlayerId,
      undefined
    );
  });
});
