import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/players/route';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    player: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Players API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated player list', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
      {
        id: 'player2',
        gomafiaId: 'gomafia2',
        name: 'Player 2',
        eloRating: 1600,
        totalGames: 80,
        wins: 50,
        losses: 30,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(2);

    const request = new NextRequest(
      'http://localhost:3000/api/players?page=1&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      players: mockPlayers,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { lastSyncAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle pagination parameters', async () => {
    const mockPlayers = Array.from({ length: 25 }, (_, i) => ({
      id: `player${i}`,
      gomafiaId: `gomafia${i}`,
      name: `Player ${i}`,
      eloRating: 1500 + i,
      totalGames: 100,
      wins: 60,
      losses: 40,
      lastSyncAt: new Date('2024-01-15T00:00:00Z'),
      syncStatus: 'SYNCED',
    }));

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers.slice(10, 20));
    vi.mocked(db.player.count).mockResolvedValue(25);

    const request = new NextRequest(
      'http://localhost:3000/api/players?page=2&limit=10'
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

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { lastSyncAt: 'desc' },
      skip: 10,
      take: 10,
    });
  });

  it('should handle filtering by sync status', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/players?syncStatus=SYNCED'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: { syncStatus: 'SYNCED' },
      orderBy: { lastSyncAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle filtering by club', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
        clubId: 'club1',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/players?clubId=club1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: { clubId: 'club1' },
      orderBy: { lastSyncAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle search by name', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'John Doe',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/players?search=John'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'John',
          mode: 'insensitive',
        },
      },
      orderBy: { lastSyncAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle sorting by different fields', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/players?sortBy=eloRating&sortOrder=desc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { eloRating: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle database errors gracefully', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/players');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Database connection failed');
  });

  it('should validate query parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/players?page=-1&limit=0'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should handle empty results', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue([]);
    vi.mocked(db.player.count).mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/players');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('should handle multiple filters combined', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        gomafiaId: 'gomafia1',
        name: 'John Doe',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-15T00:00:00Z'),
        syncStatus: 'SYNCED',
        clubId: 'club1',
      },
    ];

    const { db } = await import('@/lib/db');
    vi.mocked(db.player.findMany).mockResolvedValue(mockPlayers);
    vi.mocked(db.player.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/players?syncStatus=SYNCED&clubId=club1&search=John&sortBy=eloRating&sortOrder=desc'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);

    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {
        syncStatus: 'SYNCED',
        clubId: 'club1',
        name: {
          contains: 'John',
          mode: 'insensitive',
        },
      },
      orderBy: { eloRating: 'desc' },
      skip: 0,
      take: 10,
    });
  });
});
