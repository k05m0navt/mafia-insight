import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runSync } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';

// Mock database
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
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    game: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock parser
vi.mock('@/lib/parsers/gomafiaParser', () => ({
  parsePlayer: vi.fn(),
  parseGame: vi.fn(),
}));

describe('Partial Data Handling in Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle partial player data gracefully', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return partial data
    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'partial-player',
      name: 'Partial Player',
      eloRating: 1500,
      // Missing totalGames, wins, losses
    } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.partialDataCount).toBe(1);
    expect(result.errors).toContain('Partial data for player: partial-player');
  });

  it('should handle partial game data gracefully', async () => {
    const { parseGame } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return partial data
    vi.mocked(parseGame).mockResolvedValue({
      gomafiaId: 'partial-game',
      date: new Date(),
      // Missing durationMinutes, winnerTeam, status
    } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.partialDataCount).toBe(1);
    expect(result.errors).toContain('Partial data for game: partial-game');
  });

  it('should use default values for missing optional fields', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'defaults-player',
      name: 'Defaults Player',
      eloRating: 1500,
      totalGames: 0,
      wins: 0,
      losses: 0,
      // Missing optional fields
    });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.validCount).toBe(1);
  });

  it('should handle mixed complete and partial data', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer)
      .mockResolvedValueOnce({
        gomafiaId: 'complete-player',
        name: 'Complete Player',
        eloRating: 1500,
        totalGames: 10,
        wins: 5,
        losses: 5,
      })
      .mockResolvedValueOnce({
        gomafiaId: 'partial-player',
        name: 'Partial Player',
        eloRating: 1200,
        // Missing game stats
      } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.partialDataCount).toBe(1);
  });

  it('should log partial data warnings', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'logged-partial',
      name: 'Logged Partial',
      eloRating: 1500,
      // Missing required fields
    } as any);

    await runSync('INCREMENTAL');

    expect(db.syncLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'INCREMENTAL',
        status: 'COMPLETED',
        errors: expect.arrayContaining([
          expect.objectContaining({
            type: 'PARTIAL_DATA_WARNING',
            message: expect.stringContaining('Partial data for player'),
          }),
        ]),
      }),
    });
  });

  it('should handle network interruptions gracefully', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to throw network error after some data
    vi.mocked(parsePlayer)
      .mockResolvedValueOnce({
        gomafiaId: 'before-interruption',
        name: 'Before Interruption',
        eloRating: 1500,
        totalGames: 10,
        wins: 5,
        losses: 5,
      })
      .mockRejectedValueOnce(new Error('Network interruption'));

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.processedCount).toBe(1);
    expect(result.errors).toContain('Network interruption');
  });

  it('should resume from last successful record after interruption', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to succeed on retry
    vi.mocked(parsePlayer)
      .mockRejectedValueOnce(new Error('Network interruption'))
      .mockResolvedValueOnce({
        gomafiaId: 'resumed-player',
        name: 'Resumed Player',
        eloRating: 1500,
        totalGames: 10,
        wins: 5,
        losses: 5,
      });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.retryCount).toBe(1);
  });

  it('should handle empty response gracefully', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return empty data
    vi.mocked(parsePlayer).mockResolvedValue(null);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(0);
    expect(result.emptyDataCount).toBe(1);
  });

  it('should validate partial data against minimum requirements', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'minimal-player',
      name: 'Minimal Player',
      // Only required fields
    } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.validCount).toBe(1);
  });
});
