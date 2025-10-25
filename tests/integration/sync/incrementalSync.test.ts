import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runIncrementalSync } from '@/lib/jobs/syncJob';
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
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    game: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('Incremental Sync Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully perform incremental sync with only changed records', async () => {
    const lastSyncTime = new Date('2024-01-15T00:00:00Z');

    const mockChangedPlayers = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1550, // Changed from 1500
        totalGames: 105, // Changed from 100
        wins: 65, // Changed from 60
        losses: 40,
        lastSyncAt: lastSyncTime,
        syncStatus: 'SYNCED',
      },
    ];

    const mockChangedGames = [
      {
        id: 'game1',
        date: '2024-01-16T20:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: lastSyncTime,
        syncStatus: 'SYNCED',
      },
    ];

    const mockPlayerDetails = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1550,
        totalGames: 105,
        wins: 65,
        losses: 40,
        club: 'Test Club',
        lastActive: '2024-01-16',
      },
    ];

    const mockGameDetails = [
      {
        id: 'game1',
        date: '2024-01-16T20:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        participants: [{ playerId: 'player1', role: 'MAFIA', team: 'BLACK' }],
      },
    ];

    // Mock database queries for changed records
    vi.mocked(db.player.findMany).mockResolvedValue(mockChangedPlayers);
    vi.mocked(db.game.findMany).mockResolvedValue(mockChangedGames);

    // Mock parser functions
    const { parsePlayer, parseGame } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayer).mockResolvedValueOnce(mockPlayerDetails[0]);
    vi.mocked(parseGame).mockResolvedValueOnce(mockGameDetails[0]);

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

    const result = await runIncrementalSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(2); // 1 player + 1 game
    expect(result.errors).toHaveLength(0);

    // Verify only changed records were queried
    expect(db.player.findMany).toHaveBeenCalledWith({
      where: {
        lastSyncAt: {
          lt: expect.any(Date), // Should be less than current time
        },
        syncStatus: 'SYNCED',
      },
    });

    expect(db.game.findMany).toHaveBeenCalledWith({
      where: {
        lastSyncAt: {
          lt: expect.any(Date), // Should be less than current time
        },
        syncStatus: 'SYNCED',
      },
    });

    // Verify sync log was created and updated
    expect(db.syncLog.create).toHaveBeenCalledWith({
      data: {
        type: 'INCREMENTAL',
        status: 'RUNNING',
        startTime: expect.any(Date),
      },
    });

    expect(db.syncLog.update).toHaveBeenCalledWith({
      where: { id: 'sync123' },
      data: {
        status: 'COMPLETED',
        endTime: expect.any(Date),
        recordsProcessed: 2,
      },
    });
  });

  it('should handle no changes since last sync', async () => {
    // Mock database queries returning no changed records
    vi.mocked(db.player.findMany).mockResolvedValue([]);
    vi.mocked(db.game.findMany).mockResolvedValue([]);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    const result = await runIncrementalSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify sync was still logged
    expect(db.syncLog.create).toHaveBeenCalledWith({
      data: {
        type: 'INCREMENTAL',
        status: 'RUNNING',
        startTime: expect.any(Date),
      },
    });

    expect(db.syncLog.update).toHaveBeenCalledWith({
      where: { id: 'sync123' },
      data: {
        status: 'COMPLETED',
        endTime: expect.any(Date),
        recordsProcessed: 0,
      },
    });
  });

  it('should handle partial failures during incremental sync', async () => {
    const lastSyncTime = new Date('2024-01-15T00:00:00Z');

    const mockChangedPlayers = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1550,
        totalGames: 105,
        wins: 65,
        losses: 40,
        lastSyncAt: lastSyncTime,
        syncStatus: 'SYNCED',
      },
    ];

    const mockChangedGames = [
      {
        id: 'game1',
        date: '2024-01-16T20:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        lastSyncAt: lastSyncTime,
        syncStatus: 'SYNCED',
      },
    ];

    // Mock database queries
    vi.mocked(db.player.findMany).mockResolvedValue(mockChangedPlayers);
    vi.mocked(db.game.findMany).mockResolvedValue(mockChangedGames);

    // Mock parser functions with one failure
    const { parsePlayer, parseGame } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayer).mockResolvedValue({
      id: 'player1',
      name: 'Player 1',
      eloRating: 1550,
      totalGames: 105,
      wins: 65,
      losses: 40,
    });
    vi.mocked(parseGame).mockRejectedValue(new Error('Game not found'));

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
      errors: [{ gameId: 'game1', error: 'Game not found' }],
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runIncrementalSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1); // Only player was processed
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('game1');
  });

  it('should handle database connection errors', async () => {
    vi.mocked(db.player.findMany).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(runIncrementalSync()).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should update lastSyncAt timestamps for successfully synced records', async () => {
    const lastSyncTime = new Date('2024-01-15T00:00:00Z');

    const mockChangedPlayers = [
      {
        id: 'player1',
        name: 'Player 1',
        eloRating: 1550,
        totalGames: 105,
        wins: 65,
        losses: 40,
        lastSyncAt: lastSyncTime,
        syncStatus: 'SYNCED',
      },
    ];

    // Mock database queries
    vi.mocked(db.player.findMany).mockResolvedValue(mockChangedPlayers);
    vi.mocked(db.game.findMany).mockResolvedValue([]);

    // Mock parser functions
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer).mockResolvedValue({
      id: 'player1',
      name: 'Player 1',
      eloRating: 1550,
      totalGames: 105,
      wins: 65,
      losses: 40,
    });

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runIncrementalSync();

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);

    // Verify player was updated with new lastSyncAt timestamp
    expect(db.player.upsert).toHaveBeenCalledWith({
      where: { gomafiaId: 'player1' },
      update: {
        eloRating: 1550,
        totalGames: 105,
        wins: 65,
        losses: 40,
        lastSyncAt: expect.any(Date),
        syncStatus: 'SYNCED',
      },
      create: expect.any(Object),
    });
  });

  it('should handle sync status updates correctly', async () => {
    // Mock database queries returning no changed records
    vi.mocked(db.player.findMany).mockResolvedValue([]);
    vi.mocked(db.game.findMany).mockResolvedValue([]);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    await runIncrementalSync();

    // Verify sync status was updated
    expect(db.syncStatus.upsert).toHaveBeenCalledWith({
      where: { id: 'current' },
      update: {
        lastSyncTime: expect.any(Date),
        lastSyncType: 'INCREMENTAL',
        isRunning: false,
        progress: 100,
      },
      create: {
        id: 'current',
        lastSyncTime: expect.any(Date),
        lastSyncType: 'INCREMENTAL',
        isRunning: false,
        progress: 100,
      },
    });
  });
});
