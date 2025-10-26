import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BatchProcessor } from '@/lib/gomafia/import/batch-processor';

describe('BatchProcessor', () => {
  let db: PrismaClient;
  let batchProcessor: BatchProcessor<{ id: string; value: number }>;

  beforeEach(() => {
    db = new PrismaClient();
    batchProcessor = new BatchProcessor(db, 10); // Small batch size for testing
  });

  afterEach(async () => {
    await db.$disconnect();
  });

  it('should split data into correct batch sizes', async () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    const batches: any[][] = [];
    await batchProcessor.process(data, async (batch) => {
      batches.push(batch);
    });

    expect(batches.length).toBe(3); // 25 items / 10 per batch = 3 batches
    expect(batches[0].length).toBe(10);
    expect(batches[1].length).toBe(10);
    expect(batches[2].length).toBe(5); // Remainder
  });

  it('should handle empty data array', async () => {
    const processFn = vi.fn();
    await batchProcessor.process([], processFn);

    expect(processFn).not.toHaveBeenCalled();
  });

  it('should process single batch when data size equals batch size', async () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    const batches: any[][] = [];
    await batchProcessor.process(data, async (batch) => {
      batches.push(batch);
    });

    expect(batches.length).toBe(1);
    expect(batches[0].length).toBe(10);
  });

  it('should process single batch when data size is less than batch size', async () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    const batches: any[][] = [];
    await batchProcessor.process(data, async (batch) => {
      batches.push(batch);
    });

    expect(batches.length).toBe(1);
    expect(batches[0].length).toBe(5);
  });

  it('should call processor function for each batch sequentially', async () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    const processedBatchIndices: number[] = [];
    await batchProcessor.process(data, async (batch, batchIndex) => {
      processedBatchIndices.push(batchIndex);
    });

    expect(processedBatchIndices).toEqual([0, 1, 2]);
  });

  it('should provide batch metadata to processor function', async () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    let lastMetadata: any = null;
    await batchProcessor.process(
      data,
      async (batch, batchIndex, totalBatches) => {
        lastMetadata = { batchIndex, totalBatches };
      }
    );

    expect(lastMetadata).toEqual({ batchIndex: 2, totalBatches: 3 });
  });

  it('should handle processor function errors', async () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    await expect(async () => {
      await batchProcessor.process(data, async (batch, batchIndex) => {
        if (batchIndex === 1) {
          throw new Error('Batch processing error');
        }
      });
    }).rejects.toThrow('Batch processing error');
  });

  it('should track metrics', async () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    await batchProcessor.process(data, async () => {
      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const metrics = batchProcessor.getMetrics();
    expect(metrics.totalBatches).toBe(3);
    expect(metrics.totalRecords).toBe(25);
    expect(metrics.batchSize).toBe(10);
  });

  it('should reset metrics', async () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    await batchProcessor.process(data, async () => {});

    let metrics = batchProcessor.getMetrics();
    expect(metrics.totalBatches).toBe(1);

    batchProcessor.reset();
    metrics = batchProcessor.getMetrics();
    expect(metrics.totalBatches).toBe(0);
    expect(metrics.totalRecords).toBe(0);
  });
});
