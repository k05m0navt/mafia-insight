/**
 * Test Setup and Global Configuration
 *
 * This file runs before all tests to set up the test environment,
 * configure database connections, and provide utility functions.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db';

// Load test environment variables
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('[Test Setup] Initializing test environment...');

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

  console.warn('[Test Setup] Clearing test database...');

  // Delete in order to respect foreign key constraints
  await prisma.notification.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.dataIntegrityReport.deleteMany({});
  await prisma.syncLog.deleteMany({});
  await prisma.syncStatus.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
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
  }>
) {
  const player = await prisma.player.create({
    data: {
      gomafiaId: overrides?.gomafiaId || '12345',
      name: overrides?.name || 'Test Player',
      wins: overrides?.wins || 10,
      losses: overrides?.losses || 5,
      draws: 2,
      points: 100,
      eloRating: overrides?.eloRating || 1500,
      rank: 1,
      bestPlayerCount: 0,
      bestMoveCount: 0,
      firstKillCount: 0,
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
  }>
) {
  const club = await prisma.club.create({
    data: {
      gomafiaId: overrides?.gomafiaId || 'club-123',
      name: overrides?.name || 'Test Club',
      region: overrides?.region || 'Test Region',
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
  }>
) {
  const tournament = await prisma.tournament.create({
    data: {
      gomafiaId: overrides?.gomafiaId || 'tournament-123',
      name: overrides?.name || 'Test Tournament',
      startDate: overrides?.startDate || new Date('2024-01-01'),
      endDate: overrides?.endDate || new Date('2024-01-31'),
      type: 'RATING',
      season: '2024',
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
