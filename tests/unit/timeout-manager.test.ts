import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeoutManager } from '@/lib/gomafia/import/timeout-manager';

describe('TimeoutManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('12-hour timeout enforcement', () => {
    it('should track time elapsed since start', async () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000); // 12 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(5 * 60 * 60 * 1000); // 5 hours

      const elapsed = timeoutManager.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(5 * 60 * 60 * 1000);
      expect(elapsed).toBeLessThan(5 * 60 * 60 * 1000 + 100); // Allow small margin
    });

    it('should detect when timeout is exceeded', async () => {
      const timeoutManager = new TimeoutManager(2 * 60 * 60 * 1000); // 2 hours

      timeoutManager.start();

      // After 1 hour - not exceeded
      await vi.advanceTimersByTimeAsync(1 * 60 * 60 * 1000);
      expect(timeoutManager.isExceeded()).toBe(false);

      // After 2.5 hours - exceeded
      await vi.advanceTimersByTimeAsync(1.5 * 60 * 60 * 1000);
      expect(timeoutManager.isExceeded()).toBe(true);
    });

    it('should calculate remaining time', async () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000); // 12 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(3 * 60 * 60 * 1000); // 3 hours

      const remaining = timeoutManager.getRemaining();
      expect(remaining).toBeGreaterThanOrEqual(9 * 60 * 60 * 1000 - 100); // 9 hours
      expect(remaining).toBeLessThanOrEqual(9 * 60 * 60 * 1000);
    });

    it('should return 0 for remaining time when exceeded', async () => {
      const timeoutManager = new TimeoutManager(1 * 60 * 60 * 1000); // 1 hour

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000); // 2 hours

      const remaining = timeoutManager.getRemaining();
      expect(remaining).toBe(0);
    });

    it('should provide human-readable time remaining', async () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000); // 12 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(3 * 60 * 60 * 1000 + 30 * 60 * 1000); // 3.5 hours

      const formatted = timeoutManager.getFormattedRemaining();
      expect(formatted).toContain('8'); // ~8.5 hours remaining
      expect(formatted).toMatch(/\d+h \d+m/); // Format: "8h 30m"
    });
  });

  describe('timeout warnings', () => {
    it('should detect when approaching timeout (80% threshold)', async () => {
      const timeoutManager = new TimeoutManager(10 * 60 * 60 * 1000); // 10 hours

      timeoutManager.start();

      // At 7 hours - not approaching (70%)
      await vi.advanceTimersByTimeAsync(7 * 60 * 60 * 1000);
      expect(timeoutManager.isApproachingTimeout(0.8)).toBe(false);

      // At 8.5 hours - approaching (85%)
      await vi.advanceTimersByTimeAsync(1.5 * 60 * 60 * 1000);
      expect(timeoutManager.isApproachingTimeout(0.8)).toBe(true);
    });

    it('should provide custom warning thresholds', async () => {
      const timeoutManager = new TimeoutManager(10 * 60 * 60 * 1000); // 10 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(5 * 60 * 60 * 1000); // 5 hours (50%)

      expect(timeoutManager.isApproachingTimeout(0.4)).toBe(true); // 40% threshold
      expect(timeoutManager.isApproachingTimeout(0.6)).toBe(false); // 60% threshold
    });
  });

  describe('timeout metadata', () => {
    it('should provide timeout summary', async () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000); // 12 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000); // 4 hours

      const summary = timeoutManager.getSummary();

      expect(summary.maxDuration).toBe(12 * 60 * 60 * 1000);
      expect(summary.elapsed).toBeGreaterThanOrEqual(4 * 60 * 60 * 1000 - 100);
      expect(summary.remaining).toBeGreaterThanOrEqual(
        8 * 60 * 60 * 1000 - 100
      );
      expect(summary.exceeded).toBe(false);
      expect(summary.percentComplete).toBeCloseTo(33.33, 1);
    });

    it('should indicate exceeded in summary', async () => {
      const timeoutManager = new TimeoutManager(1 * 60 * 60 * 1000); // 1 hour

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000); // 2 hours

      const summary = timeoutManager.getSummary();

      expect(summary.exceeded).toBe(true);
      expect(summary.remaining).toBe(0);
      expect(summary.percentComplete).toBeGreaterThanOrEqual(100);
    });
  });

  describe('reset functionality', () => {
    it('should reset timer to initial state', async () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000); // 12 hours

      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(5 * 60 * 60 * 1000); // 5 hours

      expect(timeoutManager.getElapsed()).toBeGreaterThan(0);

      timeoutManager.reset();

      // After reset, timer is not started, so getElapsed should throw
      expect(() => timeoutManager.getElapsed()).toThrow(
        'TimeoutManager not started'
      );
    });

    it('should allow restart after reset', async () => {
      const timeoutManager = new TimeoutManager(2 * 60 * 60 * 1000); // 2 hours

      timeoutManager.start();
      await vi.advanceTimersByTimeAsync(1 * 60 * 60 * 1000); // 1 hour

      timeoutManager.reset();
      timeoutManager.start();

      await vi.advanceTimersByTimeAsync(30 * 60 * 1000); // 30 minutes

      const elapsed = timeoutManager.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(30 * 60 * 1000 - 100);
      expect(elapsed).toBeLessThan(1 * 60 * 60 * 1000); // Less than 1 hour
    });
  });

  describe('production timeout (12 hours)', () => {
    it('should use 12-hour default for production', () => {
      const timeoutManager = new TimeoutManager(); // Default 12 hours

      timeoutManager.start();

      const summary = timeoutManager.getSummary();
      expect(summary.maxDuration).toBe(12 * 60 * 60 * 1000);
    });

    it('should allow custom timeouts for testing', () => {
      const timeoutManager = new TimeoutManager(1000); // 1 second for testing

      timeoutManager.start();

      const summary = timeoutManager.getSummary();
      expect(summary.maxDuration).toBe(1000);
    });
  });

  describe('error scenarios', () => {
    it('should throw error if checking time before start', () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000);

      expect(() => timeoutManager.getElapsed()).toThrow(
        'TimeoutManager not started'
      );
    });

    it('should handle start being called multiple times', () => {
      const timeoutManager = new TimeoutManager(12 * 60 * 60 * 1000);

      timeoutManager.start();
      const firstStart = timeoutManager.getElapsed();

      // Calling start again should not reset
      timeoutManager.start();
      const secondStart = timeoutManager.getElapsed();

      expect(secondStart).toBeGreaterThanOrEqual(firstStart);
    });
  });
});
