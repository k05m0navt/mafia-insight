import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { TournamentsPhase } from '@/lib/gomafia/import/phases/tournaments-phase';

describe('TournamentsPhase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);

    // Clean up test data
    await db.tournament.deleteMany({});
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should import tournaments with metadata extraction', async () => {
    const phase = new TournamentsPhase(orchestrator);

    // Execute phase
    await phase.execute();

    // Verify phase name
    expect(phase.getPhaseName()).toBe('TOURNAMENTS');

    // Note: Actual scraping would happen here
    // For now, we verify the phase executes without errors
    // In a real test environment with a mock server, we'd verify:
    // - Tournaments are scraped from /tournaments
    // - Stars, average ELO, FSM rating are extracted
    // - Start/end dates are parsed
    // - Tournaments are inserted into database
    // - Duplicates are skipped
  });

  it('should create proper checkpoint structure', () => {
    const phase = new TournamentsPhase(orchestrator);

    const checkpoint = phase.createCheckpoint(3, 8, [
      'tournament1',
      'tournament2',
    ]);

    expect(checkpoint.phase).toBe('TOURNAMENTS');
    expect(checkpoint.lastBatchIndex).toBe(3);
    expect(checkpoint.totalBatches).toBe(8);
    expect(checkpoint.processedIds).toEqual(['tournament1', 'tournament2']);
    expect(checkpoint.message).toContain('batch 4/8');
    expect(checkpoint.timestamp).toBeDefined();
  });

  it('should skip duplicate tournaments', async () => {
    // Create an existing tournament
    await db.tournament.create({
      data: {
        id: 'test-tournament-1',
        gomafiaId: 'test-tournament-123',
        name: 'Test Tournament',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'COMPLETED',
        createdBy: 'test-user',
      },
    });

    const phase = new TournamentsPhase(orchestrator);

    // Check duplicate detection
    const isDuplicate = await phase.checkDuplicate('test-tournament-123');
    expect(isDuplicate).toBe(true);

    const isNotDuplicate = await phase.checkDuplicate('non-existent-id');
    expect(isNotDuplicate).toBe(false);
  });
});
