import { vi } from 'vitest';

type Role = 'user' | 'admin' | 'moderator' | 'guest';

type GenericRecord = Record<string, any>;

const trackedFns: Array<ReturnType<typeof vi.fn>> = [];

function createMockFn<T extends (...args: any[]) => any>(implementation: T) {
  const spy = vi.fn(implementation);
  trackedFns.push(spy);
  return spy;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneRecord<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneRecord(item)) as unknown as T;
  }

  const result: GenericRecord = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = cloneRecord(entry);
  }
  return result as T;
}

function project<RecordType extends Record<string, any>>(
  record: RecordType,
  select?: Record<string, boolean>
) {
  if (!select) {
    return cloneRecord(record);
  }

  const projected: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) {
      projected[key] = cloneRecord(record[key]);
    }
  }

  return projected;
}

function normalizeInputData(data: GenericRecord): GenericRecord {
  const normalized: GenericRecord = {};

  Object.entries(data ?? {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('connect' in value && value.connect) {
        const connectValue = value.connect as GenericRecord;
        const connectId = connectValue.id ?? Object.values(connectValue)[0];
        normalized[`${key}Id`] = connectId;
        return;
      }

      if ('create' in value && value.create) {
        normalized[key] = normalizeInputData(value.create);
        return;
      }

      if ('set' in value) {
        const setValue = value.set;
        if (setValue && typeof setValue === 'object' && 'connect' in setValue) {
          const connectValue = setValue.connect as GenericRecord;
          const connectId = connectValue.id ?? Object.values(connectValue)[0];
          normalized[`${key}Id`] = connectId;
          return;
        }

        normalized[key] = setValue;
        return;
      }

      if ('disconnect' in value) {
        normalized[`${key}Id`] = null;
        return;
      }
    }

    normalized[key] = value;
  });

  return normalized;
}

function valueToComparable(value: unknown): number | string {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value as string;
}

function matchesWhere(record: GenericRecord, where?: GenericRecord): boolean {
  if (!where || Object.keys(where).length === 0) {
    return true;
  }

  if (Array.isArray(where)) {
    return where.every((clause) => matchesWhere(record, clause));
  }

  if ('OR' in where) {
    const conditions = Array.isArray(where.OR) ? where.OR : [where.OR];
    if (!conditions.some((condition) => matchesWhere(record, condition))) {
      return false;
    }
  }

  if ('AND' in where) {
    const conditions = Array.isArray(where.AND) ? where.AND : [where.AND];
    if (!conditions.every((condition) => matchesWhere(record, condition))) {
      return false;
    }
  }

  if ('NOT' in where) {
    const conditions = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
    if (conditions.some((condition) => matchesWhere(record, condition))) {
      return false;
    }
  }

  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') {
      continue;
    }

    const recordValue = record?.[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('equals' in value) {
        if (recordValue !== value.equals) {
          return false;
        }
        continue;
      }

      if ('contains' in value) {
        const search = String(value.contains);
        const source = String(recordValue ?? '');
        if (value.mode === 'insensitive') {
          if (!source.toLowerCase().includes(search.toLowerCase())) {
            return false;
          }
        } else if (!source.includes(search)) {
          return false;
        }
        continue;
      }

      if ('in' in value && Array.isArray(value.in)) {
        if (!value.in.includes(recordValue)) {
          return false;
        }
        continue;
      }

      if ('not' in value) {
        if (matchesWhere({ [key]: recordValue }, { [key]: value.not })) {
          return false;
        }
        continue;
      }

      const comparisonKeys: Array<'gte' | 'lte' | 'gt' | 'lt'> = [
        'gte',
        'lte',
        'gt',
        'lt',
      ];
      if (comparisonKeys.some((comparison) => comparison in value)) {
        const comparableValue = valueToComparable(recordValue);

        if (
          'gte' in value &&
          !(comparableValue >= valueToComparable(value.gte))
        ) {
          return false;
        }
        if (
          'lte' in value &&
          !(comparableValue <= valueToComparable(value.lte))
        ) {
          return false;
        }
        if ('gt' in value && !(comparableValue > valueToComparable(value.gt))) {
          return false;
        }
        if ('lt' in value && !(comparableValue < valueToComparable(value.lt))) {
          return false;
        }
        continue;
      }

      if ('some' in value && Array.isArray(recordValue)) {
        if (!recordValue.some((item) => matchesWhere(item, value.some))) {
          return false;
        }
        continue;
      }

      if ('none' in value && Array.isArray(recordValue)) {
        if (recordValue.some((item) => matchesWhere(item, value.none))) {
          return false;
        }
        continue;
      }

      if ('is' in value) {
        if (!matchesWhere(recordValue ?? {}, value.is)) {
          return false;
        }
        continue;
      }

      if (!matchesWhere(recordValue ?? {}, value)) {
        return false;
      }
      continue;
    }

    if (recordValue !== value) {
      return false;
    }
  }

  return true;
}

