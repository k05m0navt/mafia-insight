import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  CheckpointManager,
  ImportCheckpoint,
} from '@/lib/gomafia/import/checkpoint-manager';

describe('CheckpointManager', () => {
  let db: PrismaClient;
  let checkpointManager: CheckpointManager;

  beforeEach(async () => {
    db = new PrismaClient();
    checkpointManager = new CheckpointManager(db);

    // Clear any existing checkpoint
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: { currentOperation: null, isRunning: false, progress: 0 },
      create: { id: 'current', isRunning: false, progress: 0 },
    });
  });

  afterEach(async () => {
    await db.$disconnect();
  });

  it('should save and load checkpoint', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'PLAYERS',
      lastBatchIndex: 10,
      totalBatches: 50,
      processedIds: ['player-1', 'player-2'],
      message: 'Importing players: batch 10/50',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);
    const loaded = await checkpointManager.loadCheckpoint();

    expect(loaded).toEqual(checkpoint);
  });

  it('should return null when no checkpoint exists', async () => {
    await db.syncStatus.update({
      where: { id: 'current' },
      data: { currentOperation: null },
    });

    const loaded = await checkpointManager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('should clear checkpoint', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'GAMES',
      lastBatchIndex: 5,
      totalBatches: 20,
      processedIds: ['game-1'],
      message: 'Importing games',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);
    await checkpointManager.clearCheckpoint();

    const loaded = await checkpointManager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('should update progress percentage', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'PLAYERS',
      lastBatchIndex: 25,
      totalBatches: 50,
      processedIds: [],
      message: 'Half complete',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);

    const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
    expect(status?.progress).toBe(50); // 25/50 = 50%
  });

  it('should handle phase-specific metadata', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'PLAYER_YEAR_STATS',
      lastBatchIndex: 15,
      totalBatches: 100,
      processedIds: ['player-123'],
      phaseMetadata: {
        currentYear: 2025,
        yearsProcessed: [2025, 2024],
      },
      message: 'Processing year stats',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);
    const loaded = await checkpointManager.loadCheckpoint();

    expect(loaded?.phaseMetadata).toEqual({
      currentYear: 2025,
      yearsProcessed: [2025, 2024],
    });
  });

  it('should handle malformed JSON gracefully', async () => {
    await db.syncStatus.update({
      where: { id: 'current' },
      data: { currentOperation: 'invalid json{' },
    });

    const loaded = await checkpointManager.loadCheckpoint();
    expect(loaded).toBeNull();
  });
});
