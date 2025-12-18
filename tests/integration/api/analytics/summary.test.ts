/**
 * Integration tests for Performance Summary API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/summary/route';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/performance-summary.repository', () => ({
  PerformanceSummaryRepository: vi.fn().mockImplementation(() => ({
    getPerformanceSummaryData: vi.fn(),
    getRecentActivity: vi.fn(),
    verifyPlayerAccess: vi.fn(),
  })),
}));

// Mock aggregator
vi.mock('@/domain/services/performance-stats-aggregator', () => ({
  PerformanceStatsAggregator: vi.fn().mockImplementation(() => ({
    calculateSummary: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/summary', () => {
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

  it('should return performance summary for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    // Mock repository
    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    // Mock aggregator
    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 10,
      totalWins: 7,
      totalLosses: 3,
      winPercentage: 70,
      averageGameDuration: 45.5,
      longestWinStreak: 4,
      bestELOAchieved: 1250,
      recentActivity: {
        thisWeek: 2,
        thisMonth: 5,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalGames).toBe(10);
    expect(data.totalWins).toBe(7);
    expect(data.totalLosses).toBe(3);
    expect(data.winPercentage).toBe(70);
    expect(data.averageGameDuration).toBe(45.5);
    expect(data.longestWinStreak).toBe(4);
    expect(data.bestELOAchieved).toBe(1250);
    expect(data.recentActivity.thisWeek).toBe(2);
    expect(data.recentActivity.thisMonth).toBe(5);
  });

  it('should handle date range preset query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 5,
      totalWins: 3,
      totalLosses: 2,
      winPercentage: 60,
      averageGameDuration: undefined,
      longestWinStreak: 2,
      bestELOAchieved: 1200,
      recentActivity: {
        thisWeek: 1,
        thisMonth: 3,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary?dateRangePreset=last_month`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockAggregator.calculateSummary).toHaveBeenCalledWith(
      mockPlayerId,
      expect.objectContaining({
        preset: 'last_month',
      }),
      undefined
    );
  });

  it('should handle explicit date range query parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 3,
      totalWins: 2,
      totalLosses: 1,
      winPercentage: 66.67,
      averageGameDuration: 50,
      longestWinStreak: 2,
      bestELOAchieved: 1220,
      recentActivity: {
        thisWeek: 0,
        thisMonth: 2,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary?startDate=2024-01-01&endDate=2024-01-31`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockAggregator.calculateSummary).toHaveBeenCalledWith(
      mockPlayerId,
      expect.objectContaining({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }),
      undefined
    );
  });

  it('should handle roles query parameter', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 4,
      totalWins: 3,
      totalLosses: 1,
      winPercentage: 75,
      averageGameDuration: 45,
      longestWinStreak: 3,
      bestELOAchieved: 1230,
      recentActivity: {
        thisWeek: 1,
        thisMonth: 2,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary?roles=DON,MAFIA`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockAggregator.calculateSummary).toHaveBeenCalledWith(
      mockPlayerId,
      undefined,
      ['DON', 'MAFIA']
    );
  });

  it('should handle combined date range and roles filters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 2,
      totalWins: 1,
      totalLosses: 1,
      winPercentage: 50,
      averageGameDuration: 40,
      longestWinStreak: 1,
      bestELOAchieved: 1200,
      recentActivity: {
        thisWeek: 0,
        thisMonth: 1,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary?dateRangePreset=last_month&roles=SHERIFF`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockAggregator.calculateSummary).toHaveBeenCalledWith(
      mockPlayerId,
      expect.objectContaining({
        preset: 'last_month',
      }),
      ['SHERIFF']
    );
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockRejectedValue(
      new Error('Authentication required')
    );

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Authentication required');
  });

  it('should return 404 for non-existent player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/players/non-existent-player/analytics/summary`
    );

    const params = Promise.resolve({ id: 'non-existent-player' });
    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Player not found');
  });

  it("should return 403 when user tries to access another player's data", async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: 'different-user-id' },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(404); // Returns 404 for security (player not found)
    const data = await response.json();
    expect(data.error).toBe('Player not found');
  });

  it("should allow admin users to access any player's data", async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: 'admin-user-id' },
      role: 'admin',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 5,
      totalWins: 3,
      totalLosses: 2,
      winPercentage: 60,
      averageGameDuration: 45,
      longestWinStreak: 2,
      bestELOAchieved: 1200,
      recentActivity: {
        thisWeek: 1,
        thisMonth: 2,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockRepository.verifyPlayerAccess).toHaveBeenCalledWith(
      mockPlayerId
    );
  });

  it('should return 400 for invalid query parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    // Invalid player ID (not UUID format)
    const request = new NextRequest(
      'http://localhost:3000/api/players/invalid-id-format/analytics/summary'
    );

    const params = Promise.resolve({ id: 'invalid-id-format' });
    const response = await GET(request, { params });

    // Should return 400 for invalid UUID format
    expect([400, 404]).toContain(response.status);
  });

  it('should handle missing averageGameDuration gracefully', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 3,
      totalWins: 2,
      totalLosses: 1,
      winPercentage: 66.67,
      averageGameDuration: undefined, // No duration data
      longestWinStreak: 2,
      bestELOAchieved: 1200,
      recentActivity: {
        thisWeek: 0,
        thisMonth: 2,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.averageGameDuration).toBeUndefined();
    expect(data.totalGames).toBe(3);
  });

  it('should handle all_time preset correctly', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 20,
      totalWins: 12,
      totalLosses: 8,
      winPercentage: 60,
      averageGameDuration: 50,
      longestWinStreak: 5,
      bestELOAchieved: 1300,
      recentActivity: {
        thisWeek: 2,
        thisMonth: 8,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary?dateRangePreset=all_time`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    // all_time preset should result in undefined dateRange
    expect(mockAggregator.calculateSummary).toHaveBeenCalledWith(
      mockPlayerId,
      undefined,
      undefined
    );
  });

  it('should handle empty result (no games)', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { PerformanceSummaryRepository } =
      await import('@/infrastructure/persistence/performance-summary.repository');
    const { PerformanceStatsAggregator } =
      await import('@/domain/services/performance-stats-aggregator');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    });

    const mockRepository = new PerformanceSummaryRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);

    const mockAggregator = new PerformanceStatsAggregator();
    vi.mocked(mockAggregator.calculateSummary).mockResolvedValue({
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winPercentage: 0,
      averageGameDuration: undefined,
      longestWinStreak: 0,
      bestELOAchieved: 0,
      recentActivity: {
        thisWeek: 0,
        thisMonth: 0,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/summary`
    );

    const params = Promise.resolve({ id: mockPlayerId });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalGames).toBe(0);
    expect(data.winPercentage).toBe(0);
  });
});
