import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runSyncWithRetry } from '@/lib/jobs/syncJob';
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

describe('Retry Logic Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should retry on temporary network failures', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
    ];

    const mockPlayerDetails = {
      id: 'player1',
      name: 'Player 1',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
    };

    // Mock parser functions with temporary failure
    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce(mockPlayerList);

    vi.mocked(parsePlayer).mockResolvedValue(mockPlayerDetails);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Verify retry was attempted
    expect(parsePlayerList).toHaveBeenCalledTimes(2);
  });

  it('should fail after maximum retry attempts', async () => {
    // Mock parser functions with persistent failure
    const { parsePlayerList } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayerList).mockRejectedValue(
      new Error('Persistent network error')
    );

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'FAILED',
      errors: [{ error: 'Persistent network error' }],
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(false);
    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Persistent network error');

    // Verify maximum retries were attempted (default is 3)
    expect(parsePlayerList).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff for retries', async () => {
    const startTime = Date.now();

    // Mock parser functions with temporary failures
    const { parsePlayerList } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayerList)
      .mockRejectedValueOnce(new Error('Network error 1'))
      .mockRejectedValueOnce(new Error('Network error 2'))
      .mockResolvedValueOnce([]);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    await runSyncWithRetry('FULL');

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should have waited at least 3 seconds (1000ms + 2000ms for exponential backoff)
    expect(duration).toBeGreaterThan(3000);
    expect(parsePlayerList).toHaveBeenCalledTimes(3);
  });

  it('should handle different error types with appropriate retry logic', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
    ];

    const mockPlayerDetails = {
      id: 'player1',
      name: 'Player 1',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
    };

    // Mock parser functions with different error types
    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(mockPlayerList);
    vi.mocked(parsePlayer)
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockRejectedValueOnce(new Error('Temporary server error'))
      .mockResolvedValueOnce(mockPlayerDetails);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert).mockResolvedValue({});

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Verify retry was attempted for rate limit and server errors
    expect(parsePlayer).toHaveBeenCalledTimes(3);
  });

  it('should not retry on permanent errors', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
    ];

    // Mock parser functions with permanent error
    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(mockPlayerList);
    vi.mocked(parsePlayer).mockRejectedValue(new Error('Player not found'));

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
      errors: [{ playerId: 'player1', error: 'Player not found' }],
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Player not found');

    // Verify no retry was attempted for permanent error
    expect(parsePlayer).toHaveBeenCalledTimes(1);
  });

  it('should handle database errors with retry logic', async () => {
    const mockPlayerList = [
      { id: 'player1', name: 'Player 1', eloRating: 1500 },
    ];

    const mockPlayerDetails = {
      id: 'player1',
      name: 'Player 1',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
    };

    // Mock parser functions
    const { parsePlayerList, parsePlayer } = await import(
      '@/lib/parsers/gomafiaParser'
    );

    vi.mocked(parsePlayerList).mockResolvedValue(mockPlayerList);
    vi.mocked(parsePlayer).mockResolvedValue(mockPlayerDetails);

    // Mock database operations with temporary failure
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});
    vi.mocked(db.player.upsert)
      .mockRejectedValueOnce(new Error('Database connection timeout'))
      .mockResolvedValueOnce({});

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Verify database retry was attempted
    expect(db.player.upsert).toHaveBeenCalledTimes(2);
  });

  it('should log retry attempts in sync log', async () => {
    // Mock parser functions with temporary failure
    const { parsePlayerList } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayerList)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce([]);

    // Mock database operations
    const mockSyncLog = { id: 'sync123', status: 'RUNNING' };
    vi.mocked(db.syncLog.create).mockResolvedValue(mockSyncLog);
    vi.mocked(db.syncLog.update).mockResolvedValue({
      ...mockSyncLog,
      status: 'COMPLETED',
    });
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({});

    await runSyncWithRetry('FULL');

    // Verify sync log was updated with retry information
    expect(db.syncLog.update).toHaveBeenCalledWith({
      where: { id: 'sync123' },
      data: {
        status: 'COMPLETED',
        endTime: expect.any(Date),
        recordsProcessed: 0,
        errors: expect.arrayContaining([
          expect.objectContaining({
            attempt: 1,
            error: 'Network timeout',
          }),
          expect.objectContaining({
            attempt: 2,
            error: 'Network timeout',
          }),
        ]),
      },
    });
  });

  it('should handle mixed success and failure scenarios', async () => {
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
      {
        id: 'player2',
        name: 'Player 2',
        eloRating: 1600,
        totalGames: 80,
        wins: 50,
        losses: 30,
      },
    ];

    // Mock parser functions with mixed results
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

    const result = await runSyncWithRetry('FULL');

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('player2');

    // Verify successful player was processed
    expect(db.player.upsert).toHaveBeenCalledWith({
      where: { gomafiaId: 'player1' },
      update: expect.any(Object),
      create: expect.any(Object),
    });
  });
});
