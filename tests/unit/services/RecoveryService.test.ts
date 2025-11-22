import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recoveryService } from '@/services/RecoveryService';

describe('RecoveryService', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('retryWithBackoff', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('retries an asynchronous operation until it succeeds', async () => {
      vi.useFakeTimers();

      const task = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValue('success');

      const promise = recoveryService.retryWithBackoff(task, 3);
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe('success');
      expect(task).toHaveBeenCalledTimes(2);
    });

    it('throws after exceeding the retry limit', async () => {
      vi.useFakeTimers();

      const task = vi
        .fn<[], Promise<void>>()
        .mockRejectedValue(new Error('fatal'));

      const promise = recoveryService.retryWithBackoff(task, 2);
      promise.catch(() => undefined);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('fatal');
      expect(task).toHaveBeenCalledTimes(2);
    });
  });

  it('reports successful error recovery', async () => {
    await expect(
      recoveryService.recoverFromError(new Error('boom'))
    ).resolves.toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Attempting recovery from error:',
      'boom'
    );
  });

  it('clears caches and resets state', () => {
    recoveryService.clearCache();
    recoveryService.resetState();

    expect(consoleSpy).toHaveBeenCalledWith('Clearing cache');
    expect(consoleSpy).toHaveBeenCalledWith('Resetting state');
  });
});
