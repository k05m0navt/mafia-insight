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

describe('Data Validation Errors in Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle invalid player data gracefully', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return invalid data
    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'invalid-player',
      name: '', // Invalid: empty name
      eloRating: -100, // Invalid: negative ELO
      totalGames: 5,
      wins: 10, // Invalid: wins > totalGames
      losses: 0,
    });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid player data: invalid-player');
  });

  it('should handle invalid game data gracefully', async () => {
    const { parseGame } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return invalid data
    vi.mocked(parseGame).mockResolvedValue({
      gomafiaId: 'invalid-game',
      date: new Date('invalid-date'), // Invalid date
      durationMinutes: -10, // Invalid: negative duration
      winnerTeam: 'INVALID', // Invalid enum value
      status: 'INVALID_STATUS', // Invalid enum value
    });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid game data: invalid-game');
  });

  it('should handle missing required fields', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return data missing required fields
    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'missing-fields',
      // Missing name, eloRating, totalGames, wins, losses
    } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      'Missing required fields for player: missing-fields'
    );
  });

  it('should handle type validation errors', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return data with wrong types
    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'type-error',
      name: 'Player Name',
      eloRating: 'not-a-number', // Invalid: should be number
      totalGames: 'not-a-number', // Invalid: should be number
      wins: 'not-a-number', // Invalid: should be number
      losses: 'not-a-number', // Invalid: should be number
    } as any);

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      'Type validation failed for player: type-error'
    );
  });

  it('should handle constraint validation errors', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return data that violates business constraints
    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'constraint-error',
      name: 'Player Name',
      eloRating: 5000, // Invalid: ELO too high
      totalGames: 10,
      wins: 15, // Invalid: wins > totalGames
      losses: 5, // Invalid: wins + losses > totalGames
    });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      'Constraint validation failed for player: constraint-error'
    );
  });

  it('should continue processing other records after validation errors', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    // Mock parser to return mix of valid and invalid data
    vi.mocked(parsePlayer)
      .mockResolvedValueOnce({
        gomafiaId: 'invalid-player',
        name: '', // Invalid
        eloRating: 1500,
        totalGames: 10,
        wins: 5,
        losses: 5,
      })
      .mockResolvedValueOnce({
        gomafiaId: 'valid-player',
        name: 'Valid Player',
        eloRating: 1500,
        totalGames: 10,
        wins: 5,
        losses: 5,
      });

    const result = await runSync('INCREMENTAL');

    expect(result.success).toBe(false); // Overall failed due to invalid data
    expect(result.errors).toContain('Invalid player data: invalid-player');
    expect(result.processedCount).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
  });

  it('should log validation errors to sync log', async () => {
    const { parsePlayer } = await import('@/lib/parsers/gomafiaParser');

    vi.mocked(parsePlayer).mockResolvedValue({
      gomafiaId: 'logged-error',
      name: '', // Invalid
      eloRating: 1500,
      totalGames: 10,
      wins: 5,
      losses: 5,
    });

    await runSync('INCREMENTAL');

    expect(db.syncLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'INCREMENTAL',
        status: 'FAILED',
        errors: expect.arrayContaining([
          expect.objectContaining({
            type: 'VALIDATION_ERROR',
            message: expect.stringContaining('Invalid player data'),
          }),
        ]),
      }),
    });
  });
});
