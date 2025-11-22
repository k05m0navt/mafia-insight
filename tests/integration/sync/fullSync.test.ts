import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runFullSync } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';
import databaseMock from '../../__mocks__/database';

const parserMocks = vi.hoisted(() => ({
  parsePlayerList: vi.fn(),
  parsePlayer: vi.fn(),
  cleanup: vi.fn(),
}));

const transformMocks = vi.hoisted(() => ({
  transformPlayerData: vi.fn(),
  validatePlayerData: vi.fn(),
  hasPlayerDataChanged: vi.fn(),
}));

vi.mock('@/lib/parsers/gomafiaParser', () => ({
  parsePlayerList: parserMocks.parsePlayerList,
  parsePlayer: parserMocks.parsePlayer,
  cleanup: parserMocks.cleanup,
}));

vi.mock('@/lib/parsers/transformPlayer', () => ({
  transformPlayerData: transformMocks.transformPlayerData,
  validatePlayerData: transformMocks.validatePlayerData,
  hasPlayerDataChanged: transformMocks.hasPlayerDataChanged,
}));

const buildPlayerPayload = (id: string) => ({
  id,
  name: `Player ${id}`,
  eloRating: 1500,
  totalGames: 100,
  wins: 60,
  losses: 40,
  lastActive: '2024-01-01',
});

const buildTransformedPlayer = (id: string) => ({
  gomafiaId: id,
  name: `Player ${id}`,
  eloRating: 1500,
  totalGames: 100,
  wins: 60,
  losses: 40,
  lastSyncAt: new Date('2024-01-01T00:00:00Z'),
  syncStatus: 'SYNCED',
});

describe('Full Sync Integration', () => {
  beforeEach(() => {
    databaseMock.resetMocks();
    vi.clearAllMocks();
    parserMocks.parsePlayerList.mockReset();
    parserMocks.parsePlayer.mockReset();
    parserMocks.cleanup.mockReset();
    transformMocks.transformPlayerData.mockReset();
    transformMocks.validatePlayerData.mockReset();

    transformMocks.validatePlayerData.mockReturnValue(true);
    transformMocks.transformPlayerData.mockImplementation(({ id }) =>
      buildTransformedPlayer(id)
    );
  });

  it('syncs all parsed players into the database', async () => {
    parserMocks.parsePlayerList.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    parserMocks.parsePlayer.mockImplementation(async (id) =>
      buildPlayerPayload(id)
    );

    const result = await runFullSync();

    expect(result.recordsProcessed).toBe(2);
    expect(result.errors).toEqual([]);

    expect(parserMocks.parsePlayerList).toHaveBeenCalledTimes(1);
    expect(parserMocks.parsePlayer).toHaveBeenCalledTimes(2);
    expect(db.player.upsert).toHaveBeenCalledTimes(2);

    const storedPlayers = await db.player.findMany();
    expect(storedPlayers).toHaveLength(2);
    expect(storedPlayers.map((p: any) => p.gomafiaId)).toContain('p1');
    expect(storedPlayers.map((p: any) => p.gomafiaId)).toContain('p2');
  });

  it('records an error when an individual player fails to sync', async () => {
    parserMocks.parsePlayerList.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    parserMocks.parsePlayer
      .mockResolvedValueOnce(buildPlayerPayload('p1'))
      .mockRejectedValueOnce(new Error('Player not found'));

    const result = await runFullSync();

    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('p2');

    expect(db.player.upsert).toHaveBeenCalledTimes(1);
  });

  it('skips invalid player data while continuing the sync', async () => {
    parserMocks.parsePlayerList.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    parserMocks.parsePlayer.mockImplementation(async (id) =>
      buildPlayerPayload(id)
    );

    transformMocks.validatePlayerData.mockImplementation(
      ({ id }) => id !== 'p2'
    );

    const result = await runFullSync();

    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toEqual(['Invalid player data for p2']);
    expect(db.player.upsert).toHaveBeenCalledTimes(1);
  });

  it('propagates failures that occur before processing begins', async () => {
    parserMocks.parsePlayerList.mockRejectedValue(new Error('Network error'));

    await expect(runFullSync()).rejects.toThrow('Network error');
    expect(db.player.upsert).not.toHaveBeenCalled();
  });
});
