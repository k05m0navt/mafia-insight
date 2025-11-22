import { beforeEach, describe, expect, it, vi } from 'vitest';
const parserMocks = vi.hoisted(() => ({
  parsePlayerList: vi.fn(),
  parsePlayer: vi.fn(),
  cleanup: vi.fn().mockResolvedValue(undefined),
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

import { runSync } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';
import databaseMock from '../../__mocks__/database';

const transformer = {
  setupDefaults: () => {
    transformMocks.hasPlayerDataChanged.mockReturnValue(true);
    transformMocks.validatePlayerData.mockReturnValue(true);
    transformMocks.transformPlayerData.mockImplementation(({ id }) => ({
      gomafiaId: id,
      name: `Player ${id}`,
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
      lastSyncAt: new Date('2024-01-01T00:00:00Z'),
      syncStatus: 'SYNCED',
    }));
  },
  validate: transformMocks.validatePlayerData,
};

describe('runSync integration', () => {
  beforeEach(() => {
    databaseMock.resetMocks();
    vi.clearAllMocks();
    parserMocks.cleanup.mockResolvedValue(undefined);
    parserMocks.parsePlayerList.mockReset();
    parserMocks.parsePlayer.mockReset();
    transformer.setupDefaults();
  });

  it('persists sync logs and surfaces non-critical errors', async () => {
    parserMocks.parsePlayerList.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    parserMocks.parsePlayer.mockImplementation(async (id) => ({
      id,
      name: `Player ${id}`,
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
      lastActive: '2024-01-01',
    }));
    transformer.validate.mockImplementation(({ id }) => id !== 'p2');

    const result = await runSync({ type: 'FULL' });

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(result.errors).toEqual(['Invalid player data for p2']);

    const logs = await db.syncLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      type: 'FULL',
      status: 'COMPLETED',
      recordsProcessed: 1,
    });

    const status = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });
    expect(status).toMatchObject({
      isRunning: false,
      lastSyncType: 'FULL',
      progress: 100,
    });
  });

  it('updates sync log with failure details when underlying job rejects', async () => {
    parserMocks.parsePlayerList.mockRejectedValue(
      new Error('Catastrophic failure')
    );

    await expect(runSync({ type: 'FULL' })).rejects.toThrow(
      'Catastrophic failure'
    );

    const logs = await db.syncLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('RUNNING'); // update did not occur due to rejection
  });
});
