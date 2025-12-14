import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { ErrorCategory } from '@/lib/gomafia/import/retry-manager';
import { ErrorSummaryTracker } from '@/lib/gomafia/import/error-summary-tracker';

const { resilientExecuteMock } = vi.hoisted(() => ({
  resilientExecuteMock: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: (fn: (db: any) => unknown) => resilientExecuteMock(fn),
  },
}));

// Mock Playwright Browser
const mockBrowser = {
  close: vi.fn(),
} as unknown as Browser;

describe('Import Error Handling Integration', () => {
  let orchestrator: ImportOrchestrator;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      syncLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        update: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue({
          id: 'log-1',
          errors: null,
        }),
      },
      syncStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
      skippedEntity: {
        create: vi.fn().mockResolvedValue({ id: 'skipped-1' }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      importCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      game: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      player: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      tournament: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gameParticipation: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      playerTournament: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      club: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };

    (PrismaClient as any).mockImplementation(() => mockDb);
    resilientExecuteMock.mockImplementation((fn) => fn(mockDb));
    orchestrator = new ImportOrchestrator(mockDb, mockBrowser);
  });

  describe('Transient Error Handling', () => {
    it('should retry transient errors and complete import successfully', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network timeout');
        }
        return { id: 'entity-1', data: 'success' };
      });

      orchestrator.setPhase('CLUBS');
      await orchestrator.start();

      const result = await orchestrator.executeWithErrorHandling(operation, {
        entityType: 'club',
        entityId: 'club-1',
        phase: 'CLUBS',
      });

      expect(result).not.toBeNull();
      expect(result?.data).toBe('success');
      expect(attemptCount).toBe(3); // Should retry 2 times (3 total attempts)
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should log retry attempts with timestamps', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let attemptCount = 0;

      const operation = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Connection refused');
        }
        return { id: 'entity-1' };
      });

      orchestrator.setPhase('PLAYERS');
      await orchestrator.start();

      await orchestrator.executeWithErrorHandling(operation, {
        entityType: 'player',
        entityId: 'player-1',
        phase: 'PLAYERS',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RetryManager] Retry attempt'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should record failed retries in error summary', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network timeout'));

      orchestrator.setPhase('GAMES');
      await orchestrator.start();

      const result = await orchestrator.executeWithErrorHandling(operation, {
        entityType: 'game',
        entityId: 'game-1',
        phase: 'GAMES',
      });

      expect(result).toBeNull(); // Should fail after all retries

      const errors = orchestrator.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.willRetry)).toBe(true);
    });
  });

  describe('Permanent Error Handling', () => {
    it('should skip permanent errors and continue processing', async () => {
      const permanentError = new Error(
        'Validation error: missing required field'
      );
      const operation = vi.fn().mockRejectedValue(permanentError);

      orchestrator.setPhase('TOURNAMENTS');
      await orchestrator.start();

      const result = await orchestrator.executeWithErrorHandling(operation, {
        entityType: 'tournament',
        entityId: 'tournament-1',
        phase: 'TOURNAMENTS',
      });

      expect(result).toBeNull(); // Should return null for permanent errors
      expect(operation).toHaveBeenCalledTimes(1); // No retries for permanent errors

      // Should record in SkippedEntity
      expect(mockDb.skippedEntity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phase: 'TOURNAMENTS',
            entityType: 'tournament',
            entityId: 'tournament-1',
            errorCode: expect.any(String),
            errorMessage: permanentError.message,
            status: 'PENDING',
          }),
        })
      );
    });

    it('should log permanent errors with full context', async () => {
      const permanentError = new Error('Invalid data format');
      const operation = vi.fn().mockRejectedValue(permanentError);

      orchestrator.setPhase('CLUBS');
      await orchestrator.start();

      await orchestrator.executeWithErrorHandling(operation, {
        entityType: 'club',
        entityId: 'club-1',
        phase: 'CLUBS',
      });

      const errors = orchestrator.getErrors();
      const error = errors.find((e) => e.message === permanentError.message);

      expect(error).toBeDefined();
      expect(error?.context?.entityId).toBe('club-1');
      expect(error?.context?.entityType).toBe('club');
      expect(error?.willRetry).toBe(false); // Permanent errors don't retry
    });
  });

  describe('Mixed Error Handling', () => {
    it('should handle both transient and permanent errors correctly', async () => {
      const operations = [
        // Transient error - should retry and succeed
        vi
          .fn()
          .mockRejectedValueOnce(new Error('Network timeout'))
          .mockResolvedValue({ id: '1' }),
        // Permanent error - should skip
        vi
          .fn()
          .mockRejectedValue(new Error('Validation error: invalid format')),
        // Success - should process
        vi.fn().mockResolvedValue({ id: '3' }),
      ];

      orchestrator.setPhase('PLAYERS');
      await orchestrator.start();

      const results = await Promise.all([
        orchestrator.executeWithErrorHandling(operations[0], {
          entityType: 'player',
          entityId: 'player-1',
          phase: 'PLAYERS',
        }),
        orchestrator.executeWithErrorHandling(operations[1], {
          entityType: 'player',
          entityId: 'player-2',
          phase: 'PLAYERS',
        }),
        orchestrator.executeWithErrorHandling(operations[2], {
          entityType: 'player',
          entityId: 'player-3',
          phase: 'PLAYERS',
        }),
      ]);

      // First should succeed after retry
      expect(results[0]).not.toBeNull();
      expect(operations[0]).toHaveBeenCalledTimes(2);

      // Second should be skipped (permanent error)
      expect(results[1]).toBeNull();
      expect(operations[1]).toHaveBeenCalledTimes(1); // No retries

      // Third should succeed
      expect(results[2]).not.toBeNull();
      expect(operations[2]).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Summary Tracking', () => {
    it('should track error counts and summaries accurately', async () => {
      orchestrator.setPhase('CLUBS');
      await orchestrator.start();

      // Create mix of errors
      await orchestrator.executeWithErrorHandling(
        vi.fn().mockRejectedValue(new Error('Network timeout')),
        { entityType: 'club', entityId: 'club-1', phase: 'CLUBS' }
      );

      await orchestrator.executeWithErrorHandling(
        vi.fn().mockRejectedValue(new Error('Validation error')),
        { entityType: 'club', entityId: 'club-2', phase: 'CLUBS' }
      );

      const errorSummary = orchestrator.getErrorSummary();

      expect(errorSummary.totalErrors).toBeGreaterThan(0);
      expect(errorSummary.errorsByPhase.CLUBS).toBeGreaterThan(0);
    });

    it('should store error summary in SyncLog.errors', async () => {
      orchestrator.setPhase('GAMES');
      await orchestrator.start();

      await orchestrator.executeWithErrorHandling(
        vi.fn().mockRejectedValue(new Error('Test error')),
        { entityType: 'game', entityId: 'game-1', phase: 'GAMES' }
      );

      await orchestrator.complete(true);

      expect(mockDb.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log-1' },
          data: expect.objectContaining({
            errors: expect.objectContaining({
              errorSummary: expect.objectContaining({
                totalErrors: expect.any(Number),
              }),
            }),
          }),
        })
      );
    });

    it('should generate error summary message correctly', async () => {
      orchestrator.setPhase('TOURNAMENTS');
      await orchestrator.start();

      // Create errors
      await orchestrator.executeWithErrorHandling(
        vi.fn().mockRejectedValue(new Error('Error 1')),
        { entityType: 'tournament', entityId: 't1', phase: 'TOURNAMENTS' }
      );

      await orchestrator.executeWithErrorHandling(
        vi.fn().mockRejectedValue(new Error('Error 2')),
        { entityType: 'tournament', entityId: 't2', phase: 'TOURNAMENTS' }
      );

      await orchestrator.complete(true);

      // Verify error summary is stored
      const updateCall = mockDb.syncLog.update.mock.calls.find(
        (call: any[]) => call[0].where.id === 'log-1'
      );

      expect(updateCall).toBeDefined();
      const errorData = updateCall[0].data.errors;
      expect(errorData).toHaveProperty('errorSummary');
      expect(errorData.errorSummary.totalErrors).toBeGreaterThan(0);
    });
  });
});
