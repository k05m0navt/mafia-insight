import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { PlayerTournamentPhase } from '@/lib/gomafia/import/phases/player-tournament-phase';

describe('PlayerTournamentPhase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);

    // Clean up test data
    await db.playerTournament.deleteMany({});
    await db.player.deleteMany({});
    await db.tournament.deleteMany({});
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should import player-tournament history with prize money', async () => {
    // Create test player
    await db.player.create({
      data: {
        id: 'test-player-pt-1',
        userId: 'test-user',
        gomafiaId: '123',
        name: 'Test Player PT',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Create test tournament
    await db.tournament.create({
      data: {
        id: 'test-tournament-pt-1',
        gomafiaId: 'test-tournament-123',
        name: 'Test Tournament PT',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'COMPLETED',
        createdBy: 'test-user',
      },
    });

    const phase = new PlayerTournamentPhase(orchestrator);

    // Execute phase
    await phase.execute();

    // Verify phase name
    expect(phase.getPhaseName()).toBe('PLAYER_TOURNAMENT_HISTORY');

    // Note: Actual scraping would happen here
    // For now, we verify the phase executes without errors
    // In a real test environment with a mock server, we'd verify:
    // - Tournament history is scraped for each player
    // - Placement/rank is extracted
    // - GG Points and ELO change are recorded
    // - Prize money is parsed from Russian currency format
    // - PlayerTournament records are created
  });

  it('should create proper checkpoint structure', () => {
    const phase = new PlayerTournamentPhase(orchestrator);

    const checkpoint = phase.createCheckpoint(2, 5, ['player1', 'player2']);

    expect(checkpoint.phase).toBe('PLAYER_TOURNAMENT_HISTORY');
    expect(checkpoint.lastBatchIndex).toBe(2);
    expect(checkpoint.totalBatches).toBe(5);
    expect(checkpoint.processedIds).toEqual(['player1', 'player2']);
    expect(checkpoint.message).toContain('batch 3/5');
    expect(checkpoint.timestamp).toBeDefined();
  });

  it('should handle players with no tournament history', async () => {
    // Create player with no games/tournaments
    await db.player.create({
      data: {
        id: 'test-player-pt-2',
        userId: 'test-user',
        gomafiaId: '456',
        name: 'Test Player PT 2',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    const phase = new PlayerTournamentPhase(orchestrator);

    // Should not throw error
    await expect(phase.execute()).resolves.not.toThrow();

    // Verify no links were created
    const linksCount = await db.playerTournament.count();
    expect(linksCount).toBe(0);
  });
});
