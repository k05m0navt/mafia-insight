import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock Playwright Browser
const mockBrowser = {
  close: vi.fn(),
} as unknown as Browser;

describe('ImportOrchestrator - Error Handling', () => {
  let orchestrator: ImportOrchestrator;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      syncLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        update: vi.fn().mockResolvedValue({}),
      },
      syncStatus: {
        upsert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
      importCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      // Mocks for IntegrityChecker (used in complete() method)
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
    };

    (PrismaClient as any).mockImplementation(() => mockDb);
    orchestrator = new ImportOrchestrator(mockDb, mockBrowser);
  });

  describe('logError', () => {
    it('should log an error without throwing', () => {
      const error = new Error('Test error');

      expect(() => {
        orchestrator.logError(error, 'EC-001', {
          batchIndex: 1,
          entityId: 'test-entity',
        });
      }).not.toThrow();

      const errors = orchestrator.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('EC-001');
      expect(errors[0].message).toBe('Test error');
    });

    it('should include context in error log', () => {
      const error = new Error('Context test');
      orchestrator.setPhase('CLUBS');

      orchestrator.logError(error, 'EC-002', {
        batchIndex: 2,
        entityId: 'club-123',
        entityType: 'Club',
        operation: 'scrape',
      });

      const errors = orchestrator.getErrors();
      expect(errors[0].phase).toBe('CLUBS');
      expect(errors[0].context?.batchIndex).toBe(2);
      expect(errors[0].context?.entityId).toBe('club-123');
      expect(errors[0].context?.entityType).toBe('Club');
      expect(errors[0].context?.operation).toBe('scrape');
    });

    it('should track retry status', () => {
      const error = new Error('Retry test');

      orchestrator.logError(error, 'EC-003', undefined, true);
      const errors = orchestrator.getErrors();

      expect(errors[0].willRetry).toBe(true);
    });

    it('should log multiple errors independently', () => {
      orchestrator.logError(new Error('Error 1'), 'EC-001');
      orchestrator.logError(new Error('Error 2'), 'EC-002');
      orchestrator.logError(new Error('Error 3'), 'EC-001');

      const errors = orchestrator.getErrors();
      expect(errors).toHaveLength(3);
    });
  });

  describe('getErrors', () => {
    it('should return empty array when no errors logged', () => {
      const errors = orchestrator.getErrors();
      expect(errors).toEqual([]);
    });

    it('should return a copy of error logs', () => {
      orchestrator.logError(new Error('Test'), 'EC-001');
      const errors1 = orchestrator.getErrors();
      const errors2 = orchestrator.getErrors();

      expect(errors1).not.toBe(errors2); // Different references
      expect(errors1).toEqual(errors2); // Same content
    });
  });

  describe('getErrorSummary', () => {
    beforeEach(() => {
      // Log various errors across different phases
      orchestrator.setPhase('CLUBS');
      orchestrator.logError(
        new Error('Club error 1'),
        'EC-001',
        undefined,
        false
      );
      orchestrator.logError(
        new Error('Club error 2'),
        'EC-002',
        undefined,
        true
      );

      orchestrator.setPhase('PLAYERS');
      orchestrator.logError(
        new Error('Player error 1'),
        'EC-001',
        undefined,
        false
      );
      orchestrator.logError(
        new Error('Player error 2'),
        'EC-003',
        undefined,
        false
      );

      orchestrator.setPhase('TOURNAMENTS');
      orchestrator.logError(
        new Error('Tournament error'),
        'EC-001',
        undefined,
        true
      );
    });

    it('should count total errors correctly', () => {
      const summary = orchestrator.getErrorSummary();
      expect(summary.totalErrors).toBe(5);
    });

    it('should group errors by phase', () => {
      const summary = orchestrator.getErrorSummary();
      expect(summary.errorsByPhase.CLUBS).toBe(2);
      expect(summary.errorsByPhase.PLAYERS).toBe(2);
      expect(summary.errorsByPhase.TOURNAMENTS).toBe(1);
      expect(summary.errorsByPhase.GAMES).toBe(0);
    });

    it('should group errors by code', () => {
      const summary = orchestrator.getErrorSummary();
      expect(summary.errorsByCode['EC-001']).toBe(3);
      expect(summary.errorsByCode['EC-002']).toBe(1);
      expect(summary.errorsByCode['EC-003']).toBe(1);
    });

    it('should count critical vs retried errors', () => {
      const summary = orchestrator.getErrorSummary();
      expect(summary.criticalErrors).toBe(3); // willRetry = false
      expect(summary.retriedErrors).toBe(2); // willRetry = true
    });
  });

  describe('setPhase', () => {
    it('should set current phase', () => {
      orchestrator.setPhase('TOURNAMENTS');
      orchestrator.logError(new Error('Test'), 'EC-001');

      const errors = orchestrator.getErrors();
      expect(errors[0].phase).toBe('TOURNAMENTS');
    });

    it('should update phase for subsequent errors', () => {
      orchestrator.setPhase('CLUBS');
      orchestrator.logError(new Error('Club error'), 'EC-001');

      orchestrator.setPhase('PLAYERS');
      orchestrator.logError(new Error('Player error'), 'EC-002');

      const errors = orchestrator.getErrors();
      expect(errors[0].phase).toBe('CLUBS');
      expect(errors[1].phase).toBe('PLAYERS');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await orchestrator.withErrorHandling(operation, 'EC-001', {
        operation: 'test',
      });

      expect(result).toBe('success');
      expect(orchestrator.getErrors()).toHaveLength(0);
    });

    it('should catch error and return null', async () => {
      const operation = vi
        .fn()
        .mockRejectedValue(new Error('Operation failed'));

      const result = await orchestrator.withErrorHandling(operation, 'EC-001', {
        operation: 'test',
      });

      expect(result).toBeNull();
      expect(orchestrator.getErrors()).toHaveLength(1);
      expect(orchestrator.getErrors()[0].code).toBe('EC-001');
    });

    it('should log error with context', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      orchestrator.setPhase('GAMES');

      await orchestrator.withErrorHandling(operation, 'EC-GAME-001', {
        batchIndex: 5,
        entityId: 'game-789',
        entityType: 'Game',
        operation: 'save',
      });

      const errors = orchestrator.getErrors();
      expect(errors[0].phase).toBe('GAMES');
      expect(errors[0].context?.batchIndex).toBe(5);
      expect(errors[0].context?.entityId).toBe('game-789');
    });

    it('should allow operation to continue after error', async () => {
      const op1 = vi.fn().mockRejectedValue(new Error('Fail 1'));
      const op2 = vi.fn().mockResolvedValue('success');

      const result1 = await orchestrator.withErrorHandling(op1, 'EC-001');
      const result2 = await orchestrator.withErrorHandling(op2, 'EC-002');

      expect(result1).toBeNull();
      expect(result2).toBe('success');
      expect(orchestrator.getErrors()).toHaveLength(1);
    });
  });

  describe('complete - error reporting', () => {
    it('should include error summary in sync log on failure', async () => {
      await orchestrator.start();

      orchestrator.logError(new Error('Critical error'), 'EC-001');
      orchestrator.logError(new Error('Another error'), 'EC-002');

      await orchestrator.complete(false);

      expect(mockDb.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log-1' },
          data: expect.objectContaining({
            status: 'FAILED',
            errors: expect.objectContaining({
              message: 'Import failed',
              errorSummary: expect.objectContaining({
                totalErrors: 2,
                criticalErrors: 2,
              }),
            }),
          }),
        })
      );
    });

    it('should include error summary on success with non-critical errors', async () => {
      await orchestrator.start();

      orchestrator.logError(
        new Error('Minor error'),
        'EC-WARN-001',
        undefined,
        true
      );

      await orchestrator.complete(true);

      expect(mockDb.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log-1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            errors: expect.objectContaining({
              message: 'Import completed with non-critical errors',
              errorSummary: expect.objectContaining({
                totalErrors: 1,
                retriedErrors: 1,
              }),
            }),
          }),
        })
      );
    });
  });
});
