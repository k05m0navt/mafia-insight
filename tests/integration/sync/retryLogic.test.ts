import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runSyncWithRetry } from '@/lib/jobs/syncJob';
import { db } from '@/lib/db';
import databaseMock from '../../__mocks__/database';

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

describe('runSyncWithRetry', () => {
  beforeEach(() => {
    databaseMock.resetMocks();
    vi.clearAllMocks();
    parserMocks.parsePlayerList.mockReset();
    parserMocks.parsePlayer.mockReset();
    parserMocks.cleanup.mockReset();
    transformMocks.transformPlayerData.mockReset();
    transformMocks.validatePlayerData.mockReset();
    transformMocks.hasPlayerDataChanged.mockReset();

    parserMocks.cleanup.mockResolvedValue(undefined);
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
    transformMocks.hasPlayerDataChanged.mockReturnValue(true);
  });

  it('retries and succeeds after transient failures', async () => {
    parserMocks.parsePlayerList
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce([{ id: 'p1' }]);
    parserMocks.parsePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Player p1',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
      lastActive: '2024-01-01',
    });

    const result = await runSyncWithRetry('FULL', 2);

    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(1);
    expect(parserMocks.parsePlayerList).toHaveBeenCalledTimes(2);

    const logs = await db.syncLog.findMany();
    expect(logs[0]?.status).toBe('COMPLETED');
  });

  it('returns a failed result after exhausting retries', async () => {
    parserMocks.parsePlayerList.mockRejectedValue(
      new Error('Persistent failure')
    );

    const result = await runSyncWithRetry('FULL', 3);

    expect(result.success).toBe(false);
    expect(result.retryCount).toBe(3);
    expect(result.errors).toEqual(['Persistent failure']);
  });

  it('does not exceed the provided retry budget', async () => {
    parserMocks.parsePlayerList.mockRejectedValue(new Error('Always failing'));

    await runSyncWithRetry('FULL', 2);

    expect(parserMocks.parsePlayerList).toHaveBeenCalledTimes(2);
  });
});
