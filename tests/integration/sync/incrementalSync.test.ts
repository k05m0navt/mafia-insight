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

const buildPlayerPayload = (id: string) => ({
  id,
  name: `Player ${id}`,
  eloRating: 1550,
  totalGames: 110,
  wins: 70,
  losses: 40,
  lastActive: '2024-01-02',
});

const buildTransformedPlayer = (id: string) => ({
  name: `Player ${id}`,
  eloRating: 1550,
  totalGames: 110,
  wins: 70,
  losses: 40,
  lastSyncAt: new Date('2024-01-02T00:00:00Z'),
  syncStatus: 'SYNCED',
});

describe('Incremental Sync Integration', () => {
  beforeEach(() => {
    databaseMock.resetMocks();
    vi.clearAllMocks();
    parserMocks.parsePlayer.mockReset();
    transformMocks.transformPlayerData.mockReset();
    transformMocks.validatePlayerData.mockReset();
    transformMocks.hasPlayerDataChanged.mockReset();

    transformMocks.validatePlayerData.mockReturnValue(true);
    transformMocks.transformPlayerData.mockImplementation(({ id }) =>
      buildTransformedPlayer(id)
    );
    transformMocks.hasPlayerDataChanged.mockReturnValue(true);
  });

  it('updates players whose data has changed', async () => {
    const existingPlayer = await db.player.create({
      data: {
        gomafiaId: 'p1',
        name: 'Player p1',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-01T00:00:00Z'),
        syncStatus: 'PENDING',
        userId: 'test-user',
      },
    });

    parserMocks.parsePlayer.mockResolvedValue(buildPlayerPayload('p1'));

    const result = await runIncrementalSync();

    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toEqual([]);

    const updated = await db.player.findUnique({
      where: { id: existingPlayer.id },
    });

    expect(updated?.eloRating).toBe(1550);
    expect(updated?.syncStatus).toBe('SYNCED');
    expect(updated?.lastSyncAt).toBeInstanceOf(Date);
  });

  it('marks unchanged players as synced without overwriting data', async () => {
    const existingPlayer = await db.player.create({
      data: {
        gomafiaId: 'p2',
        name: 'Player p2',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-01T00:00:00Z'),
        syncStatus: 'PENDING',
        userId: 'test-user',
      },
    });

    parserMocks.parsePlayer.mockResolvedValue(buildPlayerPayload('p2'));
    transformMocks.hasPlayerDataChanged.mockReturnValue(false);

    const result = await runIncrementalSync();

    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toEqual([]);

    const updated = await db.player.findUnique({
      where: { id: existingPlayer.id },
    });

    expect(updated?.syncStatus).toBe('SYNCED');
    expect(updated?.lastSyncAt).toBeInstanceOf(Date);
    expect(updated?.eloRating).toBe(1500); // unchanged
  });

  it('records errors and marks players when parsing fails', async () => {
    const existingPlayer = await db.player.create({
      data: {
        gomafiaId: 'p3',
        name: 'Player p3',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        lastSyncAt: new Date('2024-01-01T00:00:00Z'),
        syncStatus: 'PENDING',
        userId: 'test-user',
      },
    });

    parserMocks.parsePlayer.mockRejectedValue(new Error('Temporary failure'));

    const result = await runIncrementalSync();

    expect(result.recordsProcessed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('p3');

    const updated = await db.player.findUnique({
      where: { id: existingPlayer.id },
    });

    expect(updated?.syncStatus).toBe('ERROR');
  });
});
