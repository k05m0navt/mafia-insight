import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { chromium, Browser } from 'playwright';

// Mock database
const mockDb = {
  syncStatus: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  syncLog: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  db: mockDb,
  prisma: mockDb,
}));

// Mock resilientDB to use mocked database
vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: async <T>(operation: (db: any) => Promise<T>): Promise<T> => {
      return operation(mockDb);
    },
  },
}));

describe('Import Progress Tracking Integration', () => {
  let browser: Browser;
  let orchestrator: ImportOrchestrator;
  let db: any;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    const dbModule = await import('@/lib/db');
    db = dbModule.db;
    orchestrator = new ImportOrchestrator(db, browser);

    // Reset mocks
    vi.clearAllMocks();

    // Setup default sync status
    vi.mocked(db.syncStatus.upsert).mockResolvedValue({
      id: 'current',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    } as any);

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    } as any);

    // Setup syncLog mocks for updateProgressState
    vi.mocked(db.syncLog.create).mockResolvedValue({
      id: 'test-sync-log-id',
      type: 'FULL',
      status: 'RUNNING',
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(db.syncLog.findUnique).mockResolvedValue({
      id: 'test-sync-log-id',
      errors: {},
      startTime: new Date(),
    } as any);

    vi.mocked(db.syncLog.update).mockResolvedValue({
      id: 'test-sync-log-id',
      errors: {},
    } as any);

    vi.mocked(db.syncStatus.update).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    } as any);
  });

  afterEach(async () => {
    await browser.close();
    vi.restoreAllMocks();
  });

  it('should track progress when phase changes', async () => {
    // Start import to set up prerequisites (currentSyncLogId, importStartTime)
    await orchestrator.start();

    // Simulate phase progression
    await orchestrator.setPhase('CLUBS');

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify progress state was updated
    expect(db.syncStatus.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncStatus.update).mock.calls[0];
    expect(updateCall[0].data.currentOperation).toContain('CLUBS');
  });

  it('should update phase progress during import', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    // Set initial phase
    await orchestrator.setPhase('GAMES');

    // Clear previous calls
    vi.clearAllMocks();

    // Update phase progress
    orchestrator.updatePhaseProgress(100, 500, {
      id: 'game-100',
      name: 'Game 100',
    });

    // Wait for async updateProgressState to complete by waiting for the mock to be called
    let attempts = 0;
    while (!db.syncLog.update.mock.calls.length && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      attempts++;
    }

    // Verify progress was updated in database
    expect(db.syncLog.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncLog.update).mock.calls[0];
    const errors = updateCall[0].data.errors as any;
    expect(errors.progressMetrics).toBeDefined();
    expect(errors.progressMetrics.currentPhase).toBe('GAMES');
    expect(errors.progressMetrics.phaseProgress.processed).toBe(100);
    expect(errors.progressMetrics.phaseProgress.total).toBe(500);
  });

  it('should calculate processing rate correctly', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    const startTime = new Date('2024-01-01T10:00:00Z');
    const now = new Date('2024-01-01T10:01:00Z'); // 60 seconds later

    vi.useFakeTimers();
    vi.setSystemTime(now);

    // Set phase and update progress
    await orchestrator.setPhase('PLAYERS');
    orchestrator.updatePhaseProgress(600, 1000, { pageNumber: 6 });

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify processing rate is calculated
    expect(db.syncLog.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncLog.update).mock.calls[0];
    const errors = updateCall[0].data.errors as any;
    expect(errors.progressMetrics.processingRate).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('should track current entity being processed', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    await orchestrator.setPhase('TOURNAMENTS');
    orchestrator.updatePhaseProgress(50, 200, {
      id: 'tournament-50',
      name: 'Tournament 50',
    });

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(db.syncLog.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncLog.update).mock.calls[0];
    const errors = updateCall[0].data.errors as any;
    expect(errors.progressMetrics.currentEntity).toEqual({
      id: 'tournament-50',
      name: 'Tournament 50',
    });
  });

  it('should persist progress state across operations', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    // Set phase and update progress
    await orchestrator.setPhase('STATISTICS');
    orchestrator.updatePhaseProgress(750, 1000, { id: 'stat-750' });

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify progress is stored in database
    expect(db.syncLog.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncLog.update).mock.calls[0];
    const errors = updateCall[0].data.errors as any;
    expect(errors.progressMetrics).toBeDefined();
    expect(errors.progressMetrics.currentPhase).toBe('STATISTICS');
    expect(errors.progressMetrics.phaseProgress.processed).toBe(750);
  });

  it('should handle phase transitions correctly', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    const phases = ['CLUBS', 'PLAYERS', 'GAMES', 'STATISTICS'];

    for (const phase of phases) {
      await orchestrator.setPhase(phase as any);
      // Wait for async updateProgressState to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Verify each phase was set
    expect(db.syncStatus.update).toHaveBeenCalledTimes(phases.length);
  });

  it('should update overall progress percentage', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    await orchestrator.setPhase('GAMES');

    // Update progress to 50%
    orchestrator.updatePhaseProgress(500, 1000);

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify overall progress is calculated
    expect(db.syncLog.update).toHaveBeenCalled();
    const updateCall = vi.mocked(db.syncLog.update).mock.calls[0];
    const errors = updateCall[0].data.errors as any;
    expect(errors.progressMetrics.overallProgress).toBe(50);
  });

  it('should handle progress updates with zero counts', async () => {
    // Start import to set up prerequisites
    await orchestrator.start();

    await orchestrator.setPhase('CLUBS');
    orchestrator.updatePhaseProgress(0, 0);

    // Wait for async updateProgressState to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not throw error
    expect(db.syncLog.update).toHaveBeenCalled();
  });
});
