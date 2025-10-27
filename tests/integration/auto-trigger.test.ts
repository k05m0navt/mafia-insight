import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  isDatabaseEmpty,
  getDatabaseStats,
} from '@/lib/gomafia/import/auto-trigger';

describe('Auto-Trigger Integration Tests', () => {
  let db: PrismaClient;

  beforeEach(async () => {
    db = new PrismaClient();
  });

  afterEach(async () => {
    await db.$disconnect();
  });

  it('should detect empty database', async () => {
    // Ensure database is empty for this test
    await db.player.deleteMany({});
    await db.game.deleteMany({});

    const isEmpty = await isDatabaseEmpty();
    expect(isEmpty).toBe(true);
  });

  it('should detect non-empty database', async () => {
    // Create a test player
    await db.player.create({
      data: {
        id: 'test-player-auto',
        userId: 'test-user',
        gomafiaId: 'test-999',
        name: 'Test Player',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    const isEmpty = await isDatabaseEmpty();
    expect(isEmpty).toBe(false);

    // Cleanup
    await db.player.delete({ where: { gomafiaId: 'test-999' } });
  });

  it('should get database statistics', async () => {
    const stats = await getDatabaseStats();

    expect(stats).toHaveProperty('players');
    expect(stats).toHaveProperty('clubs');
    expect(stats).toHaveProperty('tournaments');
    expect(stats).toHaveProperty('games');
    expect(stats).toHaveProperty('isEmpty');

    expect(typeof stats.players).toBe('number');
    expect(typeof stats.clubs).toBe('number');
    expect(typeof stats.tournaments).toBe('number');
    expect(typeof stats.games).toBe('number');
    expect(typeof stats.isEmpty).toBe('boolean');
  });

  it('should mark database as empty when no players or games', async () => {
    // Ensure empty
    await db.player.deleteMany({});
    await db.game.deleteMany({});

    const stats = await getDatabaseStats();
    expect(stats.isEmpty).toBe(true);
  });

  it('should mark database as not empty when players exist', async () => {
    // Create a test player
    await db.player.create({
      data: {
        id: 'test-player-auto-2',
        userId: 'test-user',
        gomafiaId: 'test-998',
        name: 'Test Player 2',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    const stats = await getDatabaseStats();
    expect(stats.isEmpty).toBe(false);
    expect(stats.players).toBeGreaterThan(0);

    // Cleanup
    await db.player.delete({ where: { gomafiaId: 'test-998' } });
  });
});
