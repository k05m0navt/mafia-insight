import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MessageEnvelope } from '@/application/ports';
import { Player } from '@/domain/entities/player';

type MockPlayerRecord = {
  id: string;
  userId: string;
  gomafiaId: string | null;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  region: string | null;
  lastSyncAt: Date | null;
  syncStatus: string | null;
  clubId: string | null;
  club: { id: string; name: string | null } | null;
  participations: Array<{
    id: string;
    createdAt?: Date;
    game?: {
      id: string;
      gomafiaId: string | null;
      date: Date;
      status: string | null;
      winnerTeam: string | null;
      durationMinutes: number | null;
    };
  }>;
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate?: number;
  }>;
};

const mockPlayers = new Map<string, MockPlayerRecord>();

function filterPlayers(
  where: Record<string, unknown> | undefined
): MockPlayerRecord[] {
  if (!where) {
    return Array.from(mockPlayers.values());
  }

  return Array.from(mockPlayers.values()).filter((player) => {
    if (where.clubId && player.clubId !== where.clubId) {
      return false;
    }
    if (where.syncStatus && player.syncStatus !== where.syncStatus) {
      return false;
    }
    if (where.name && typeof where.name === 'object') {
      const search = (where.name as any).contains ?? (where.name as any).equals;
      if (
        typeof search === 'string' &&
        !player.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  });
}

function mapSelect(record: MockPlayerRecord, select: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true) {
      result[key] = (record as Record<string, unknown>)[key];
    } else if (key === 'club' && value && typeof value === 'object') {
      result[key] = record.club
        ? {
            id: record.club.id,
            name: record.club.name,
          }
        : null;
    }
  }
  return result;
}

function createMockDb() {
  return {
    player: {
      async findUnique(args: {
        where: { id: string };
        include?: Record<string, any>;
        select?: Record<string, unknown>;
      }) {
        const record = mockPlayers.get(args.where.id);
        if (!record) {
          return null;
        }

        if (args.select) {
          return mapSelect(record, args.select);
        }

        if (args.include) {
          const participationsTake =
            args.include.participations?.take ?? record.participations.length;
          return {
            ...record,
            participations: record.participations
              .slice()
              .sort(
                (a, b) =>
                  (b.game?.date?.getTime() ?? 0) -
                  (a.game?.date?.getTime() ?? 0)
              )
              .slice(0, participationsTake),
            roleStats: record.roleStats,
          };
        }

        return record;
      },
      async findMany(args: {
        where?: Record<string, unknown>;
        skip?: number;
        take?: number;
        select?: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
      }) {
        let values = filterPlayers(args.where);

        if (args.orderBy) {
          const [field, direction] = Object.entries(args.orderBy)[0];
          values = values.slice().sort((a, b) => {
            const aValue = (a as any)[field];
            const bValue = (b as any)[field];
            if (aValue === bValue) return 0;
            if (direction === 'desc') {
              return aValue > bValue ? -1 : 1;
            }
            return aValue > bValue ? 1 : -1;
          });
        }

        const start = args.skip ?? 0;
        const end =
          typeof args.take === 'number' ? start + args.take : undefined;
        const slice = values.slice(start, end);

        if (args.select) {
          return slice.map((record) => mapSelect(record, args.select!));
        }

        return slice;
      },
      async count(args: { where?: Record<string, unknown> }) {
        return filterPlayers(args.where).length;
      },
      async update(args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) {
        const record = mockPlayers.get(args.where.id);
        if (!record) {
          throw new Error('Player not found');
        }
        Object.assign(record, args.data);
        return record;
      },
      async delete(args: { where: { id: string } }) {
        const record = mockPlayers.get(args.where.id);
        if (!record) {
          throw new Error('Player not found');
        }
        mockPlayers.delete(args.where.id);
        return record;
      },
    },
  };
}

const inMemoryCache = new Map<string, unknown>();

vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

vi.mock('@/lib/cache/redis', () => ({
  cacheService: {
    async get<T>(key: string): Promise<T | null> {
      return (inMemoryCache.get(key) as T) ?? null;
    },
    async set(key: string, value: unknown) {
      inMemoryCache.set(key, value);
    },
    async del(key: string) {
      inMemoryCache.delete(key);
    },
  },
}));

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => null,
  createServiceRoleClient: () => null,
}));

import { PrismaPlayerPersistenceAdapter } from '@/infrastructure/persistence';
import { RedisCacheAdapter } from '@/infrastructure/caching';
import { SupabaseMessageBusAdapter } from '@/infrastructure/messaging';

