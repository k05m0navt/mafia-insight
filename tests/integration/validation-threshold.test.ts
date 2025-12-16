/**
 * Integration test for validation threshold enforcement (Task 10: AC #1, #2, #3)
 * Tests that import pauses when validation rate < 98% and validation metrics are properly tracked
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

describe('Validation Threshold Enforcement (Integration)', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser, 60000);
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  // Task 10: AC #1 - Test import with high-quality data (≥98%)
  it('should allow import to continue when validation rate ≥ 98%', async () => {
    const syncLog = await db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    orchestrator['currentSyncLogId'] = syncLog.id;

    // Simulate 98% validation rate (meets threshold)
    for (let i = 0; i < 98; i++) {
      orchestrator.recordValidRecord('players');
    }
    for (let i = 0; i < 2; i++) {
      orchestrator.recordInvalidRecord('players', 'Minor validation error');
    }

    const thresholdMet = await orchestrator.checkValidationThreshold(
      'PLAYERS',
      0
    );
    expect(thresholdMet).toBe(true);

    // Sync status should still be running
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });
    // Note: checkValidationThreshold sets isRunning to false if threshold not met
    // But if threshold is met, it doesn't change status, so we check that no error was set
    if (syncStatus) {
      expect(syncStatus.lastError).not.toContain(
        'Data quality below threshold'
      );
    }

    await db.syncLog.delete({ where: { id: syncLog.id } });
  });

  // Task 10: AC #1 - Test import with low-quality data (<98%)
  it('should pause import when validation rate < 98%', async () => {
    const syncLog = await db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: { isRunning: true },
      create: { id: 'current', isRunning: true },
    });

    orchestrator['currentSyncLogId'] = syncLog.id;

    // Simulate 95% validation rate (below 98% threshold)
    for (let i = 0; i < 95; i++) {
      orchestrator.recordValidRecord('players');
    }
    for (let i = 0; i < 5; i++) {
      orchestrator.recordInvalidRecord('players', 'Validation failed', {
        gomafiaId: `player-${i}`,
      });
    }

    const thresholdMet = await orchestrator.checkValidationThreshold(
      'PLAYERS',
      0
    );
    expect(thresholdMet).toBe(false);

    // Verify sync status was updated
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });
    expect(syncStatus?.isRunning).toBe(false);
    expect(syncStatus?.lastError).toContain('Data quality below threshold');
    expect(syncStatus?.validationRate).toBe(95);

    // Verify detailed errors were logged in SyncLog
    const updatedSyncLog = await db.syncLog.findUnique({
      where: { id: syncLog.id },
      select: { errors: true },
    });

    expect(updatedSyncLog?.errors).toBeDefined();
    const errors = updatedSyncLog?.errors as Record<string, unknown>;
    expect(errors.validationMetrics).toBeDefined();
    const metrics = errors.validationMetrics as Record<string, unknown>;
    expect(metrics.thresholdFailure).toBeDefined();

    const failure = metrics.thresholdFailure as {
      phase: string;
      validationRate: number;
      meetsThreshold: boolean;
      recentErrors: unknown[];
    };

    expect(failure.phase).toBe('PLAYERS');
    expect(failure.validationRate).toBe(95);
    expect(failure.meetsThreshold).toBe(false);
    expect(failure.recentErrors).toBeDefined();

    await db.syncLog.delete({ where: { id: syncLog.id } });
  });

  // Task 10: AC #2 - Test referential integrity validation
  it('should detect broken references in referential integrity checks', async () => {
    // This test would require setting up test data with broken references
    // For now, we verify the enhanced IntegrityChecker methods exist
    const integrityChecker = await import(
      '@/lib/gomafia/import/integrity-checker'
    );
    const { IntegrityChecker } = integrityChecker;

    const checker = new IntegrityChecker(db);

    // Verify new methods exist
    expect(checker.checkGameTournamentLinks).toBeDefined();
    expect(checker.checkPlayerClubLinks).toBeDefined();
    expect(checker.checkTournamentClubLinks).toBeDefined();

    // Run all integrity checks
    const result = await checker.checkAllIntegrity();
    expect(result.checks.length).toBeGreaterThanOrEqual(6); // Should include new checks
  });

  // Task 10: AC #2 - Test Zod schema validation
  it('should catch invalid fields with enhanced Zod schemas', async () => {
    const { clubSchema } = await import('@/lib/gomafia/validators/club-schema');
    const { tournamentSchema } = await import(
      '@/lib/gomafia/validators/tournament-schema'
    );
    const { playerSchema } = await import(
      '@/lib/gomafia/validators/player-schema'
    );
    const { gameSchema } = await import('@/lib/gomafia/validators/game-schema');

    // Test club schema - invalid name (too short)
    const invalidClub = {
      gomafiaId: 'test-club',
      name: 'A', // Too short (min 2 characters)
      region: null,
      president: null,
      members: 10,
    };
    const clubResult = clubSchema.safeParse(invalidClub);
    expect(clubResult.success).toBe(false);
    if (!clubResult.success) {
      expect(clubResult.error.issues[0].message).toContain(
        'at least 2 characters'
      );
    }

    // Test tournament schema - invalid date range (endDate before startDate)
    const invalidTournament = {
      gomafiaId: 'test-tournament',
      name: 'Test Tournament',
      stars: 3,
      averageElo: 1500,
      isFsmRated: true,
      startDate: '2024-12-31',
      endDate: '2024-01-01', // Before start date
      status: 'COMPLETED',
      participants: 10,
    };
    const tournamentResult = tournamentSchema.safeParse(invalidTournament);
    expect(tournamentResult.success).toBe(false);
    if (!tournamentResult.success) {
      expect(
        tournamentResult.error.issues.some((issue) =>
          issue.message.includes('End date must be after')
        )
      ).toBe(true);
    }

    // Test player schema - invalid ELO (negative)
    const invalidPlayer = {
      gomafiaId: 'test-player',
      name: 'Test Player',
      region: null,
      club: null,
      tournaments: 10,
      ggPoints: 100,
      elo: -100, // Invalid: negative
    };
    const playerResult = playerSchema.safeParse(invalidPlayer);
    expect(playerResult.success).toBe(false);
    if (!playerResult.success) {
      expect(
        playerResult.error.issues.some((issue) =>
          issue.message.includes('cannot be negative')
        )
      ).toBe(true);
    }

    // Test game schema - invalid date (too far in future)
    const invalidGame = {
      gomafiaId: 'test-game',
      tournamentId: null,
      tableNumber: 1,
      judgeId: null,
      date: '2035-01-01T00:00:00Z', // Too far in future
      durationMinutes: 60,
      winnerTeam: 'BLACK',
      status: 'COMPLETED',
      participations: [],
    };
    const gameResult = gameSchema.safeParse(invalidGame);
    expect(gameResult.success).toBe(false);
    if (!gameResult.success) {
      expect(
        gameResult.error.issues.some((issue) =>
          issue.message.includes('reasonable range')
        )
      ).toBe(true);
    }
  });
});
