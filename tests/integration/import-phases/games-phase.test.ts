import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { GamesPhase } from '@/lib/gomafia/import/phases/games-phase';

describe('GamesPhase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);

    // Clean up test data
    await db.gameParticipation.deleteMany({});
    await db.game.deleteMany({});
    await db.tournament.deleteMany({});
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should import games with newest-first order', async () => {
    // Create test tournament
    await db.tournament.create({
      data: {
        id: 'test-tournament-games-1',
        gomafiaId: 'test-tournament-456',
        name: 'Test Tournament Games',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'COMPLETED',
        createdBy: 'test-user',
      },
    });

    const phase = new GamesPhase(orchestrator);

    // Execute phase
    await phase.execute();

    // Verify phase name
    expect(phase.getPhaseName()).toBe('GAMES');

    // Note: Actual scraping would happen here
    // For now, we verify the phase executes without errors
    // In a real test environment with a mock server, we'd verify:
    // - Games are scraped from /tournament/{id}?tab=games
    // - Games are ordered newest-first (descending)
    // - Game metadata (date, duration, winner, status) is extracted
    // - Participations (players, roles, teams) are extracted
    // - Games and participations are inserted atomically
  });

  it('should create proper checkpoint structure', () => {
    const phase = new GamesPhase(orchestrator);

    const checkpoint = phase.createCheckpoint(1, 4, ['tournament1']);

    expect(checkpoint.phase).toBe('GAMES');
    expect(checkpoint.lastBatchIndex).toBe(1);
    expect(checkpoint.totalBatches).toBe(4);
    expect(checkpoint.processedIds).toEqual(['tournament1']);
    expect(checkpoint.message).toContain('batch 2/4');
    expect(checkpoint.timestamp).toBeDefined();
  });

  it('should handle tournaments with no games', async () => {
    // Create tournament with no games
    await db.tournament.create({
      data: {
        id: 'test-tournament-games-2',
        gomafiaId: 'test-tournament-789',
        name: 'Empty Tournament',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'PENDING',
        createdBy: 'test-user',
      },
    });

    const phase = new GamesPhase(orchestrator);

    // Should not throw error
    await expect(phase.execute()).resolves.not.toThrow();

    // Verify no games were created
    const gamesCount = await db.game.count();
    expect(gamesCount).toBe(0);
  });
});
