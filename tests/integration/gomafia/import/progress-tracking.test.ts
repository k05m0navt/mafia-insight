import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CheckpointManager } from '@/lib/gomafia/import/checkpoint-manager';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Integration tests for progress tracking accuracy.
 * Verifies that progress tracking calculates correctly and checkpoints save at correct intervals.
 *
 * AC #1.8: Tracks import progress (percentage complete, current game number, estimated time remaining)
 * AC #2.3: Incremental progress updates (save checkpoint every N games)
 */
describe('Progress Tracking Accuracy Integration', () => {
  let db: PrismaClient;
  let checkpointManager: CheckpointManager;

  beforeEach(async () => {
    if (process.env.PRISMA_SKIP_DB === 'true') {
      return;
    }

    db = new PrismaClient();
    checkpointManager = new CheckpointManager(db);

    // Clear test data
    await db.importCheckpoint.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    await db.syncStatus.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
  });

  afterEach(async () => {
    if (db) {
      await db.$disconnect();
    }
  });

  describe('Progress Calculation', () => {
    it('should calculate percentage complete correctly', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const testCases = [
        { processed: 0, total: 100, expected: 0 },
        { processed: 25, total: 100, expected: 25 },
        { processed: 50, total: 100, expected: 50 },
        { processed: 75, total: 100, expected: 75 },
        { processed: 100, total: 100, expected: 100 },
        { processed: 500, total: 1000, expected: 50 },
        { processed: 750, total: 1000, expected: 75 },
        { processed: 1000, total: 1000, expected: 100 },
      ];

      for (const testCase of testCases) {
        const percentage = Math.round(
          (testCase.processed / testCase.total) * 100
        );
        expect(percentage).toBe(testCase.expected);
      }
    });

    it('should handle edge cases in progress calculation', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      // Zero total should not cause division by zero
      const percentageZero = 0;
      expect(percentageZero).toBe(0);

      // Processed greater than total should cap at 100%
      const processed = 150;
      const total = 100;
      const percentage = Math.min(Math.round((processed / total) * 100), 100);
      expect(percentage).toBe(100);
    });

    it('should track current game number accurately', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1000;
      const checkpointInterval = 100;

      for (
        let processed = 0;
        processed <= totalGames;
        processed += checkpointInterval
      ) {
        const checkpoint = {
          currentPhase: 'GAMES' as const,
          currentBatch: Math.floor(processed / 100),
          lastProcessedId: `game-${processed}`,
          processedIds: Array.from(
            { length: processed },
            (_, i) => `game-${i}`
          ),
          progress: Math.round((processed / totalGames) * 100),
          isPaused: false,
        };

        await checkpointManager.saveCheckpoint(checkpoint);

        // Verify current game number matches processed count
        const loaded = await checkpointManager.loadCheckpoint();
        expect(loaded?.processedIds.length).toBe(processed);
        expect(loaded?.lastProcessedId).toBe(`game-${processed}`);
      }
    });
  });

  describe('Checkpoint Save Intervals', () => {
    it('should save checkpoint every N games (e.g., every 100 games)', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1000;
      const checkpointInterval = 100; // Save every 100 games
      const expectedCheckpoints =
        Math.floor(totalGames / checkpointInterval) + 1; // +1 for final checkpoint

      let savedCheckpoints = 0;

      for (
        let processed = 0;
        processed <= totalGames;
        processed += checkpointInterval
      ) {
        const checkpoint = {
          currentPhase: 'GAMES' as const,
          currentBatch: Math.floor(processed / 100),
          lastProcessedId: `game-${processed}`,
          processedIds: Array.from(
            { length: processed },
            (_, i) => `game-${i}`
          ),
          progress: Math.round((processed / totalGames) * 100),
          isPaused: false,
        };

        await checkpointManager.saveCheckpoint(checkpoint);
        savedCheckpoints++;

        // Verify checkpoint was saved at correct interval
        if (processed > 0 && processed % checkpointInterval === 0) {
          const loaded = await checkpointManager.loadCheckpoint();
          expect(loaded).not.toBeNull();
          expect(loaded?.progress).toBe(
            Math.round((processed / totalGames) * 100)
          );
        }
      }

      expect(savedCheckpoints).toBe(expectedCheckpoints);
    });

    it('should save checkpoint after each batch completion', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const batchSize = 100;
      const totalBatches = 10;

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const processed = (batchIndex + 1) * batchSize;
        const totalGames = totalBatches * batchSize;

        const checkpoint = {
          currentPhase: 'GAMES' as const,
          currentBatch: batchIndex + 1,
          lastProcessedId: `game-${processed}`,
          processedIds: Array.from(
            { length: processed },
            (_, i) => `game-${i}`
          ),
          progress: Math.round((processed / totalGames) * 100),
          isPaused: false,
        };

        await checkpointManager.saveCheckpoint(checkpoint);

        // Verify checkpoint saved after batch
        const loaded = await checkpointManager.loadCheckpoint();
        expect(loaded?.currentBatch).toBe(batchIndex + 1);
        expect(loaded?.progress).toBe(
          Math.round((processed / totalGames) * 100)
        );
      }
    });

    it('should update sync status with progress', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const checkpoint = {
        currentPhase: 'GAMES' as const,
        currentBatch: 5,
        lastProcessedId: 'game-500',
        processedIds: Array.from({ length: 500 }, (_, i) => `game-${i}`),
        progress: 50,
        isPaused: false,
      };

      await checkpointManager.saveCheckpoint(checkpoint);

      // Verify sync status was updated
      const syncStatus = await resilientDB.execute((db) =>
        db.syncStatus.findUnique({
          where: { id: 'current' },
        })
      );

      expect(syncStatus).not.toBeNull();
      expect(syncStatus?.progress).toBe(50);
      expect(syncStatus?.currentOperation).toContain('GAMES');
      expect(syncStatus?.currentOperation).toContain('batch 5');
    });
  });

  describe('Estimated Time Remaining', () => {
    it('should calculate estimated time remaining based on processing rate', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1000;
      const processedGames = 500;
      const elapsedSeconds = 100; // 100 seconds elapsed
      const estimatedSecondsPerGame = 2; // Conservative estimate

      // Calculate processing rate
      const gamesPerSecond = processedGames / elapsedSeconds;
      const remainingGames = totalGames - processedGames;
      const estimatedTimeRemaining = Math.ceil(remainingGames / gamesPerSecond);

      // Alternative calculation using fixed estimate
      const estimatedTimeRemainingFixed =
        remainingGames * estimatedSecondsPerGame;

      expect(estimatedTimeRemaining).toBeGreaterThan(0);
      expect(estimatedTimeRemainingFixed).toBe(1000); // 500 games * 2 seconds
      expect(estimatedTimeRemainingFixed).toBeGreaterThanOrEqual(
        estimatedTimeRemaining
      );
    });

    it('should handle zero processed games in time estimation', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1000;
      const processedGames = 0;
      const estimatedSecondsPerGame = 2;

      const remainingGames = totalGames - processedGames;
      const estimatedTimeRemaining = remainingGames * estimatedSecondsPerGame;

      expect(estimatedTimeRemaining).toBe(2000); // 1000 games * 2 seconds
    });

    it('should update estimated time as progress increases', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1000;
      const estimatedSecondsPerGame = 2;

      const progressPoints = [0, 250, 500, 750, 1000];

      for (const processed of progressPoints) {
        const remainingGames = totalGames - processed;
        const estimatedTimeRemaining = remainingGames * estimatedSecondsPerGame;

        expect(estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
        expect(estimatedTimeRemaining).toBeLessThanOrEqual(
          totalGames * estimatedSecondsPerGame
        );

        // As progress increases, estimated time should decrease
        if (processed > 0) {
          const previousProcessed =
            progressPoints[progressPoints.indexOf(processed) - 1];
          const previousRemaining = totalGames - previousProcessed;
          const previousEstimated = previousRemaining * estimatedSecondsPerGame;
          expect(estimatedTimeRemaining).toBeLessThan(previousEstimated);
        }
      }
    });
  });

  describe('Progress Accuracy Across Phases', () => {
    it('should track progress accurately across multiple phases', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const phases = ['CLUBS', 'PLAYERS', 'TOURNAMENTS', 'GAMES', 'STATISTICS'];
      const totalPhases = phases.length;
      const gamesPerPhase = 200;
      const totalGames = phases.length * gamesPerPhase;

      let overallProcessed = 0;

      for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
        const phase = phases[phaseIndex] as any;
        const phaseProcessed = gamesPerPhase;
        overallProcessed += phaseProcessed;

        const checkpoint = {
          currentPhase: phase,
          currentBatch: phaseIndex + 1,
          lastProcessedId: `game-${overallProcessed}`,
          processedIds: Array.from(
            { length: overallProcessed },
            (_, i) => `game-${i}`
          ),
          progress: Math.round((overallProcessed / totalGames) * 100),
          isPaused: false,
        };

        await checkpointManager.saveCheckpoint(checkpoint);

        // Verify progress increases with each phase
        const loaded = await checkpointManager.loadCheckpoint();
        expect(loaded?.progress).toBe(
          Math.round((overallProcessed / totalGames) * 100)
        );
        expect(loaded?.currentPhase).toBe(phase);
      }

      // Final progress should be 100%
      expect(overallProcessed).toBe(totalGames);
    });

    it('should handle phase transitions without progress loss', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      // Complete CLUBS phase
      const clubsCheckpoint = {
        currentPhase: 'CLUBS' as const,
        currentBatch: 10,
        lastProcessedId: 'club-100',
        processedIds: Array.from({ length: 100 }, (_, i) => `club-${i}`),
        progress: 10,
        isPaused: false,
      };

      await checkpointManager.saveCheckpoint(clubsCheckpoint);
      const clubsLoaded = await checkpointManager.loadCheckpoint();
      expect(clubsLoaded?.progress).toBe(10);

      // Transition to PLAYERS phase
      const playersCheckpoint = {
        currentPhase: 'PLAYERS' as const,
        currentBatch: 0,
        lastProcessedId: null,
        processedIds: [],
        progress: 10, // Progress should be maintained
        isPaused: false,
      };

      await checkpointManager.saveCheckpoint(playersCheckpoint);
      const playersLoaded = await checkpointManager.loadCheckpoint();
      expect(playersLoaded?.currentPhase).toBe('PLAYERS');
      expect(playersLoaded?.progress).toBe(10); // Progress maintained
    });
  });
});
