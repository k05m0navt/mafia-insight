import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should enforce minimum delay between calls', async () => {
    const limiter = new RateLimiter(1000); // 1 second

    const promise1 = limiter.wait();
    const promise2 = limiter.wait();

    // First call should resolve immediately
    await promise1;
    expect(limiter.getRequestCount()).toBe(1);

    // Second call should wait
    vi.advanceTimersByTime(999);
    expect(limiter.getRequestCount()).toBe(1); // Still waiting

    vi.advanceTimersByTime(1);
    await promise2;
    expect(limiter.getRequestCount()).toBe(2);

    vi.useRealTimers();
  });

  it('should track request count', async () => {
    const limiter = new RateLimiter(10);

    // First call
    await limiter.wait();
    expect(limiter.getRequestCount()).toBe(1);

    // Second call - needs to wait
    const promise2 = limiter.wait();
    vi.advanceTimersByTime(10);
    await promise2;
    expect(limiter.getRequestCount()).toBe(2);

    // Third call - needs to wait
    const promise3 = limiter.wait();
    vi.advanceTimersByTime(10);
    await promise3;
    expect(limiter.getRequestCount()).toBe(3);

    vi.useRealTimers();
  });

  it('should calculate average delay', async () => {
    const limiter = new RateLimiter(50);

    // First call - no delay
    await limiter.wait();

    // Second call - should wait 50ms
    const promise2 = limiter.wait();
    vi.advanceTimersByTime(50);
    await promise2;

    // Third call - should wait 50ms
    const promise3 = limiter.wait();
    vi.advanceTimersByTime(50);
    await promise3;

    const avgDelay = limiter.getAverageDelay();
    expect(avgDelay).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('should reset metrics', async () => {
    const limiter = new RateLimiter(50);

    // First call
    await limiter.wait();

    // Second call with delay
    const promise2 = limiter.wait();
    vi.advanceTimersByTime(50);
    await promise2;

    expect(limiter.getRequestCount()).toBe(2);

    limiter.reset();
    expect(limiter.getRequestCount()).toBe(0);
    expect(limiter.getAverageDelay()).toBe(0);

    vi.useRealTimers();
  });

  it('should not delay first request', async () => {
    const limiter = new RateLimiter(1000);

    const startTime = Date.now();
    await limiter.wait();
    const endTime = Date.now();

    // First request should be immediate (no delay)
    expect(endTime - startTime).toBeLessThan(100);

    vi.useRealTimers();
  });

  it('should handle rapid consecutive calls', async () => {
    const limiter = new RateLimiter(100);

    const calls = [
      limiter.wait(),
      limiter.wait(),
      limiter.wait(),
      limiter.wait(),
    ];

    vi.advanceTimersByTime(100);
    await calls[0];
    vi.advanceTimersByTime(100);
    await calls[1];
    vi.advanceTimersByTime(100);
    await calls[2];
    vi.advanceTimersByTime(100);
    await calls[3];

    expect(limiter.getRequestCount()).toBe(4);

    vi.useRealTimers();
  });

  it('should respect 2-second delay for production use', async () => {
    const limiter = new RateLimiter(2000); // Production setting

    const promise1 = limiter.wait();
    const promise2 = limiter.wait();

    await promise1;
    vi.advanceTimersByTime(1999);
    expect(limiter.getRequestCount()).toBe(1);

    vi.advanceTimersByTime(1);
    await promise2;
    expect(limiter.getRequestCount()).toBe(2);

    vi.useRealTimers();
  });
});