function applyOrder<RecordType extends Record<string, any>>(
  records: RecordType[],
  orderBy?:
    | Record<string, 'asc' | 'desc'>
    | Array<Record<string, 'asc' | 'desc'>>
) {
  if (!orderBy) {
    return [...records];
  }

  const orderEntries = Array.isArray(orderBy) ? orderBy : [orderBy];

  return [...records].sort((a, b) => {
    for (const entry of orderEntries) {
      const [field, direction] = Object.entries(entry)[0];
      const dir = direction === 'desc' ? -1 : 1;

      const aValue = a[field];
      const bValue = b[field];

      if (aValue < bValue) {
        return -1 * dir;
      }
      if (aValue > bValue) {
        return 1 * dir;
      }
    }

    return 0;
  });
}

function applyUpdate(record: GenericRecord, data: GenericRecord) {
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('set' in value) {
        record[key] = value.set;
        return;
      }

      if ('increment' in value) {
        record[key] = (record[key] ?? 0) + value.increment;
        return;
      }

      if ('decrement' in value) {
        record[key] = (record[key] ?? 0) - value.decrement;
        return;
      }

      if ('connect' in value && value.connect) {
        const connectValue = value.connect as GenericRecord;
        const connectId = connectValue.id ?? Object.values(connectValue)[0];
        record[`${key}Id`] = connectId;
        return;
      }

      if ('disconnect' in value) {
        record[`${key}Id`] = null;
        return;
      }
    }

    record[key] = value;
  });
}

type CollectionKey =
  | 'users'
  | 'notifications'
  | 'emailLogs'
  | 'dataIntegrityReports'
  | 'players'
  | 'clubs'
  | 'tournaments'
  | 'games'
  | 'playerTournaments'
  | 'gameParticipations'
  | 'playerRoleStats'
  | 'playerYearStats'
  | 'syncStatuses'
  | 'syncLogs'
  | 'importProgress'
  | 'importCheckpoints';

const state: Record<CollectionKey, GenericRecord[]> = {
  users: [],
  notifications: [],
  emailLogs: [],
  dataIntegrityReports: [],
  players: [],
  clubs: [],
  tournaments: [],
  games: [],
  playerTournaments: [],
  gameParticipations: [],
  playerRoleStats: [],
  playerYearStats: [],
  syncStatuses: [],
  syncLogs: [],
  importProgress: [],
  importCheckpoints: [],
};

const advisoryLocks = new Set<number>();

type CollectionOptions = {
  idPrefix: string;
  onCreate?: (record: GenericRecord) => void;
  onUpdate?: (record: GenericRecord, data: GenericRecord) => void;
};

