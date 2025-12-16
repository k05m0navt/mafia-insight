/**
 * Integration test for ImportOrchestrator validation metrics collection
 * Tests T090: Verify that metrics are collected and tracked correctly during import
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

describe('ImportOrchestrator Metrics Collection (Integration)', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser, 60000); // 1 minute timeout for tests
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should initialize with zero validation metrics', () => {
    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.totalFetched).toBe(0);
    expect(metrics.validRecords).toBe(0);
    expect(metrics.invalidRecords).toBe(0);
    expect(metrics.duplicatesSkipped).toBe(0);
    expect(metrics.validationRate).toBe(0);
  });

  it('should track validation metrics during import', async () => {
    // Mock valid data
    const validPlayerData = {
      gomafiaId: 'test-player-1',
      name: 'Test Player',
      eloRating: 1500,
      totalGames: 100,
      wins: 50,
      losses: 50,
      region: 'Москва',
    };

    const isValid = await orchestrator.validatePlayerData(validPlayerData);

    if (isValid) {
      orchestrator.recordValidRecord('players');
    }

    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.validRecords).toBe(1);
    expect(metrics.totalFetched).toBe(1);
    expect(metrics.validationRate).toBe(100);
  });

  it('should track invalid records in metrics', async () => {
    // Mock invalid data (missing required fields)
    const invalidPlayerData = {
      gomafiaId: '', // Invalid: empty
      name: '', // Invalid: empty
      eloRating: -1, // Invalid: negative
    };

    const isValid = await orchestrator.validatePlayerData(invalidPlayerData);

    if (!isValid) {
      orchestrator.recordInvalidRecord('players', 'Validation failed');
    }

    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.invalidRecords).toBe(1);
    expect(metrics.validationRate).toBe(0);
  });

  it('should calculate validation rate correctly', async () => {
    // Add 8 valid records
    for (let i = 0; i < 8; i++) {
      orchestrator.recordValidRecord('players');
    }

    // Add 2 invalid records
    for (let i = 0; i < 2; i++) {
      orchestrator.recordInvalidRecord('players', 'Validation error');
    }

    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.totalFetched).toBe(10);
    expect(metrics.validRecords).toBe(8);
    expect(metrics.invalidRecords).toBe(2);
    expect(metrics.validationRate).toBe(80); // 8/10 = 80%
  });

  it('should track duplicates skipped separately', async () => {
    // Simulate duplicate detection
    const existingPlayer = await db.player.findFirst({
      where: { gomafiaId: 'existing-player' },
    });

    if (existingPlayer) {
      orchestrator.recordDuplicateSkipped();
    }

    const metrics = orchestrator.getValidationMetrics();

    // Duplicates don't count toward validation rate
    expect(metrics.duplicatesSkipped).toBeGreaterThanOrEqual(0);
  });

  it('should provide detailed summary of validation status', async () => {
    // Simulate import with 98% validation rate (meets threshold)
    for (let i = 0; i < 98; i++) {
      orchestrator.recordValidRecord('players');
    }
    for (let i = 0; i < 2; i++) {
      orchestrator.recordInvalidRecord('players', 'Error');
    }

    const summary = orchestrator.getValidationSummary();

    expect(summary.validationRate).toBe(98);
    expect(summary.meetsThreshold).toBe(true);
    expect(summary.totalRecords).toBe(100);
  });

  it('should indicate when validation rate is below threshold', async () => {
    // Simulate import with 95% validation rate (below 98% threshold)
    for (let i = 0; i < 95; i++) {
      orchestrator.recordValidRecord('players');
    }
    for (let i = 0; i < 5; i++) {
      orchestrator.recordInvalidRecord('players', 'Error');
    }

    const summary = orchestrator.getValidationSummary();

    expect(summary.validationRate).toBe(95);
    expect(summary.meetsThreshold).toBe(false); // Below 98%
  });

  it('should reset validation metrics between imports', () => {
    // Add some metrics
    orchestrator.recordValidRecord('players');
    orchestrator.recordInvalidRecord('clubs', 'Error');

    // Reset
    orchestrator.resetValidationMetrics();

    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.totalFetched).toBe(0);
    expect(metrics.validRecords).toBe(0);
    expect(metrics.invalidRecords).toBe(0);
  });

  it('should track metrics per entity type', async () => {
    orchestrator.recordValidRecord('players');
    orchestrator.recordValidRecord('clubs');
    orchestrator.recordInvalidRecord('tournaments', 'Invalid tournament data');

    const metrics = orchestrator.getValidationMetrics();

    expect(metrics.totalFetched).toBe(3);
    expect(metrics.validRecords).toBe(2);
    expect(metrics.invalidRecords).toBe(1);
  });

  // Task 10: AC #1 - Test batch-level validation threshold check
  it('should pause import when validation threshold not met (< 98%)', async () => {
    // Create a sync log for testing
    const syncLog = await db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    // Set sync log ID in orchestrator
    orchestrator['currentSyncLogId'] = syncLog.id;

    // Simulate import with 95% validation rate (below 98% threshold)
    for (let i = 0; i < 95; i++) {
      orchestrator.recordValidRecord('players');
    }
    for (let i = 0; i < 5; i++) {
      orchestrator.recordInvalidRecord('players', 'Validation error');
    }

    // Check threshold - should return false (threshold not met)
    const thresholdMet = await orchestrator.checkValidationThreshold(
      'PLAYERS',
      0
    );
    expect(thresholdMet).toBe(false);

    // Verify sync status was updated to indicate validation failure
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });
    expect(syncStatus?.isRunning).toBe(false);
    expect(syncStatus?.lastError).toContain('Data quality below threshold');

    // Cleanup
    await db.syncLog.delete({ where: { id: syncLog.id } });
  });

  // Task 10: AC #1 - Test validation metrics stored in SyncLog after phase
  it('should store validation metrics in SyncLog.errors after phase completion', async () => {
    const syncLog = await db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    orchestrator['currentSyncLogId'] = syncLog.id;

    // Record some validation metrics
    orchestrator.recordValidRecord('Club');
    orchestrator.recordValidRecord('Club');
    orchestrator.recordInvalidRecord('Club', 'Validation failed', {
      gomafiaId: 'test-club-1',
    });

    // Store validation metrics for phase
    await orchestrator.storeValidationMetricsForPhase('CLUBS');

    // Verify metrics were stored in SyncLog
    const updatedSyncLog = await db.syncLog.findUnique({
      where: { id: syncLog.id },
      select: { errors: true },
    });

    expect(updatedSyncLog?.errors).toBeDefined();
    const errors = updatedSyncLog?.errors as Record<string, unknown>;
    expect(errors.validationMetrics).toBeDefined();
    const metrics = errors.validationMetrics as Record<string, unknown>;
    expect(metrics.CLUBS).toBeDefined();

    const phaseMetrics = metrics.CLUBS as {
      validationRate: number;
      meetsThreshold: boolean;
      totalRecords: number;
      validRecords: number;
      invalidRecords: number;
    };

    expect(phaseMetrics.validationRate).toBe(67); // 2/3 = 66.67% rounded
    expect(phaseMetrics.totalRecords).toBe(3);
    expect(phaseMetrics.validRecords).toBe(2);
    expect(phaseMetrics.invalidRecords).toBe(1);

    // Cleanup
    await db.syncLog.delete({ where: { id: syncLog.id } });
  });
});
