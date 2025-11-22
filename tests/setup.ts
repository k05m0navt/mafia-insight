/**
 * Test Setup and Global Configuration
 *
 * This file runs before all tests to set up the test environment,
 * configure database connections, and provide utility functions.
 */

import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type {
  PrismaClient,
  Club,
  Player,
  Tournament,
  User,
} from '@prisma/client';
import databaseMock from './__mocks__/database';
import { prisma } from '../src/lib/db';

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
};

const createStorageMock = (): { storage: StorageMock; reset: () => void } => {
  const store = new Map<string, string>();

  const storage: Partial<StorageMock> = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };

  Object.defineProperty(storage, 'length', {
    get() {
      return store.size;
    },
  });

  const reset = () => {
    store.clear();
  };

  return { storage: storage as StorageMock, reset };
};

const storageControllers: Array<() => void> = [];

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  const { storage: localStorageMock, reset: resetLocalStorage } =
    createStorageMock();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorageMock,
  });
  storageControllers.push(resetLocalStorage);

  const { storage: sessionStorageMock, reset: resetSessionStorage } =
    createStorageMock();
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    writable: true,
    value: sessionStorageMock,
  });
  storageControllers.push(resetSessionStorage);
}

const skipDatabaseSetup = process.env.PRISMA_SKIP_DB === 'true';

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Load test environment variables
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

if (skipDatabaseSetup) {
  const mockPrisma = databaseMock.prisma as unknown as PrismaClient;

  Object.assign(prisma, mockPrisma);
  for (const key of Object.keys(mockPrisma) as Array<keyof PrismaClient>) {
    // @ts-expect-error - assigning mock implementation
    prisma[key] = mockPrisma[key];
  }
}

class FakePage {
  private html = '<html><body></body></html>';
  private currentUrl = 'about:blank';

  on() {
    // no-op for requestfailed listeners in tests
  }

  off() {
    // no-op
  }

  async setContent(html: string) {
    this.html = html;
  }

  async goto(url: string) {
    this.currentUrl = url;
  }

  url() {
    return this.currentUrl;
  }

  async click(_selector: string) {
    // no-op for tests
  }

  async waitForTimeout(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
  }

  async waitForLoadState(_state: string, _options?: { timeout?: number }) {
    return;
  }

  async waitForSelector(selector: string, _options?: { timeout?: number }) {
    const dom = this.createDom();
    const selectors = selector.split(',').map((s) => s.trim());
    for (const single of selectors) {
      if (single.startsWith('text="') && single.endsWith('"')) {
        const text = single.slice(6, -1);
        const match = dom.window.document.body.textContent?.includes(text);
        if (match) return;
      } else if (dom.window.document.querySelector(single)) {
        return;
      }
    }
    throw new Error(`Selector ${selector} not found`);
  }

  private createDom() {
    return new JSDOM(this.html, { url: this.currentUrl });
  }

  async $$eval<T>(
    selector: string,
    callback: (nodes: Element[]) => T
  ): Promise<T> {
    const dom = this.createDom();
    const nodes = Array.from(dom.window.document.querySelectorAll(selector));
    return callback(nodes as Element[]);
  }

  async $(selector: string) {
    const dom = this.createDom();
    const element = dom.window.document.querySelector(selector);
    if (!element) return null;
    return {
      evaluate: async <R>(fn: (el: Element) => R) => fn(element),
    };
  }

  async evaluate<R>(
    fn: (...args: unknown[]) => R,
    ...args: unknown[]
  ): Promise<R> {
    const dom = this.createDom();
    const globalScope = globalThis as unknown as {
      document: Document;
      window: Window & typeof globalThis;
    };

    const prevDocument = globalScope.document;
    const prevWindow = globalScope.window;

    globalScope.document = dom.window.document;
    globalScope.window = dom.window as unknown as Window & typeof globalThis;

    try {
      return await fn(...args);
    } finally {
      globalScope.document = prevDocument;
      globalScope.window = prevWindow;
    }
  }
}

class FakeBrowser {
  async newPage() {
    return new FakePage();
  }

  async close() {
    // no-op
  }
}

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(async () => new FakeBrowser()),
  },
}));

vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  };

  return {
    useRouter: () => router,
    usePathname: () => '',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  };
});

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('[Test Setup] Initializing test environment...');

  if (skipDatabaseSetup) {
    console.warn(
      '[Test Setup] Skipping Prisma database connection (PRISMA_SKIP_DB=true)'
    );
    return;
  }

  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[Test Setup] Database connected successfully');
  } catch (error) {
    console.error('[Test Setup] Failed to connect to database:', error);
    throw error;
  }
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('[Test Teardown] Cleaning up test environment...');

  if (skipDatabaseSetup) {
    console.warn(
      '[Test Teardown] Skipping Prisma disconnect (PRISMA_SKIP_DB=true)'
    );
    return;
  }

  try {
    await prisma.$disconnect();
    console.log('[Test Teardown] Database disconnected');
  } catch (error) {
    console.error('[Test Teardown] Error disconnecting database:', error);
  }
});

/**
 * Before each test - optional cleanup
 */
beforeEach(async () => {
  // Add any per-test setup here if needed
  if (skipDatabaseSetup) {
    databaseMock.resetMocks();
  }

  if (typeof window !== 'undefined') {
    for (const reset of storageControllers) {
      reset();
    }
  }
});

/**
 * After each test - cleanup
 */
afterEach(async () => {
  // Clean up test data if needed
  // Be careful with this in production-like environments
});

/**
 * Utility: Clear all test data from database
 * Use with caution - only for test database!
 */