function createCollection(key: CollectionKey, options: CollectionOptions) {
  const collection = () => state[key];

  const ensureDefaults = (record: GenericRecord) => {
    if (!record.id) {
      record.id = createId(options.idPrefix);
    }

    if (options.onCreate) {
      options.onCreate(record);
    }
  };

  const handleUpdate = (record: GenericRecord, data: GenericRecord) => {
    if (options.onUpdate) {
      options.onUpdate(record, data);
    } else if ('updatedAt' in record) {
      record.updatedAt = new Date();
    }
  };

  const create = createMockFn(async ({ data, include }: any) => {
    const normalized = normalizeInputData(data ?? {});
    ensureDefaults(normalized);
    const stored = cloneRecord(normalized);
    collection().push(stored);
    return include ? cloneRecord(stored) : cloneRecord(stored);
  });

  const createMany = createMockFn(async ({ data }: any) => {
    const payload = Array.isArray(data) ? data : [];
    for (const entry of payload) {
      await create({ data: entry });
    }
    return { count: payload.length };
  });

  const findMany = createMockFn(
    async ({ where, orderBy, skip, take, select }: any = {}) => {
      let results = collection().filter((record) =>
        matchesWhere(record, where)
      );
      results = applyOrder(results, orderBy);

      if (typeof skip === 'number') {
        results = results.slice(skip);
      }
      if (typeof take === 'number') {
        results = results.slice(0, take);
      }

      return results.map((record) => project(record, select));
    }
  );

  const findUnique = createMockFn(async ({ where, select }: any) => {
    const match = collection().find((record) => matchesWhere(record, where));
    return match ? project(match, select) : null;
  });

  const findFirst = createMockFn(
    async ({ where, orderBy, select }: any = {}) => {
      const matches = await findMany({ where, orderBy, select });
      return matches.length > 0 ? matches[0] : null;
    }
  );

  const update = createMockFn(async ({ where, data, select }: any) => {
    const record = collection().find((item) => matchesWhere(item, where));
    if (!record) {
      throw new Error('Record not found for update');
    }

    const normalized = normalizeInputData(data ?? {});
    applyUpdate(record, normalized);
    handleUpdate(record, normalized);
    return project(record, select);
  });

  const updateMany = createMockFn(async ({ where, data }: any) => {
    let count = 0;
    const normalized = normalizeInputData(data ?? {});

    collection().forEach((record) => {
      if (matchesWhere(record, where)) {
        applyUpdate(record, normalized);
        handleUpdate(record, normalized);
        count += 1;
      }
    });

    return { count };
  });

  const upsert = createMockFn(
    async ({ where, create: createData, update: updateData, select }: any) => {
      const existing = collection().find((record) =>
        matchesWhere(record, where)
      );

      if (!existing) {
        const normalizedCreate = normalizeInputData(createData ?? {});
        ensureDefaults(normalizedCreate);
        const stored = cloneRecord(normalizedCreate);
        collection().push(stored);
        return project(stored, select);
      }

      const normalizedUpdate = normalizeInputData(updateData ?? {});
      applyUpdate(existing, normalizedUpdate);
      handleUpdate(existing, normalizedUpdate);
      return project(existing, select);
    }
  );

  const remove = createMockFn(async ({ where, select }: any) => {
    const index = collection().findIndex((record) =>
      matchesWhere(record, where)
    );
    if (index === -1) {
      throw new Error('Record not found for delete');
    }

    const [removed] = collection().splice(index, 1);
    return project(removed, select);
  });

  const deleteMany = createMockFn(async ({ where }: any = {}) => {
    const before = collection().length;
    state[key] = collection().filter((record) => !matchesWhere(record, where));
    return { count: before - collection().length };
  });

  const count = createMockFn(async ({ where }: any = {}) => {
    return collection().filter((record) => matchesWhere(record, where)).length;
  });

  return {
    create,
    createMany,
    findMany,
    findUnique,
    findFirst,
    update,
    updateMany,
    upsert,
    delete: remove,
    deleteMany,
    count,
  };
}

