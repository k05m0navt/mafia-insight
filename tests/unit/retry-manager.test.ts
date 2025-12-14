import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RetryManager,
  ErrorCategory,
} from '@/lib/gomafia/import/retry-manager';

describe('RetryManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('exponential backoff', () => {
    it('should retry with exponential backoff (1s, 2s, 4s)', async () => {
      const retryManager = new RetryManager(3); // 3 max attempts
      let attemptTimes: number[] = [];

      const operation = vi.fn().mockImplementation(async () => {
        attemptTimes.push(Date.now());
        throw new Error(`Network timeout - Attempt ${attemptTimes.length}`); // Transient error
      });

      const promise = retryManager.execute(operation);
      // Add catch handler to suppress unhandled rejection warning
      promise.catch(() => {});

      // Advance through all retries
      await vi.runAllTimersAsync();

      // Verify final failure after all attempts
      await expect(promise).rejects.toThrow('Network timeout');

      // Verify exponential backoff delays
      expect(operation).toHaveBeenCalledTimes(3);
      expect(attemptTimes[1] - attemptTimes[0]).toBeGreaterThanOrEqual(1000); // ~1s delay
      expect(attemptTimes[2] - attemptTimes[1]).toBeGreaterThanOrEqual(2000); // ~2s delay
    });

    it('should return successful result on first attempt', async () => {
      const retryManager = new RetryManager(3);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryManager.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should succeed after one retry', async () => {
      const retryManager = new RetryManager(3);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      const promise = retryManager.execute(operation);

      // Advance timers to allow retry
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('EC-001: Complete unavailability (5-minute wait)', () => {
    it('should wait 5 minutes on complete unavailability', async () => {
      const retryManager = new RetryManager(3, {
        completeUnavailabilityWait: 300000,
      }); // 5 minutes
      let attemptTimes: number[] = [];

      const operation = vi.fn().mockImplementation(async () => {
        attemptTimes.push(Date.now());
        if (attemptTimes.length === 1) {
          throw new Error('Connection refused');
        }
        return 'success';
      });

      const promise = retryManager.execute(operation, {
        isCompleteUnavailability: true,
      });

      // Advance through wait period
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);

      // Verify 5-minute delay
      expect(attemptTimes[1] - attemptTimes[0]).toBeGreaterThanOrEqual(300000);
    });
  });

  describe('retry metrics', () => {
    it('should track retry attempts', async () => {
      const retryManager = new RetryManager(3);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout')) // Transient error
        .mockResolvedValue('success');

      const promise = retryManager.execute(operation);

      await vi.runAllTimersAsync();
      await promise;

      const metrics = retryManager.getMetrics();
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.successfulRetries).toBe(1);
      expect(metrics.failedOperations).toBe(0);
    });

    it('should track failed operations after exhausting retries', async () => {
      const retryManager = new RetryManager(2);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout')) // Transient error
        .mockRejectedValueOnce(new Error('Network timeout')); // Transient error

      const promise = retryManager.execute(operation);
      // Add catch handler to suppress unhandled rejection warning
      promise.catch(() => {});

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      const metrics = retryManager.getMetrics();
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.successfulRetries).toBe(0);
      expect(metrics.failedOperations).toBe(1);
    });

    it('should reset metrics', async () => {
      const retryManager = new RetryManager(3);
      const operation = vi.fn().mockResolvedValue('success');

      await retryManager.execute(operation);

      let metrics = retryManager.getMetrics();
      expect(metrics.totalAttempts).toBe(1);

      retryManager.reset();
      metrics = retryManager.getMetrics();
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.successfulRetries).toBe(0);
      expect(metrics.failedOperations).toBe(0);
    });
  });

  describe('error classification', () => {
    it('should detect transient errors', () => {
      const retryManager = new RetryManager(3);

      expect(retryManager.isTransientError(new Error('Network timeout'))).toBe(
        true
      );
      expect(
        retryManager.isTransientError(new Error('Connection refused'))
      ).toBe(true);
      expect(retryManager.isTransientError(new Error('ECONNRESET'))).toBe(true);
      expect(retryManager.isTransientError(new Error('Request timeout'))).toBe(
        true
      );
    });

    it('should detect permanent errors', () => {
      const retryManager = new RetryManager(3);

      expect(retryManager.isTransientError(new Error('404 Not Found'))).toBe(
        false
      );
      expect(
        retryManager.isTransientError(new Error('Invalid data format'))
      ).toBe(false);
      expect(
        retryManager.isTransientError(new Error('Unauthorized access'))
      ).toBe(false);
    });

    it('should not retry permanent errors', async () => {
      const retryManager = new RetryManager(3);
      const operation = vi.fn().mockRejectedValue(new Error('404 Not Found'));

      await expect(retryManager.execute(operation)).rejects.toThrow(
        '404 Not Found'
      );

      expect(operation).toHaveBeenCalledTimes(1); // No retries for permanent errors
    });
  });

  describe('error categorization', () => {
    it('should correctly categorize transient errors', () => {
      const retryManager = new RetryManager(3);

      // Network errors
      let classification = retryManager.categorizeError(
        new Error('Network timeout')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('TIMEOUT');
      expect(classification.type).toBe('timeout');

      // Connection errors
      classification = retryManager.categorizeError(
        new Error('Connection refused')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('NETWORK_ERROR');
      expect(classification.type).toBe('network');

      // Rate limit errors
      classification = retryManager.categorizeError(
        new Error('Rate limit exceeded')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('RATE_LIMIT');
      expect(classification.type).toBe('rate_limit');

      // HTTP 5xx errors
      classification = retryManager.categorizeError(
        new Error('Server error 503')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('HTTP_503');
      expect(classification.type).toBe('network');

      // HTTP 502
      classification = retryManager.categorizeError(
        new Error('Bad gateway 502')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('HTTP_502');
      expect(classification.type).toBe('network');

      // HTTP 504
      classification = retryManager.categorizeError(
        new Error('Gateway timeout 504')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('HTTP_504');
      expect(classification.type).toBe('network');

      // HTTP 429
      classification = retryManager.categorizeError(
        new Error('Too many requests 429')
      );
      expect(classification.category).toBe(ErrorCategory.TRANSIENT);
      expect(classification.code).toBe('HTTP_429');
      expect(classification.type).toBe('rate_limit');
    });

    it('should correctly categorize permanent errors', () => {
      const retryManager = new RetryManager(3);

      // Validation errors
      let classification = retryManager.categorizeError(
        new Error('Validation error: missing required field')
      );
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('MISSING_REQUIRED_FIELD');
      expect(classification.type).toBe('validation');

      // Parse errors
      classification = retryManager.categorizeError(
        new Error('Parsing error: invalid JSON')
      );
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('PARSE_ERROR');
      expect(classification.type).toBe('parsing');

      // HTTP 4xx errors (except 429)
      classification = retryManager.categorizeError(new Error('Not found 404'));
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('HTTP_404');
      expect(classification.type).toBe('not_found');

      classification = retryManager.categorizeError(
        new Error('Bad request 400')
      );
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('HTTP_400');
      expect(classification.type).toBe('client_error');

      // Data format errors
      classification = retryManager.categorizeError(
        new Error('Invalid data format')
      );
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('DATA_ERROR');
      expect(classification.type).toBe('data_format');
    });

    it('should handle edge cases in error categorization', () => {
      const retryManager = new RetryManager(3);

      // Unknown errors default to permanent
      const classification = retryManager.categorizeError(
        new Error('Some unknown error')
      );
      expect(classification.category).toBe(ErrorCategory.PERMANENT);
      expect(classification.code).toBe('UNKNOWN_ERROR');
      expect(classification.type).toBe('unknown');

      // Error with Timeout in name
      const timeoutError = new Error('Custom timeout error');
      timeoutError.name = 'TimeoutError';
      const timeoutClassification = retryManager.categorizeError(timeoutError);
      expect(timeoutClassification.category).toBe(ErrorCategory.TRANSIENT);
      expect(timeoutClassification.code).toBe('NETWORK_ERROR');
      expect(timeoutClassification.type).toBe('network');

      // Error with Validation in name
      const validationError = new Error('Custom validation error');
      validationError.name = 'ValidationError';
      const validationClassification =
        retryManager.categorizeError(validationError);
      expect(validationClassification.category).toBe(ErrorCategory.PERMANENT);
      expect(validationClassification.code).toBe('VALIDATION_ERROR');
      expect(validationClassification.type).toBe('validation');
    });

    it('should log retry attempts with timestamps', async () => {
      const retryManager = new RetryManager(3);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const promise = retryManager.execute(operation);
      await vi.runAllTimersAsync();
      await promise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RetryManager] Retry attempt'),
        expect.objectContaining({
          error: 'Network timeout',
          category: ErrorCategory.TRANSIENT,
          delayMs: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should call onRetryAttempt callback when provided', async () => {
      const retryManager = new RetryManager(3);
      const onRetryAttempt = vi.fn();

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const promise = retryManager.execute(operation, {
        onRetryAttempt,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(onRetryAttempt).toHaveBeenCalledTimes(1);
      expect(onRetryAttempt).toHaveBeenCalledWith(
        1,
        expect.any(Error),
        expect.any(Number)
      );
    });
  });

  describe('max attempts', () => {
    it('should respect custom max attempts', async () => {
      const retryManager = new RetryManager(5); // 5 attempts
      const operation = vi.fn().mockRejectedValue(new Error('Network timeout')); // Transient error

      const promise = retryManager.execute(operation);
      // Add catch handler to suppress unhandled rejection warning
      promise.catch(() => {});

      // Advance through all retry attempts
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(5);
    });
  });

  describe('cancellation', () => {
    it('should support cancellation via AbortSignal', async () => {
      const retryManager = new RetryManager(3);
      const abortController = new AbortController();
      let callCount = 0;

      const operation = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Schedule cancellation after first failure
          setTimeout(() => abortController.abort(), 500);
          throw new Error('Network timeout'); // Transient error
        }
        return 'success';
      });

      const promise = retryManager.execute(operation, {
        signal: abortController.signal,
      });
      // Add catch handler to suppress unhandled rejection warning
      promise.catch(() => {});

      // Advance timers to trigger cancellation during retry wait
      await vi.runAllTimersAsync();

      // Should reject with cancellation error
      await expect(promise).rejects.toThrow('Operation cancelled');

      // Should only have attempted once before cancellation
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
