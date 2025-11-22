import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  CheckpointManager,
  type ImportCheckpoint,
} from '@/lib/gomafia/import/checkpoint-manager';
import { clearTestDatabase } from '../setup';

describe('CheckpointManager', () => {
  let manager: CheckpointManager;

  beforeEach(async () => {
    await clearTestDatabase();
    manager = new CheckpointManager(prisma);
  });

  const baseCheckpoint: ImportCheckpoint = {
    currentPhase: 'PLAYERS',
    currentBatch: 10,
    lastProcessedId: 'player-10',
    processedIds: ['player-1', 'player-2'],
    progress: 20,
    isPaused: false,
  };

  it('saves and loads checkpoints', async () => {
    await manager.saveCheckpoint(baseCheckpoint);

    const loaded = await manager.loadCheckpoint();
    expect(loaded).toEqual(baseCheckpoint);
  });

  it('returns null when checkpoint is missing', async () => {
    const loaded = await manager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('clears checkpoint data', async () => {
    await manager.saveCheckpoint(baseCheckpoint);
    await manager.clearCheckpoint();

    const loaded = await manager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('updates sync status progress when saving', async () => {
    await manager.saveCheckpoint({ ...baseCheckpoint, progress: 55 });

    const status = await prisma.syncStatus.findUnique({
      where: { id: 'current' },
    });
    expect(status?.progress).toBe(55);
    expect(status?.currentOperation).toContain('PLAYERS');
  });

  it('stores paused state metadata', async () => {
    await manager.saveCheckpoint({ ...baseCheckpoint, isPaused: true });

    const loaded = await manager.loadCheckpoint();
    expect(loaded?.isPaused).toBe(true);
  });

  it('overwrites previous checkpoints on save', async () => {
    await manager.saveCheckpoint(baseCheckpoint);
    await manager.saveCheckpoint({
      currentPhase: 'GAMES',
      currentBatch: 1,
      lastProcessedId: null,
      processedIds: [],
      progress: 5,
      isPaused: false,
    });

    const loaded = await manager.loadCheckpoint();
    expect(loaded?.currentPhase).toBe('GAMES');
    expect(loaded?.progress).toBe(5);
  });
});
