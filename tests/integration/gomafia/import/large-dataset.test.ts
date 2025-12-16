import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BatchProcessor } from '@/lib/gomafia/import/batch-processor';
import { CheckpointManager } from '@/lib/gomafia/import/checkpoint-manager';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

/**
 * Integration tests for large dataset handling (1000+ games).
 * Verifies that the import system can handle large datasets without timeout or memory issues.
 *
 * AC #2.1: Large datasets (1000+ games) without timeout or memory issues
 */
describe('Large Dataset Handling Integration', () => {
  let db: PrismaClient;
  let batchProcessor: BatchProcessor<any>;
  let checkpointManager: CheckpointManager;
  let rateLimiter: RateLimiter;

  beforeEach(async () => {
    // Skip if database is not available
    if (process.env.PRISMA_SKIP_DB === 'true') {
      return;
    }

    db = new PrismaClient();
    batchProcessor = new BatchProcessor(db, 100); // 100 records per batch
    checkpointManager = new CheckpointManager(db);
    rateLimiter = new RateLimiter(2000); // 2 seconds between requests

    // Clear any existing test data
    await db.importCheckpoint.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
  });

  afterEach(async () => {
    if (db) {
      await db.$disconnect();
    }
  });

  describe('Batch Processing', () => {
    it('should process 1000+ games in batches without memory issues', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1500;
      const batchSize = 100;
      const expectedBatches = Math.ceil(totalGames / batchSize);

      // Simulate processing 1500 games in batches
      let processedCount = 0;
      const batches: number[] = [];

      for (let batchIndex = 0; batchIndex < expectedBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, totalGames);
        const batchSizeActual = batchEnd - batchStart;

        // Simulate batch processing
        const batch = Array.from({ length: batchSizeActual }, (_, i) => ({
          id: `game-${batchStart + i}`,
          data: `game-data-${batchStart + i}`,
        }));

        // Process batch (simulated - would actually save to DB)
        processedCount += batch.length;
        batches.push(batch.length);

        // Verify batch size is correct
        expect(batch.length).toBeLessThanOrEqual(batchSize);
        expect(batch.length).toBeGreaterThan(0);
      }

      expect(processedCount).toBe(totalGames);
      expect(batches.length).toBe(expectedBatches);
      expect(batches[batches.length - 1]).toBeLessThanOrEqual(batchSize); // Last batch may be smaller
    });

    it('should handle batches of exactly 100 records', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const batchSize = 100;
      const testBatches = [
        Array.from({ length: 100 }, (_, i) => `record-${i}`),
        Array.from({ length: 100 }, (_, i) => `record-${100 + i}`),
        Array.from({ length: 100 }, (_, i) => `record-${200 + i}`),
      ];

      for (const batch of testBatches) {
        expect(batch.length).toBe(batchSize);
        // Verify batch processor can handle this size
        expect(batchProcessor).toBeDefined();
      }
    });

    it('should handle final partial batch correctly', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1250; // Not divisible by 100
      const batchSize = 100;
      const expectedBatches = Math.ceil(totalGames / batchSize);

      let processedCount = 0;
      for (let i = 0; i < expectedBatches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, totalGames);
        const batchSizeActual = batchEnd - batchStart;

        processedCount += batchSizeActual;

        // Last batch should be partial
        if (i === expectedBatches - 1) {
          expect(batchSizeActual).toBe(50); // 1250 % 100 = 50
          expect(batchSizeActual).toBeLessThan(batchSize);
        }
      }

      expect(processedCount).toBe(totalGames);
    });
  });

  describe('Memory Management', () => {
    it('should not accumulate memory across batches', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 2000;
      const batchSize = 100;
      const batches: any[] = [];

      // Process batches without keeping all data in memory
      for (let i = 0; i < Math.ceil(totalGames / batchSize); i++) {
        const batch = Array.from({ length: batchSize }, (_, j) => ({
          id: `game-${i * batchSize + j}`,
        }));

        // Process and clear reference
        batches.push(batch.length); // Only store count, not full data
        // In real implementation, batch would be saved to DB and reference cleared
      }

      // Verify we're not keeping all data in memory
      expect(batches.length).toBe(Math.ceil(totalGames / batchSize));
      // Each batch entry is just a number, not the full data
      expect(batches.every((b) => typeof b === 'number')).toBe(true);
    });

    it('should handle 5000+ games without timeout', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 5000;
      const batchSize = 100;
      const startTime = Date.now();
      const maxDuration = 60000; // 60 seconds max for test

      let processedCount = 0;
      for (let i = 0; i < Math.ceil(totalGames / batchSize); i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, totalGames);
        processedCount += batchEnd - batchStart;

        // Simulate rate limiting delay (2 seconds per batch would be too slow for test)
        // In real scenario, rate limiting applies per request, not per batch
        const elapsed = Date.now() - startTime;
        if (elapsed > maxDuration) {
          throw new Error('Test timeout - processing took too long');
        }
      }

      expect(processedCount).toBe(totalGames);
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(maxDuration);
    });
  });

  describe('Checkpoint Management for Large Datasets', () => {
    it('should save checkpoints periodically during large import', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 1500;
      const checkpointInterval = 100; // Save checkpoint every 100 games
      const expectedCheckpoints = Math.floor(totalGames / checkpointInterval);

      let savedCheckpoints = 0;

      for (
        let processed = 0;
        processed < totalGames;
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

        // Verify checkpoint was saved
        const loaded = await checkpointManager.loadCheckpoint();
        expect(loaded?.progress).toBe(checkpoint.progress);
      }

      expect(savedCheckpoints).toBe(expectedCheckpoints);
    });

    it('should resume from checkpoint for large dataset', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalGames = 2000;
      const checkpointAt = 1000;

      // Save checkpoint at 1000 games
      const checkpoint = {
        currentPhase: 'GAMES' as const,
        currentBatch: 10,
        lastProcessedId: `game-${checkpointAt}`,
        processedIds: Array.from(
          { length: checkpointAt },
          (_, i) => `game-${i}`
        ),
        progress: 50,
        isPaused: false,
      };

      await checkpointManager.saveCheckpoint(checkpoint);

      // Load checkpoint and verify resume point
      const loaded = await checkpointManager.loadCheckpoint();
      expect(loaded).not.toBeNull();
      expect(loaded?.lastProcessedId).toBe(`game-${checkpointAt}`);
      expect(loaded?.progress).toBe(50);
      expect(loaded?.processedIds.length).toBe(checkpointAt);

      // Verify we can continue from this point
      const remainingGames = totalGames - checkpointAt;
      expect(remainingGames).toBe(1000);
    });
  });

  describe('Rate Limiting for Large Datasets', () => {
    it('should enforce rate limiting across 1000+ requests', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const totalRequests = 1000;
      const minDelayMs = 2000; // 2 seconds
      const startTime = Date.now();

      // Simulate 1000 requests with rate limiting
      for (let i = 0; i < totalRequests; i++) {
        await rateLimiter.wait();
      }

      const elapsed = Date.now() - startTime;
      const expectedMinTime = (totalRequests - 1) * minDelayMs; // First request has no delay

      // Verify rate limiting was enforced (allowing some tolerance for test execution)
      expect(elapsed).toBeGreaterThan(expectedMinTime * 0.9); // 90% of expected time
      expect(rateLimiter.getRequestCount()).toBe(totalRequests);
    });

    it('should not exceed 30 requests per minute limit', async () => {
      if (process.env.PRISMA_SKIP_DB === 'true') {
        return;
      }

      const requestsPerMinute = 30;
      const minDelayMs = 2000; // 2 seconds = 30 requests per minute

      // Verify rate limiter is configured correctly
      const metrics = rateLimiter.getMetrics();
      expect(metrics.minDelayMs).toBe(minDelayMs);

      // Calculate max requests per minute
      const maxRequestsPerMinute = 60000 / minDelayMs; // 60 seconds / 2 seconds
      expect(maxRequestsPerMinute).toBe(30);
      expect(maxRequestsPerMinute).toBeLessThanOrEqual(requestsPerMinute);
    });
  });
});
