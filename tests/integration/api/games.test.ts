import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/games/route';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    game: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Games API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated game list', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
      {
        id: 'game2',
        gomafiaId: 'gomafia2',
        date: new Date('2024-01-14T19:00:00Z'),
        durationMinutes: 50,
        winnerTeam: 'RED',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(2);

    const request = new NextRequest(
      'http://localhost:3000/api/games?page=1&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { date: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle pagination parameters', async () => {
    const mockGames = Array.from({ length: 25 }, (_, i) => ({
      id: `game${i}`,
      gomafiaId: `gomafia${i}`,
      date: new Date(`2024-01-${15 + i}T20:00:00Z`),
      durationMinutes: 45,
      winnerTeam: 'BLACK',
      status: 'COMPLETED',
      lastSyncAt: new Date('2024-01-15T00:00:00Z'),
      syncStatus: 'SYNCED',
    }));

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames.slice(10, 20));
    vi.mocked(db.game.count).mockResolvedValue(25);

    const request = new NextRequest(
      'http://localhost:3000/api/games?page=2&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { date: 'desc' },
      skip: 10,
      take: 10,
    });
  });

  it('should handle filtering by status', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?status=COMPLETED'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: { status: 'COMPLETED' },
      orderBy: { date: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle filtering by winner team', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?winnerTeam=BLACK'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: { winnerTeam: 'BLACK' },
      orderBy: { date: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle filtering by date range', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?startDate=2024-01-01&endDate=2024-01-31'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {
        date: {
          gte: new Date('2024-01-01T00:00:00Z'),
          lte: new Date('2024-01-31T23:59:59Z'),
        },
      },
      orderBy: { date: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle filtering by tournament', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
        tournamentId: 'tournament1',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?tournamentId=tournament1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: { tournamentId: 'tournament1' },
      orderBy: { date: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle sorting by different fields', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?sortBy=durationMinutes&sortOrder=desc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { durationMinutes: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle database errors gracefully', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/games');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Database connection failed');
  });

  it('should validate query parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/games?page=-1&limit=0'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should handle empty results', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue([]);
    vi.mocked(db.game.count).mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/games');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('should handle multiple filters combined', async () => {
    const mockGames = [
      {
        id: 'game1',
        gomafiaId: 'gomafia1',
        date: new Date('2024-01-15T20:00:00Z'),
        durationMinutes: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
        tournamentId: 'tournament1',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.game.findMany).mockResolvedValue(mockGames);
    vi.mocked(db.game.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/games?status=COMPLETED&winnerTeam=BLACK&tournamentId=tournament1&sortBy=durationMinutes&sortOrder=desc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {
        status: 'COMPLETED',
        winnerTeam: 'BLACK',
        tournamentId: 'tournament1',
      },
      orderBy: { durationMinutes: 'desc' },
      skip: 0,
      take: 10,
    });
  });
});
