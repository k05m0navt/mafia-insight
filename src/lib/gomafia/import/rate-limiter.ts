/**
 * Rate limiter for gomafia.pro API requests.
 * Enforces a minimum delay between requests to respect API rate limits.
 *
 * Production usage: 2000ms (2 seconds) between requests = 30 requests/minute
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private totalDelay: number = 0;

  /**
   * @param minDelayMs Minimum delay in milliseconds between requests (default: 2000ms)
   */
  constructor(private minDelayMs: number = 2000) {}

  /**
   * Wait for the appropriate delay before allowing the next request.
   * First request has no delay.
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelayMs - timeSinceLastRequest);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      this.totalDelay += delay;
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Get the total number of requests processed.
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Get the average delay per request in milliseconds.
   */
  getAverageDelay(): number {
    return this.requestCount > 0 ? this.totalDelay / this.requestCount : 0;
  }

  /**
   * Reset all metrics (useful for testing or starting a new batch).
   */
  reset(): void {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.totalDelay = 0;
  }

  /**
   * Get metrics for monitoring and reporting.
   */
  getMetrics() {
    return {
      requestCount: this.requestCount,
      totalDelay: this.totalDelay,
      averageDelay: this.getAverageDelay(),
      minDelayMs: this.minDelayMs,
    };
  }
}
