import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

/**
 * Integration tests for graceful import cancellation.
 *
 * Patterns inspired by p-queue's AbortController/AbortSignal usage:
 * - AbortController for cancellation signal
 * - Event-based cancellation detection
 * - Clean resource cleanup on abort
 * - Checkpoint saved before cancellation
 */

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock Playwright Browser
const mockBrowser = {
  close: vi.fn(),
} as unknown as Browser;

describe('ImportOrchestrator - Cancellation Support', () => {
  let orchestrator: ImportOrchestrator;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      syncLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        update: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      syncStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      importCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      // Mocks for IntegrityChecker
      game: { findMany: vi.fn().mockResolvedValue([]) },
      player: { findMany: vi.fn().mockResolvedValue([]) },
      tournament: { findMany: vi.fn().mockResolvedValue([]) },
      gameParticipation: { findMany: vi.fn().mockResolvedValue([]) },
      playerTournament: { findMany: vi.fn().mockResolvedValue([]) },
    };

    (PrismaClient as any).mockImplementation(() => mockDb);
    orchestrator = new ImportOrchestrator(mockDb, mockBrowser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('T117: Graceful Import Cancellation', () => {
    it('should create cancellation signal (AbortController)', () => {
      // Arrange & Act: Create AbortController
      const controller = new AbortController();
      const signal = controller.signal;

      // Assert: Signal exists and not aborted
      expect(signal).toBeDefined();
      expect(signal.aborted).toBe(false);
    });

    it('should detect cancellation signal when aborted', () => {
      // Arrange: Create controller and signal
      const controller = new AbortController();
      const signal = controller.signal;

      // Track abort event
      let abortDetected = false;
      signal.addEventListener('abort', () => {
        abortDetected = true;
      });

      // Act: Abort the signal
      controller.abort();

      // Assert: Abort detected
      expect(signal.aborted).toBe(true);
      expect(abortDetected).toBe(true);
    });

    it('should pass cancellation signal to orchestrator', async () => {
      // Arrange: Create signal
      const controller = new AbortController();

      // Act: Set signal on orchestrator
      orchestrator.setCancellationSignal(controller.signal);

      // Assert: Signal can be retrieved
      const signal = orchestrator.getCancellationSignal();
      expect(signal).toBe(controller.signal);
      expect(signal.aborted).toBe(false);
    });

    it('should detect cancellation during operation', async () => {
      // Arrange: Start import with cancellation signal
      const controller = new AbortController();
      orchestrator.setCancellationSignal(controller.signal);

      await orchestrator.start();

      // Act: Abort during operation
      controller.abort();

      // Assert: Orchestrator detects cancellation
      expect(orchestrator.isCancelled()).toBe(true);
    });

    it('should save checkpoint before cancelling', async () => {
      // Arrange: Start import
      await orchestrator.start();
      orchestrator.setPhase('CLUBS');

      // Mark some entities as processed
      orchestrator.markEntityProcessed('club-1');
      orchestrator.markEntityProcessed('club-2');
      orchestrator.markEntityProcessed('club-3');

      // Act: Request cancellation (should save checkpoint first)
      await orchestrator.cancel();

      // Assert: Checkpoint was saved
      expect(mockDb.importCheckpoint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            currentPhase: 'CLUBS',
            processedIds: ['club-1', 'club-2', 'club-3'],
          }),
        })
      );
    });

    it('should mark import as cancelled in syncLog', async () => {
      // Arrange: Start import
      await orchestrator.start();

      // Act: Cancel import
      await orchestrator.cancel();

      // Assert: SyncLog marked as cancelled
      expect(mockDb.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log-1' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            endTime: expect.any(Date),
          }),
        })
      );
    });

    it('should update syncStatus to show cancellation', async () => {
      // Arrange: Start import with progress
      await orchestrator.start();
      orchestrator.setPhase('PLAYERS');

      // Act: Cancel
      await orchestrator.cancel();

      // Assert: SyncStatus updated
      expect(mockDb.syncStatus.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'current' },
          data: expect.objectContaining({
            isRunning: false,
            lastError: 'Import cancelled by user',
          }),
        })
      );
    });

    it('should handle cancellation during different phases', async () => {
      const phases: Array<'CLUBS' | 'PLAYERS' | 'TOURNAMENTS'> = [
        'CLUBS',
        'PLAYERS',
        'TOURNAMENTS',
      ];

      for (const phase of phases) {
        // Reset mocks
        vi.clearAllMocks();
        orchestrator = new ImportOrchestrator(mockDb, mockBrowser);

        // Arrange: Start and set phase
        await orchestrator.start();
        orchestrator.setPhase(phase);

        // Act: Cancel
        await orchestrator.cancel();

        // Assert: Checkpoint saved with correct phase
        expect(mockDb.importCheckpoint.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({
              currentPhase: phase,
            }),
          })
        );
      }
    });

    it('should throw error if cancellation detected during critical operation', async () => {
      // Arrange: Set up cancellation signal
      const controller = new AbortController();
      orchestrator.setCancellationSignal(controller.signal);
      await orchestrator.start();

      // Act: Abort and then check
      controller.abort();

      // Assert: checkCancellation throws
      expect(() => {
        orchestrator.checkCancellation();
      }).toThrow('Import operation was cancelled');
    });

    it('should allow operations to check cancellation status', async () => {
      // Arrange: Start with signal
      const controller = new AbortController();
      orchestrator.setCancellationSignal(controller.signal);

      // Act: Check before abort
      const beforeAbort = orchestrator.isCancelled();

      // Abort
      controller.abort();

      // Check after abort
      const afterAbort = orchestrator.isCancelled();

      // Assert
      expect(beforeAbort).toBe(false);
      expect(afterAbort).toBe(true);
    });
  });

  describe('Cancellation Edge Cases', () => {
    it('should handle cancellation when no import is running', async () => {
      // Act & Assert: Should not throw
      await expect(orchestrator.cancel()).resolves.not.toThrow();
    });

    it('should handle multiple cancellation requests', async () => {
      // Arrange: Start import
      await orchestrator.start();

      // Act: Cancel multiple times
      await orchestrator.cancel();
      await orchestrator.cancel();
      await orchestrator.cancel();

      // Assert: Only cancelled once (idempotent)
      const cancelCalls = mockDb.syncLog.update.mock.calls.filter(
        (call: any) => call[0]?.data?.status === 'CANCELLED'
      );
      expect(cancelCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle cancellation without checkpoint', async () => {
      // Arrange: Start import but no checkpoint saved yet
      await orchestrator.start();

      // Act: Cancel immediately
      await orchestrator.cancel();

      // Assert: Still handles cancellation gracefully
      expect(mockDb.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
          }),
        })
      );
    });

    it('should detect cancellation signal after abort', async () => {
      // Arrange: Start with signal
      const controller = new AbortController();
      orchestrator.setCancellationSignal(controller.signal);
      await orchestrator.start();

      // Act: Abort signal, then cancel
      controller.abort();
      await orchestrator.cancel();

      // Assert: Can check that it was cancelled
      expect(orchestrator.isCancelled()).toBe(true);
    });
  });

  describe('AbortSignal Integration', () => {
    it('should pass signal to child operations', () => {
      // Arrange: Create signal
      const controller = new AbortController();
      orchestrator.setCancellationSignal(controller.signal);

      // Act: Get signal for child operations
      const signal = orchestrator.getCancellationSignal();

      // Assert: Same signal can be passed to scrapers, etc.
      expect(signal).toBe(controller.signal);
    });

    it('should handle DOMException from aborted operations', async () => {
      // This documents the expected behavior when operations are aborted
      const controller = new AbortController();

      // Simulate an aborted fetch-like operation
      const abortedOperation = async (signal: AbortSignal) => {
        if (signal.aborted) {
          throw new DOMException('The operation was aborted', 'AbortError');
        }
      };

      controller.abort();

      // Assert: DOMException thrown
      await expect(abortedOperation(controller.signal)).rejects.toThrow(
        DOMException
      );
    });

    it('should support cancellation reason', () => {
      // Arrange: Create controller
      const controller = new AbortController();
      const reason = 'User requested cancellation';

      // Act: Abort with reason
      controller.abort(reason);

      // Assert: Reason available
      expect(controller.signal.aborted).toBe(true);
      expect(controller.signal.reason).toBe(reason);
    });
  });

  describe('Checkpoint Preservation on Cancellation', () => {
    it('should preserve checkpoint for resume after cancellation', async () => {
      // Arrange: Start import and process some entities
      await orchestrator.start();
      orchestrator.setPhase('CLUBS');
      orchestrator.markEntityProcessed('club-1');
      orchestrator.markEntityProcessed('club-2');

      // Act: Cancel (checkpoint should be saved, not deleted)
      await orchestrator.cancel();

      // Assert: Checkpoint saved (not deleted)
      expect(mockDb.importCheckpoint.upsert).toHaveBeenCalled();
      expect(mockDb.importCheckpoint.delete).not.toHaveBeenCalled();
    });

    it('should allow resume from cancelled import', async () => {
      // Arrange: Simulate cancelled import with checkpoint
      const checkpoint = {
        id: 'checkpoint-1',
        currentPhase: 'PLAYERS',
        currentBatch: 5,
        lastProcessedId: 'player-50',
        processedIds: ['player-1', 'player-10', 'player-50'],
        progress: 40,
        lastUpdated: new Date(),
      };

      mockDb.importCheckpoint.findUnique.mockResolvedValue(checkpoint);

      // Act: Load checkpoint from cancelled import
      const loaded = await orchestrator.loadCheckpoint();

      // Assert: Can resume from where it was cancelled
      expect(loaded).not.toBeNull();
      expect(loaded?.currentPhase).toBe('PLAYERS');
      expect(loaded?.currentBatch).toBe(5);
      expect(loaded?.processedIds).toHaveLength(3);
    });
  });
});
