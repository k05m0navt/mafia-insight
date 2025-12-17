/**
 * Integration tests for win rate analysis API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/[id]/analytics/win-rates/route';

// Mock authentication
vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock repository
vi.mock('@/infrastructure/persistence/win-rate.repository', () => ({
  WinRateRepository: vi.fn().mockImplementation(() => ({
    getWinRateData: vi.fn(),
    verifyPlayerAccess: vi.fn(),
  })),
}));

// Mock analyzer
vi.mock('@/domain/services/win-rate-analyzer', () => ({
  WinRateAnalyzer: vi.fn().mockImplementation(() => ({
    calculateWinRateAnalysis: vi.fn(),
  })),
}));

describe('GET /api/players/[id]/analytics/win-rates', () => {
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

  it('should return win rate analysis for a player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { WinRateRepository } = await import(
      '@/infrastructure/persistence/win-rate.repository'
    );
    const { WinRateAnalyzer } = await import(
      '@/domain/services/win-rate-analyzer'
    );

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    // Mock repository
    const mockRepository = new WinRateRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getWinRateData).mockResolvedValue([
      {
        role: 'DON',
        isWinner: true,
        gameId: 'game1',
        tournamentId: null,
      },
      {
        role: 'DON',
        isWinner: false,
        gameId: 'game2',
        tournamentId: null,
      },
      {
        role: 'MAFIA',
        isWinner: true,
        gameId: 'game3',
        tournamentId: 'tour1',
      },
    ] as any);

    // Mock analyzer
    const mockAnalyzer = new WinRateAnalyzer();
    vi.mocked(mockAnalyzer.calculateWinRateAnalysis).mockReturnValue({
      overall: 66.67,
      byRole: {
        DON: 50,
        MAFIA: 100,
        SHERIFF: 0,
        CITIZEN: 0,
      },
      byScenario: {
        tournament: 100,
        casual: 50,
      },
      comparisonToAverage: undefined,
      winLossCounts: {
        overall: {
          wins: 2,
          losses: 1,
          total: 3,
        },
        byRole: {
          DON: { wins: 1, losses: 1, total: 2 },
          MAFIA: { wins: 1, losses: 0, total: 1 },
          SHERIFF: { wins: 0, losses: 0, total: 0 },
          CITIZEN: { wins: 0, losses: 0, total: 0 },
        },
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/win-rates`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBe(66.67);
    expect(data.byRole.DON).toBe(50);
    expect(data.byRole.MAFIA).toBe(100);
    expect(data.byScenario).toBeDefined();
    expect(data.winLossCounts.overall.wins).toBe(2);
  });

  it('should handle date range preset', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { WinRateRepository } = await import(
      '@/infrastructure/persistence/win-rate.repository'
    );
    const { WinRateAnalyzer } = await import(
      '@/domain/services/win-rate-analyzer'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new WinRateRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getWinRateData).mockResolvedValue([]);

    const mockAnalyzer = new WinRateAnalyzer();
    vi.mocked(mockAnalyzer.calculateWinRateAnalysis).mockReturnValue({
      overall: 0,
      byRole: { DON: 0, MAFIA: 0, SHERIFF: 0, CITIZEN: 0 },
      winLossCounts: {
        overall: { wins: 0, losses: 0, total: 0 },
        byRole: {},
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/win-rates?dateRangePreset=last_month`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockRepository.getWinRateData).toHaveBeenCalled();
  });

  it('should handle role filtering', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { WinRateRepository } = await import(
      '@/infrastructure/persistence/win-rate.repository'
    );
    const { WinRateAnalyzer } = await import(
      '@/domain/services/win-rate-analyzer'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new WinRateRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getWinRateData).mockResolvedValue([]);

    const mockAnalyzer = new WinRateAnalyzer();
    vi.mocked(mockAnalyzer.calculateWinRateAnalysis).mockReturnValue({
      overall: 0,
      byRole: { DON: 0, MAFIA: 0, SHERIFF: 0, CITIZEN: 0 },
      winLossCounts: {
        overall: { wins: 0, losses: 0, total: 0 },
        byRole: {},
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/win-rates?roles=DON,MAFIA`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    expect(mockRepository.getWinRateData).toHaveBeenCalled();
  });

  it('should return 404 when player not found', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { WinRateRepository } = await import(
      '@/infrastructure/persistence/win-rate.repository'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const mockRepository = new WinRateRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/win-rates`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });

  it('should return 400 for invalid parameters', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: mockUserId },
      role: 'user',
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/players/invalid-uuid/analytics/win-rates`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'invalid-uuid' }),
    });

    expect(response.status).toBe(400);
  });

  it('should allow admin access to any player', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { WinRateRepository } = await import(
      '@/infrastructure/persistence/win-rate.repository'
    );
    const { WinRateAnalyzer } = await import(
      '@/domain/services/win-rate-analyzer'
    );

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: 'admin-user-id' },
      role: 'admin',
    } as any);

    const mockRepository = new WinRateRepository();
    vi.mocked(mockRepository.verifyPlayerAccess).mockResolvedValue(true);
    vi.mocked(mockRepository.getWinRateData).mockResolvedValue([]);

    const mockAnalyzer = new WinRateAnalyzer();
    vi.mocked(mockAnalyzer.calculateWinRateAnalysis).mockReturnValue({
      overall: 0,
      byRole: { DON: 0, MAFIA: 0, SHERIFF: 0, CITIZEN: 0 },
      winLossCounts: {
        overall: { wins: 0, losses: 0, total: 0 },
        byRole: {},
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/players/${mockPlayerId}/analytics/win-rates`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: mockPlayerId }),
    });

    expect(response.status).toBe(200);
    // Admin should be able to access any player
    expect(mockRepository.verifyPlayerAccess).toHaveBeenCalledWith(
      mockPlayerId
    );
  });
});
