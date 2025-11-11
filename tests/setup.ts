/**
 * Test Setup and Global Configuration
 *
 * This file runs before all tests to set up the test environment,
 * configure database connections, and provide utility functions.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { Club, Player, Tournament, User } from '@prisma/client';
import { prisma } from '../src/lib/db';

const skipDatabaseSetup = process.env.PRISMA_SKIP_DB === 'true';

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Load test environment variables
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

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
      '[Test Setup] Skipping clearTestDatabase (PRISMA_SKIP_DB=true)'
    );
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
    const now = new Date();
    const user: User = {
      id: makeId('user'),
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      role: overrides?.role || 'user',
      subscriptionTier: 'FREE',
      avatar: null,
      createdAt: now,
      updatedAt: now,
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
    const player: Player = {
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
    };

    return player;
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
    const club: Club = {
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
    };

    return club;
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
  }>
) {
  if (skipDatabaseSetup) {
    const now = new Date();
    const tournament: Tournament = {
      id: makeId('tournament'),
      gomafiaId: overrides?.gomafiaId || 'tournament-123',
      name: overrides?.name || 'Test Tournament',
      description: null,
      stars: null,
      averageElo: null,
      isFsmRated: false,
      startDate: overrides?.startDate || new Date('2024-01-01'),
      endDate: overrides?.endDate || new Date('2024-01-31'),
      status: 'SCHEDULED',
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
    };

    return tournament;
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
