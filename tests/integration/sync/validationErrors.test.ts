import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runIncrementalSync } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';
import databaseMock from '../../__mocks__/database';

const parserMocks = vi.hoisted(() => ({
  parsePlayer: vi.fn(),
}));

const transformMocks = vi.hoisted(() => ({
  transformPlayerData: vi.fn(),
  validatePlayerData: vi.fn(),
  hasPlayerDataChanged: vi.fn(),
}));

vi.mock('@/lib/parsers/gomafiaParser', () => ({
  parsePlayer: parserMocks.parsePlayer,
}));

vi.mock('@/lib/parsers/transformPlayer', () => ({
  transformPlayerData: transformMocks.transformPlayerData,
  validatePlayerData: transformMocks.validatePlayerData,
  hasPlayerDataChanged: transformMocks.hasPlayerDataChanged,
}));

describe('Incremental sync – validation handling', () => {
  beforeEach(() => {
    databaseMock.resetMocks();
    vi.clearAllMocks();
    parserMocks.parsePlayer.mockReset();
    transformMocks.transformPlayerData.mockReset();
    transformMocks.validatePlayerData.mockReset();
    transformMocks.hasPlayerDataChanged.mockReset();

    transformMocks.hasPlayerDataChanged.mockReturnValue(true);
  });

  it('collects validation errors without updating the player', async () => {
    const player = await db.player.create({
      data: {
        gomafiaId: 'invalid-player',
        name: 'Invalid Player',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        syncStatus: 'PENDING',
        userId: 'test-user',
      },
    });

    parserMocks.parsePlayer.mockResolvedValue({
      id: 'invalid-player',
      name: '',
    } as any);
    transformMocks.validatePlayerData.mockReturnValue(false);

    const result = await runIncrementalSync();

    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toEqual(['Invalid player data for invalid-player']);

    const reloaded = await db.player.findUnique({
      where: { id: player.id },
    });
    expect(reloaded?.name).toBe('Invalid Player');
    expect(reloaded?.syncStatus).toBe('PENDING');
  });

  it('stops processing when transform throws unexpected error', async () => {
    await db.player.create({
      data: {
        gomafiaId: 'throwing-player',
        name: 'Throwing Player',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        syncStatus: 'PENDING',
        userId: 'test-user',
      },
    });

    parserMocks.parsePlayer.mockResolvedValue({
      id: 'throwing-player',
      name: 'Throwing Player',
    } as any);
    transformMocks.validatePlayerData.mockReturnValue(true);
    transformMocks.transformPlayerData.mockImplementation(() => {
      throw new Error('Transform failure');
    });

    const result = await runIncrementalSync();

    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toEqual([
      'Failed to sync player throwing-player: Transform failure',
    ]);
  });
});