export async function clearTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearTestDatabase can only be used in test environment');
  }

  if (skipDatabaseSetup) {
    console.warn(
      '[Test Setup] Resetting in-memory Prisma mock (PRISMA_SKIP_DB=true)'
    );
    databaseMock.resetMocks();
    return;
  }

  console.warn('[Test Setup] Clearing test database...');

  // Delete in order to respect foreign key constraints
  await prisma.notification.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.dataIntegrityReport.deleteMany({});
  await prisma.syncLog.deleteMany({});
  await prisma.syncStatus.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.playerTournament.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('[Test Setup] Test database cleared');
}

/**
 * Utility: Create test user
 */
export async function createTestUser(
  overrides?: Partial<{
    email: string;
    name: string;
    role: 'user' | 'admin';
  }>
) {
  if (skipDatabaseSetup) {
    const created = await databaseMock.prisma.user.create({
      data: {
        email: overrides?.email || 'test@example.com',
        name: overrides?.name || 'Test User',
        role: overrides?.role || 'user',
      },
    });

    const user: User = {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role as User['role'],
      subscriptionTier: 'FREE',
      avatar: null,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      lastLogin: null,
      themePreference: 'system',
    };

    return user;
  }

  const user = await prisma.user.create({
    data: {
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      role: overrides?.role || 'user',
      subscriptionTier: 'FREE',
    },
  });

  return user;
}

/**
 * Utility: Create test admin user
 */
export async function createTestAdmin(
  overrides?: Partial<{
    email: string;
    name: string;
  }>
) {
  return createTestUser({
    ...overrides,
    role: 'admin',
  });
}

/**
 * Utility: Create test player
 */
export async function createTestPlayer(
  overrides?: Partial<{
    gomafiaId: string;
    name: string;
    wins: number;
    losses: number;
    eloRating: number;
    userId: string;
  }>
) {
  if (skipDatabaseSetup) {
    const now = new Date();
    const totalGames = (overrides?.wins ?? 10) + (overrides?.losses ?? 5);
    const player = await databaseMock.prisma.player.create({
      data: {
        id: makeId('player'),
        userId: overrides?.userId || makeId('user'),
        gomafiaId: overrides?.gomafiaId || '12345',
        name: overrides?.name || 'Test Player',
        eloRating: overrides?.eloRating ?? 1500,
        totalGames,
        wins: overrides?.wins ?? 10,
        losses: overrides?.losses ?? 5,
        region: null,
        clubId: null,
        lastSyncAt: null,
        syncStatus: null,
        createdAt: now,
        updatedAt: now,
        judgeCategory: null,
        judgeCanBeGs: null,
        judgeCanJudgeFinal: false,
        judgeMaxTablesAsGs: null,
        judgeRating: null,
        judgeGamesJudged: null,
        judgeAccreditationDate: null,
        judgeResponsibleFromSc: null,
      },
    });

    return player as unknown as Player;
  }

  const userId = overrides?.userId ?? (await createTestUser()).id;

  const totalGames = (overrides?.wins ?? 10) + (overrides?.losses ?? 5);

  const player = await prisma.player.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      gomafiaId: overrides?.gomafiaId || '12345',
      name: overrides?.name || 'Test Player',
      wins: overrides?.wins ?? 10,
      losses: overrides?.losses ?? 5,
      totalGames,
      eloRating: overrides?.eloRating ?? 1500,
    },
  });

  return player;
}

/**
 * Utility: Create test club
 */
export async function createTestClub(
  overrides?: Partial<{
    gomafiaId: string;
    name: string;
    region: string;
    createdById: string;
  }>
) {
  if (skipDatabaseSetup) {
    const now = new Date();
    const club = await databaseMock.prisma.club.create({
      data: {
        id: makeId('club'),
        gomafiaId: overrides?.gomafiaId || 'club-123',
        name: overrides?.name || 'Test Club',
        region: overrides?.region || 'Test Region',
        presidentId: null,
        description: null,
        logoUrl: null,
        createdBy: overrides?.createdById || makeId('user'),
        lastSyncAt: null,
        syncStatus: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return club as unknown as Club;
  }

  const creatorId = overrides?.createdById ?? (await createTestUser()).id;

  const club = await prisma.club.create({
    data: {
      gomafiaId: overrides?.gomafiaId || 'club-123',
      name: overrides?.name || 'Test Club',
      region: overrides?.region || 'Test Region',
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  });

  return club;
}

/**
 * Utility: Create test tournament
 */
export async function createTestTournament(
  overrides?: Partial<{
    gomafiaId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    createdById: string;
    status: Tournament['status'];
  }>
) {
  if (skipDatabaseSetup) {
    const now = new Date();
    const tournament = await databaseMock.prisma.tournament.create({
      data: {
        id: makeId('tournament'),
        gomafiaId: overrides?.gomafiaId || 'tournament-123',
        name: overrides?.name || 'Test Tournament',
        description: null,
        stars: null,
        averageElo: null,
        isFsmRated: false,
        startDate: overrides?.startDate || new Date('2024-01-01'),
        endDate: overrides?.endDate || new Date('2024-01-31'),
        status: overrides?.status || 'SCHEDULED',
        maxParticipants: null,
        entryFee: null,
        prizePool: null,
        createdBy: overrides?.createdById || makeId('user'),
        chiefJudgeId: null,
        lastSyncAt: null,
        syncStatus: null,
        gameCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    return tournament as unknown as Tournament;
  }

  const creatorId = overrides?.createdById ?? (await createTestUser()).id;

  const tournament = await prisma.tournament.create({
    data: {
      gomafiaId: overrides?.gomafiaId || 'tournament-123',
      name: overrides?.name || 'Test Tournament',
      startDate: overrides?.startDate || new Date('2024-01-01'),
      endDate: overrides?.endDate || new Date('2024-01-31'),
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  });

  return tournament;
}

/**
 * Utility: Wait for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
