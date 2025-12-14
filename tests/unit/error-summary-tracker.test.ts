import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorSummaryTracker } from '@/lib/gomafia/import/error-summary-tracker';
import { ErrorCategory } from '@/lib/gomafia/import/retry-manager';
import type { ImportPhase } from '@/lib/gomafia/import/import-orchestrator';

describe('ErrorSummaryTracker', () => {
  let tracker: ErrorSummaryTracker;

  beforeEach(() => {
    tracker = new ErrorSummaryTracker();
  });

  describe('recordError', () => {
    it('should record an error with all details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      tracker.recordError(
        error,
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network',
        {
          entityId: 'entity-1',
          entityType: 'club',
        }
      );

      const summary = tracker.getSummary();
      expect(summary.totalErrors).toBe(1);
      expect(summary.errorsByCategory.transient).toBe(1);
      expect(summary.errorsByCategory.permanent).toBe(0);
      expect(summary.errorsByType.network).toBe(1);
    });

    it('should record errors with different categories', () => {
      tracker.recordError(
        new Error('Transient error'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'TIMEOUT',
        'timeout'
      );

      tracker.recordError(
        new Error('Permanent error'),
        'PLAYERS',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );

      const summary = tracker.getSummary();
      expect(summary.totalErrors).toBe(2);
      expect(summary.errorsByCategory.transient).toBe(1);
      expect(summary.errorsByCategory.permanent).toBe(1);
      expect(summary.errorsByType.timeout).toBe(1);
      expect(summary.errorsByType.validation).toBe(1);
    });
  });

  describe('recordSkippedEntity', () => {
    it('should track skipped entities by phase', () => {
      tracker.recordSkippedEntity('CLUBS');
      tracker.recordSkippedEntity('CLUBS');
      tracker.recordSkippedEntity('PLAYERS');

      const summary = tracker.getSummary();
      expect(summary.skippedEntitiesByPhase.CLUBS).toBe(2);
      expect(summary.skippedEntitiesByPhase.PLAYERS).toBe(1);
    });
  });

  describe('getSummary', () => {
    it('should return accurate error summary', () => {
      // Record various errors
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network'
      );
      tracker.recordError(
        new Error('Error 2'),
        'PLAYERS',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );
      tracker.recordError(
        new Error('Error 3'),
        'GAMES',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );

      tracker.recordSkippedEntity('CLUBS');
      tracker.recordSkippedEntity('PLAYERS');

      const summary = tracker.getSummary();

      expect(summary.totalErrors).toBe(3);
      expect(summary.errorsByCategory.transient).toBe(1);
      expect(summary.errorsByCategory.permanent).toBe(2);
      expect(summary.errorsByType.network).toBe(1);
      expect(summary.errorsByType.validation).toBe(2);
      expect(summary.skippedEntitiesByPhase.CLUBS).toBe(1);
      expect(summary.skippedEntitiesByPhase.PLAYERS).toBe(1);
      expect(summary.recentErrors.length).toBe(3);
    });

    it('should limit recent errors to last 50', () => {
      // Record 60 errors
      for (let i = 0; i < 60; i++) {
        tracker.recordError(
          new Error(`Error ${i}`),
          'CLUBS',
          ErrorCategory.TRANSIENT,
          'NETWORK_ERROR',
          'network'
        );
      }

      const summary = tracker.getSummary();
      expect(summary.totalErrors).toBe(60);
      expect(summary.recentErrors.length).toBe(50); // Should be limited to 50
      expect(summary.recentErrors[0].message).toBe('Error 10'); // First of last 50
      expect(summary.recentErrors[49].message).toBe('Error 59'); // Last error
    });
  });

  describe('getSummaryMessage', () => {
    it('should generate message for successful import', () => {
      const message = tracker.getSummaryMessage();
      expect(message).toBe('Import completed successfully with no errors.');
    });

    it('should generate message with error count', () => {
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network'
      );
      tracker.recordError(
        new Error('Error 2'),
        'PLAYERS',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );

      const message = tracker.getSummaryMessage();
      expect(message).toBe(
        'Import completed with 2 errors. 0 entities skipped.'
      );
    });

    it('should generate message with skipped entities', () => {
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );
      tracker.recordSkippedEntity('CLUBS');
      tracker.recordSkippedEntity('PLAYERS');

      const message = tracker.getSummaryMessage();
      expect(message).toBe(
        'Import completed with 1 error. 2 entities skipped.'
      );
    });

    it('should handle singular vs plural correctly', () => {
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network'
      );
      tracker.recordSkippedEntity('CLUBS');

      const message = tracker.getSummaryMessage();
      expect(message).toBe('Import completed with 1 error. 1 entity skipped.');
    });
  });

  describe('reset', () => {
    it('should clear all tracked errors and skipped entities', () => {
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network'
      );
      tracker.recordSkippedEntity('CLUBS');

      tracker.reset();

      const summary = tracker.getSummary();
      expect(summary.totalErrors).toBe(0);
      expect(summary.errorsByCategory.transient).toBe(0);
      expect(summary.errorsByCategory.permanent).toBe(0);
      expect(Object.keys(summary.skippedEntitiesByPhase).length).toBe(0);
      expect(summary.recentErrors.length).toBe(0);
    });
  });

  describe('getAllErrors', () => {
    it('should return all recorded errors', () => {
      tracker.recordError(
        new Error('Error 1'),
        'CLUBS',
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        'network',
        { entityId: 'entity-1' }
      );
      tracker.recordError(
        new Error('Error 2'),
        'PLAYERS',
        ErrorCategory.PERMANENT,
        'VALIDATION_ERROR',
        'validation'
      );

      const allErrors = tracker.getAllErrors();
      expect(allErrors.length).toBe(2);
      expect(allErrors[0].message).toBe('Error 1');
      expect(allErrors[0].entityId).toBe('entity-1');
      expect(allErrors[1].message).toBe('Error 2');
    });
  });
});