describe('PrismaPlayerPersistenceAdapter', () => {
  const adapter = new PrismaPlayerPersistenceAdapter();
  let playerId: string;
  let removablePlayerId: string;

  beforeEach(() => {
    mockPlayers.clear();
    playerId = `player-${Date.now()}`;
    removablePlayerId = `player-remove-${Date.now()}`;

    mockPlayers.set(playerId, {
      id: playerId,
      userId: 'user-1',
      gomafiaId: `gm-${playerId}`,
      name: 'Integration Player',
      eloRating: 1500,
      totalGames: 20,
      wins: 12,
      losses: 8,
      region: 'EU',
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED',
      clubId: 'club-1',
      club: { id: 'club-1', name: 'Integration Club' },
      participations: [
        {
          id: 'part-1',
          game: {
            id: 'game-1',
            gomafiaId: 'game-1',
            date: new Date(),
            status: 'completed',
            winnerTeam: 'BLACK',
            durationMinutes: 45,
          },
        },
      ],
      roleStats: [
        { role: 'DON', gamesPlayed: 5, wins: 3, losses: 2, winRate: 60 },
      ],
    });

    mockPlayers.set(removablePlayerId, {
      id: removablePlayerId,
      userId: 'user-1',
      gomafiaId: `gm-${removablePlayerId}`,
      name: 'Removable Player',
      eloRating: 1400,
      totalGames: 10,
      wins: 6,
      losses: 4,
      region: 'US',
      lastSyncAt: new Date(),
      syncStatus: 'PENDING',
      clubId: null,
      club: null,
      participations: [],
      roleStats: [],
    });
  });

  it('retrieves a domain player by id', async () => {
    const player = await adapter.getById(playerId);
    expect(player).not.toBeNull();
    expect(player?.id).toBe(playerId);
    expect(player?.name).toBe('Integration Player');
  });

  it('lists players with pagination support', async () => {
    const response = await adapter.list({
      page: 1,
      limit: 5,
    });

    const exists = response.players.some((summary) => summary.id === playerId);
    expect(exists).toBe(true);
    expect(response.pagination.total).toBeGreaterThan(0);
  });

  it('persists domain changes via save', async () => {
    const updated = new Player({
      id: playerId,
      name: 'Integration Player',
      totalGames: 30,
      wins: 18,
      losses: 12,
      eloRating: 1625,
      region: 'US',
    });

    await adapter.save(updated);

    const persisted = mockPlayers.get(playerId);
    expect(persisted?.wins).toBe(18);
    expect(persisted?.losses).toBe(12);
    expect(persisted?.eloRating).toBe(1625);
    expect(persisted?.region).toBe('US');
  });

  it('removes players using delete', async () => {
    await adapter.delete(removablePlayerId);
    const exists = mockPlayers.has(removablePlayerId);
    expect(exists).toBe(false);
  });
});

describe('RedisCacheAdapter', () => {
  const adapter = new RedisCacheAdapter();

  beforeEach(() => {
    inMemoryCache.clear();
  });

  it('stores and retrieves cached values', async () => {
    const key = `cache-key-${Date.now()}`;
    const payload = { value: 'cached' };

    await adapter.set(key, payload, { ttlSeconds: 60, tags: ['test-cache'] });
    const retrieved = await adapter.get<typeof payload>(key);

    expect(retrieved).toEqual(payload);

    await adapter.delete(key);
    const cleaned = await adapter.get(key);
    expect(cleaned).toBeNull();
  });

  it('invalidates entries by tags', async () => {
    const keyA = `cache-key-a-${Date.now()}`;
    const keyB = `cache-key-b-${Date.now()}`;

    await adapter.set(keyA, { value: 'A' }, { tags: ['players', 'shared'] });
    await adapter.set(keyB, { value: 'B' }, { tags: ['players'] });

    await adapter.invalidateTags(['players']);

    expect(await adapter.get(keyA)).toBeNull();
    expect(await adapter.get(keyB)).toBeNull();
  });
});

describe('SupabaseMessageBusAdapter', () => {
  it('dispatches published messages to subscribers', async () => {
    const adapter = new SupabaseMessageBusAdapter(null);
    const received: MessageEnvelope[] = [];

    await adapter.subscribe('player.updated', async (message) => {
      received.push(message);
    });

    await adapter.publish({
      topic: 'player.updated',
      payload: { id: 'player-123' },
    });

    expect(received).toHaveLength(1);
    expect(received[0].payload).toEqual({ id: 'player-123' });
  });

  it('schedules future messages', async () => {
    const adapter = new SupabaseMessageBusAdapter(null);
    const received: string[] = [];

    await adapter.subscribe('player.notification', async (message) => {
      received.push((message.payload as { status: string }).status);
    });

    await adapter.schedule(
      {
        topic: 'player.notification',
        payload: { status: 'scheduled' },
      },
      {
        deliverAt: new Date(Date.now() + 15),
      }
    );

    expect(received).toContain('scheduled');
    adapter.dispose();
  });
});
