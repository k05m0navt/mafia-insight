import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryManager } from '@/lib/gomafia/import/retry-manager';

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
