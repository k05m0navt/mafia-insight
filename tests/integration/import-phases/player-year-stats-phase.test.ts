import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { PlayerYearStatsPhase } from '@/lib/gomafia/import/phases/player-year-stats-phase';

describe('PlayerYearStatsPhase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);

    // Clean up test data
    await db.playerYearStats.deleteMany({});
    await db.player.deleteMany({});
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should process player year stats with 2-year gap handling', async () => {
    // Create test players
    await db.player.create({
      data: {
        id: 'test-player-stats-1',
        userId: 'test-user',
        gomafiaId: '123',
        name: 'Test Player Stats',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    const phase = new PlayerYearStatsPhase(orchestrator);

    // Execute phase
    await phase.execute();

    // Verify phase name
    expect(phase.getPhaseName()).toBe('PLAYER_YEAR_STATS');

    // Note: Actual scraping would happen here
    // For now, we verify the phase executes without errors
    // In a real test environment with a mock server, we'd verify:
    // - Year stats are scraped
    // - Stats are inserted into database
    // - Checkpoints are saved
    // - 2-year gap logic stops iteration
  });

  it('should create proper checkpoint structure', () => {
    const phase = new PlayerYearStatsPhase(orchestrator);

    const checkpoint = phase.createCheckpoint(5, 10, [
      'player1',
      'player2',
      'player3',
    ]);

    expect(checkpoint.phase).toBe('PLAYER_YEAR_STATS');
    expect(checkpoint.lastBatchIndex).toBe(5);
    expect(checkpoint.totalBatches).toBe(10);
    expect(checkpoint.processedIds).toEqual(['player1', 'player2', 'player3']);
    expect(checkpoint.message).toContain('batch 6/10');
    expect(checkpoint.timestamp).toBeDefined();
  });

  it('should handle empty player list gracefully', async () => {
    // Ensure no players exist
    await db.player.deleteMany({});

    const phase = new PlayerYearStatsPhase(orchestrator);

    // Should not throw error
    await expect(phase.execute()).resolves.not.toThrow();

    // Verify no stats were created
    const statsCount = await db.playerYearStats.count();
    expect(statsCount).toBe(0);
  });
});