const prisma = {
  user: createCollection('users', {
    idPrefix: 'user',
    onCreate: (record) => {
      record.role = record.role ?? ('user' satisfies Role);
      record.subscriptionTier = record.subscriptionTier ?? 'FREE';
      record.isActive = record.isActive ?? true;
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  notification: createCollection('notifications', {
    idPrefix: 'notification',
    onCreate: (record) => {
      record.read = record.read ?? false;
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  emailLog: createCollection('emailLogs', { idPrefix: 'email-log' }),
  dataIntegrityReport: createCollection('dataIntegrityReports', {
    idPrefix: 'integrity-report',
  }),
  player: createCollection('players', {
    idPrefix: 'player',
    onCreate: (record) => {
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  club: createCollection('clubs', {
    idPrefix: 'club',
    onCreate: (record) => {
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  tournament: createCollection('tournaments', {
    idPrefix: 'tournament',
    onCreate: (record) => {
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  game: createCollection('games', {
    idPrefix: 'game',
    onCreate: (record) => {
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  playerTournament: createCollection('playerTournaments', {
    idPrefix: 'player-tournament',
  }),
  gameParticipation: createCollection('gameParticipations', {
    idPrefix: 'game-participation',
  }),
  playerRoleStats: createCollection('playerRoleStats', {
    idPrefix: 'player-role-stats',
  }),
  playerYearStats: createCollection('playerYearStats', {
    idPrefix: 'player-year-stats',
  }),
  syncStatus: {
    ...createCollection('syncStatuses', {
      idPrefix: 'sync-status',
      onCreate: (record) => {
        record.isRunning = record.isRunning ?? false;
        record.lastSyncTime = record.lastSyncTime
          ? new Date(record.lastSyncTime)
          : null;
        record.createdAt = record.createdAt
          ? new Date(record.createdAt)
          : new Date();
        record.updatedAt = record.updatedAt
          ? new Date(record.updatedAt)
          : new Date();
      },
      onUpdate: (record) => {
        record.updatedAt = new Date();
      },
    }),
    findUnique: createMockFn(async ({ where, select }: any) => {
      const match = state.syncStatuses.find((record) =>
        matchesWhere(record, where)
      );
      return match ? project(match, select) : null;
    }),
  },
  syncLog: createCollection('syncLogs', {
    idPrefix: 'sync-log',
    onCreate: (record) => {
      record.startTime = record.startTime
        ? new Date(record.startTime)
        : new Date();
      record.endTime = record.endTime ? new Date(record.endTime) : null;
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  importProgress: createCollection('importProgress', {
    idPrefix: 'import-progress',
    onCreate: (record) => {
      record.startTime = record.startTime
        ? new Date(record.startTime)
        : new Date();
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  importCheckpoint: createCollection('importCheckpoints', {
    idPrefix: 'import-checkpoint',
    onCreate: (record) => {
      record.createdAt = record.createdAt
        ? new Date(record.createdAt)
        : new Date();
      record.updatedAt = record.updatedAt
        ? new Date(record.updatedAt)
        : new Date();
    },
    onUpdate: (record) => {
      record.updatedAt = new Date();
    },
  }),
  $transaction: createMockFn(async (operations: any) => {
    if (Array.isArray(operations)) {
      const results: unknown[] = [];
      for (const op of operations) {
        if (typeof op === 'function') {
          results.push(await op(prisma));
        } else {
          results.push(op);
        }
      }
      return results;
    }

    if (typeof operations === 'function') {
      return operations(prisma);
    }

    return operations;
  }),
  $executeRaw: createMockFn(async () => 0),
  $queryRaw: createMockFn(async (...args: any[]) => {
    // Helper to recursively find numbers in nested structures
    const findNumber = (value: any): number | null => {
      if (typeof value === 'number') {
        return value;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const num = findNumber(item);
          if (num !== null) return num;
        }
      }
      if (value && typeof value === 'object') {
        for (const key in value) {
          const num = findNumber(value[key]);
          if (num !== null) return num;
        }
      }
      return null;
    };

    const [first] = args;
    let queryText = '';
    let lockId: number | null = null;

    // Extract query text from various Prisma formats
    if (typeof first === 'string') {
      queryText = first;
    } else if (first && Array.isArray(first)) {
      // Prisma tagged template literal format
      // Can be: TemplateStringsArray or array of strings
      if (first.length > 0) {
        if (Array.isArray(first[0])) {
          // TemplateStringsArray: [['SELECT pg_try_advisory_lock(', ')'], lockId]
          queryText = first[0].join('?');
          // The parameter values come after the template strings
          if (first.length > 1) {
            lockId = findNumber(first[1]);
          }
        } else if (typeof first[0] === 'string') {
          queryText = first.join('');
        }
      }

      // Also check all args for numeric values
      if (lockId === null) {
        for (let i = 1; i < args.length; i++) {
          const num = findNumber(args[i]);
          if (num !== null) {
            lockId = num;
            break;
          }
        }
      }
    } else if (Array.isArray(first?.raw)) {
      queryText = first.raw.join('');
      lockId = findNumber(args.slice(1));
    } else if (first && typeof first.text === 'string') {
      queryText = first.text;
    } else if (first && typeof first === 'object') {
      // Check if it's a Prisma query object with values
      lockId = findNumber(first);
    }

    // Handle advisory lock queries
    if (queryText.includes('pg_try_advisory_lock')) {
      // First try to extract lockId from query text (for direct SQL)
      if (queryText) {
        const textMatch = queryText.match(/pg_try_advisory_lock\((\d+)\)/);
        if (textMatch) {
          lockId = Number(textMatch[1]);
        } else if (lockId === null) {
          // Try to find any large number in the query text (lock IDs are typically large)
          const numbers = queryText.match(/\d+/g);
          if (numbers) {
            const largeNumber = numbers.find((n) => Number(n) > 100000);
            if (largeNumber) {
              lockId = Number(largeNumber);
            }
          }
        }
      }

      // If still no lockId found, use 0 as fallback
      if (lockId === null) {
        lockId = 0;
      }

      const acquired = !advisoryLocks.has(lockId);
      if (acquired) {
        advisoryLocks.add(lockId);
      }
      return [{ pg_try_advisory_lock: acquired }];
    }

    if (queryText.includes('pg_advisory_unlock')) {
      // First try to extract lockId from query text
      if (queryText) {
        const textMatch = queryText.match(/pg_advisory_unlock\((\d+)\)/);
        if (textMatch) {
          lockId = Number(textMatch[1]);
        } else if (lockId === null) {
          // Try to find any large number in the query text
          const numbers = queryText.match(/\d+/g);
          if (numbers) {
            const largeNumber = numbers.find((n) => Number(n) > 100000);
            if (largeNumber) {
              lockId = Number(largeNumber);
            }
          }
        }
      }

      // If still no lockId found, use 0 as fallback
      if (lockId === null) {
        lockId = 0;
      }

      advisoryLocks.delete(lockId);
      return [{ pg_advisory_unlock: true }];
    }

    return [];
  }),
  $connect: createMockFn(async () => undefined),
  $disconnect: createMockFn(async () => undefined),
};

export const database = {
  prisma,
  state,
  resetMocks: () => {
    (Object.keys(state) as CollectionKey[]).forEach((key) => {
      state[key].length = 0;
    });

    advisoryLocks.clear();
    trackedFns.forEach((fn) => fn.mockClear());
  },
};

export default database;
