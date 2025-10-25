import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runFullSync } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/parsers/gomafiaParser', () => ({
  parsePlayerList: vi.fn(),
  parsePlayer: vi.fn(),
  parseGame: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    syncLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
    syncStatus: {
      upsert: vi.fn(),
    },
    player: {
      upsert: vi.fn(),
    },
    game: {
      upsert: vi.fn(),
    },
  },
}));

describe('Full Sync Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully perform full sync with all players and games', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
      { id: 'player2', name: 'Player 2', eloRating: 1600 },
    ];

    const mockPlayerDetails = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        club: 'Test Club',
        lastActive: '2024-01-15',
      },
      {
        id: 'player2',
        name: 'Player 2',
        eloRating: 1600,
        totalGames: 80,
        wins: 50,
        losses: 30,
        club: 'Test Club',
        lastActive: '2024-01-14',
      },
    ];

    const mockGameList = [
      { id: 'game1', date: '2024-01-15T20:00:00Z' },
      { id: 'game2', date: '2024-01-14T19:00:00Z' },
    ];

    const mockGameDetails = [
      {
        id: 'game1',
        date: '2024-01-15T20:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        participants: [
          { playerId: 'player1', role: 'MAFIA', team: 'BLACK' },
          { playerId: 'player2', role: 'CITIZEN', team: 'RED' },
        ],
      },
      {
        id: 'game2',
        date: '2024-01-14T19:00:00Z',
        duration: 50,
        winnerTeam: 'RED',
        status: 'COMPLETED',
        participants: [
          { playerId: 'player1', role: 'CITIZEN', team: 'RED' },
          { playerId: 'player2', role: 'MAFIA', team: 'BLACK' },
        ],
      },
    ];

    // Mock parser functions
    const { parsePlayerList, parsePlayer, parseGame } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(mockPlayerList);
    vi.mocked(parsePlayer).mockResolvedValueOnce(mockPlayerDetails[0]);
    vi.mocked(parsePlayer).mockResolvedValueOnce(mockPlayerDetails[1]);
    vi.mocked(parseGame).mockResolvedValueOnce(mockGameDetails[0]);
    vi.mocked(parseGame).mockResolvedValueOnce(mockGameDetails[1]);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});
    vi.mocked(db.game.upsert).mockResolvedValue({});

    const result = await runFullSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(4); // 2 players + 2 games
    expect(result.errors).toHaveLength(0);

    // Verify sync log was created and updated
    expect(db.syncLog.create).toHaveBeenCalledWith({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: expect.any(Date),
      },
    });

    expect(db.syncLog.update).toHaveBeenCalledWith({
      where: { id: 'sync123' },
      data: {
        status: 'COMPLETED',
        endTime: expect.any(Date),
        recordsProcessed: 4,
      },
    });

    // Verify sync status was updated
    expect(db.syncStatus.upsert).toHaveBeenCalledWith({
      where: { id: 'current' },
      update: {
        lastSyncTime: expect.any(Date),
        lastSyncType: 'FULL',
        isRunning: false,
        progress: 100,
      },
      create: {
        id: 'current',
        lastSyncTime: expect.any(Date),
        lastSyncType: 'FULL',
        isRunning: false,
        progress: 100,
      },
    });
  });

  it('should handle partial failures during full sync', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
      { id: 'player2', name: 'Player 2', eloRating: 1600 },
    ];

    const mockPlayerDetails = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
      },
    ];

    // Mock parser functions with one failure
    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(mockPlayerList);
    vi.mocked(parsePlayer)
      .mockResolvedValueOnce(mockPlayerDetails[0])
      .mockRejectedValueOnce(new Error('Player not found'));

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
      errors: [{ playerId: 'player2', error: 'Player not found' }],
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runFullSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('player2');
  });

  it('should handle complete sync failure', async () => {
    const { parsePlayerList } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayerList).mockRejectedValue(new Error('Network error'));

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'FAILED',
      errors: [{ error: 'Network error' }],
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    const result = await runFullSync();

    expect(result.success).toBe(false);
    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Network error');

    // Verify sync log was marked as failed
    expect(db.syncLog.update).toHaveBeenCalledWith({
      where: { id: 'sync123' },
      data: {
        status: 'FAILED',
        endTime: expect.any(Date),
        errors: expect.any(Array),
      },
    });
  });

  it('should handle database connection errors', async () => {
    const { parsePlayerList } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayerList).mockResolvedValue([]);
    vi.mocked(db.syncLog.create).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(runFullSync()).rejects.toThrow('Database connection failed');
  });

  it('should process data in batches for large datasets', async () => {
    const largePlayerList = Array.from({ length: 250 }, (_, i) => ({
      id: `player${i}`,
      name: `Player ${i}`,
      eloRating: 1500 + i,
    }));

    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(largePlayerList);
    vi.mocked(parsePlayer).mockImplementation((id) =>
      Promise.resolve({
        id,
        name: `Player ${id.replace('player', '')}`,
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
      })
    );

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runFullSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(250);

    // Verify batch processing (should be called multiple times for 250 records)
    expect(db.player.upsert).toHaveBeenCalledTimes(250);
  });
});
