import { PrismaClient } from '@prisma/client';

/**
 * Batch processor for handling large datasets in memory-efficient chunks.
 * Processes records in batches to avoid memory issues and enable checkpoint persistence.
 *
 * Default batch size: 100 records per batch
 */
export class BatchProcessor<T> {
  private totalBatches: number = 0;
  private totalRecords: number = 0;

  /**
   * @param db Prisma client for database operations
   * @param batchSize Number of records to process per batch (default: 100)
   */
  constructor(
    private db: PrismaClient,
    private batchSize: number = 100
  ) {}

  /**
   * Process data in batches with a custom processor function.
   *
   * @param data Array of records to process
   * @param processFn Function to process each batch (receives batch, batchIndex, totalBatches)
   * @returns Promise that resolves when all batches are processed
   *
   * @example
   * await batchProcessor.process(players, async (batch, batchIndex, totalBatches) => {
   *   await db.player.createMany({ data: batch });
   *   await checkpointManager.saveCheckpoint({
   *     phase: 'PLAYERS',
   *     lastBatchIndex: batchIndex,
   *     totalBatches,
   *     processedIds: batch.map(p => p.gomafiaId),
   *     message: `Importing players: batch ${batchIndex + 1}/${totalBatches}`,
   *     timestamp: new Date().toISOString()
   *   });
   * });
   */
  async process(
    data: T[],
    processFn: (
      batch: T[],
      batchIndex: number,
      totalBatches: number
    ) => Promise<void>
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const totalBatches = Math.ceil(data.length / this.batchSize);
    this.totalBatches = totalBatches;
    this.totalRecords = data.length;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.batchSize;
      const end = Math.min(start + this.batchSize, data.length);
      const batch = data.slice(start, end);

      await processFn(batch, i, totalBatches);
    }
  }

  /**
   * Get processing metrics for monitoring.
   */
  getMetrics() {
    return {
      totalBatches: this.totalBatches,
      totalRecords: this.totalRecords,
      batchSize: this.batchSize,
      estimatedMemoryPerBatch: this.calculateEstimatedMemory(),
    };
  }

  /**
   * Reset metrics (useful for starting a new import operation).
   */
  reset(): void {
    this.totalBatches = 0;
    this.totalRecords = 0;
  }

  /**
   * Calculate estimated memory usage per batch (rough approximation).
   * Assumes ~1KB per record on average.
   */
  private calculateEstimatedMemory(): string {
    const bytesPerRecord = 1024; // 1KB approximation
    const bytesPerBatch = this.batchSize * bytesPerRecord;

    if (bytesPerBatch < 1024 * 1024) {
      return `${(bytesPerBatch / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytesPerBatch / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}
