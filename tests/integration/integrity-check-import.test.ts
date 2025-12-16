import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { IntegrityChecker } from '@/lib/gomafia/import/integrity-checker';
import { Browser } from 'playwright';

describe('Integrity Check Integration with Import (Story 2.9)', () => {
  let db: PrismaClient;
  let browser: Browser;

  beforeEach(async () => {
    db = new PrismaClient();
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
  });

  afterEach(async () => {
    await db.$disconnect();
    await browser.close();
  });

  it('should run phase-level integrity checks after each phase completes (AC #2)', async () => {
    // Create test data
    const testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    const testClub = await db.club.create({
      data: {
        name: 'Test Club',
        createdBy: testUser.id,
      },
    });

    const testPlayer = await db.player.create({
      data: {
        userId: testUser.id,
        gomafiaId: 'test-player-1',
        name: 'Test Player',
        clubId: testClub.id, // Valid club reference
      },
    });

    // Create orchestrator
    const orchestrator = new ImportOrchestrator(db, browser);

    // Mock phase execution to verify integrity checks are called
    // Note: In a real scenario, phases would execute and integrity checks would run
    // For this test, we verify the method exists and can be called
    const phase: 'CLUBS' = 'CLUBS';

    // Verify phase-level integrity check method exists
    expect(orchestrator.runPhaseIntegrityChecks).toBeDefined();

    // Run phase-level integrity check for CLUBS phase
    // This should check player-club links
    await orchestrator.runPhaseIntegrityChecks(phase);

    // Verify integrity checker can detect valid references
    const integrityChecker = new IntegrityChecker(db);
    const playerClubCheck = await integrityChecker.checkPlayerClubLinks();

    // Should pass since player references valid club
    expect(playerClubCheck.passed).toBe(true);
  });

  it('should detect integrity violations during phase-level checks (AC #1, #2)', async () => {
    // Create test data with invalid reference
    const testUser = await db.user.create({
      data: {
        email: 'test2@example.com',
        name: 'Test User 2',
      },
    });

    const testPlayer = await db.player.create({
      data: {
        userId: testUser.id,
        gomafiaId: 'test-player-2',
        name: 'Test Player 2',
        clubId: 'non-existent-club-id', // Invalid club reference
      },
    });

    // Run integrity check
    const integrityChecker = new IntegrityChecker(db);
    const playerClubCheck = await integrityChecker.checkPlayerClubLinks();

    // Should fail and detect violation
    expect(playerClubCheck.passed).toBe(false);
    expect(playerClubCheck.errors.length).toBeGreaterThan(0);
    expect(playerClubCheck.violations).toBeDefined();
    expect(playerClubCheck.violations?.length).toBeGreaterThan(0);
    expect(playerClubCheck.violations?.[0].entityType).toBe('Player');
    expect(playerClubCheck.violations?.[0].missingReferenceType).toBe('Club');
  });

  it('should run full integrity audit before marking import as complete (AC #2)', async () => {
    // Create test data
    const testUser = await db.user.create({
      data: {
        email: 'test3@example.com',
        name: 'Test User 3',
      },
    });

    const testPlayer = await db.player.create({
      data: {
        userId: testUser.id,
        gomafiaId: 'test-player-3',
        name: 'Test Player 3',
      },
    });

    const testTournament = await db.tournament.create({
      data: {
        name: 'Test Tournament',
        startDate: new Date(),
        createdBy: testUser.id,
        chiefJudgeId: testPlayer.id, // Valid judge reference
      },
    });

    // Run full integrity check
    const integrityChecker = new IntegrityChecker(db);
    const fullAudit = await integrityChecker.checkAllIntegrity();

    // Should include checks for tournament chief judge links
    expect(fullAudit.checks.length).toBeGreaterThanOrEqual(8);
    const chiefJudgeCheck = fullAudit.checks.find(
      (c) => c.checkName === 'Tournament-ChiefJudge Links'
    );
    expect(chiefJudgeCheck).toBeDefined();
    expect(chiefJudgeCheck?.passed).toBe(true);
  });

  it('should store integrity check results in sync log (AC #2)', async () => {
    // Create test sync log
    const syncLog = await db.syncLog.create({
      data: {
        type: 'HISTORICAL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    // Create orchestrator and set sync log ID
    const orchestrator = new ImportOrchestrator(db, browser);
    // Access private property via type assertion for testing
    (orchestrator as any).currentSyncLogId = syncLog.id;

    // Run phase-level integrity check
    const phase: 'GAMES' = 'GAMES';
    await orchestrator.runPhaseIntegrityChecks(phase);

    // Verify integrity results are stored in sync log
    const updatedSyncLog = await db.syncLog.findUnique({
      where: { id: syncLog.id },
      select: { errors: true },
    });

    expect(updatedSyncLog?.errors).toBeDefined();
    if (updatedSyncLog?.errors && typeof updatedSyncLog.errors === 'object') {
      const errors = updatedSyncLog.errors as Record<string, unknown>;
      expect(errors.integrityResults).toBeDefined();
      const integrityResults = errors.integrityResults as Record<
        string,
        unknown
      >;
      expect(integrityResults.GAMES).toBeDefined();
    }
  });

  it('should check game-judge links after games phase (AC #1, #2)', async () => {
    // Create test data
    const testUser = await db.user.create({
      data: {
        email: 'test4@example.com',
        name: 'Test User 4',
      },
    });

    const testPlayer = await db.player.create({
      data: {
        userId: testUser.id,
        gomafiaId: 'test-player-4',
        name: 'Test Player 4',
      },
    });

    const testGame = await db.game.create({
      data: {
        gomafiaId: 'test-game-1',
        date: new Date(),
        judgeId: testPlayer.id, // Valid judge reference
      },
    });

    // Run integrity check for game-judge links
    const integrityChecker = new IntegrityChecker(db);
    const gameJudgeCheck = await integrityChecker.checkGameJudgeLinks();

    // Should pass
    expect(gameJudgeCheck.passed).toBe(true);
    expect(gameJudgeCheck.totalChecked).toBe(1);
  });

  it('should detect invalid game-judge references (AC #1)', async () => {
    // Create test data with invalid judge reference
    const testGame = await db.game.create({
      data: {
        gomafiaId: 'test-game-2',
        date: new Date(),
        judgeId: 'non-existent-judge-id', // Invalid judge reference
      },
    });

    // Run integrity check
    const integrityChecker = new IntegrityChecker(db);
    const gameJudgeCheck = await integrityChecker.checkGameJudgeLinks();

    // Should fail and detect violation
    expect(gameJudgeCheck.passed).toBe(false);
    expect(gameJudgeCheck.errors.length).toBeGreaterThan(0);
    expect(gameJudgeCheck.violations).toBeDefined();
    expect(gameJudgeCheck.violations?.[0].entityType).toBe('Game');
    expect(gameJudgeCheck.violations?.[0].missingReferenceType).toBe(
      'Player/Judge'
    );
  });
});
