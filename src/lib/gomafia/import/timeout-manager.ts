/**
 * Timeout Manager
 *
 * Enforces maximum duration limit for import operations.
 * Default: 12 hours maximum duration to prevent runaway imports.
 */

export interface TimeoutSummary {
  maxDuration: number;
  elapsed: number;
  remaining: number;
  exceeded: boolean;
  percentComplete: number;
}

/**
 * Manages timeout enforcement for long-running import operations.
 */
export class TimeoutManager {
  private startTime: number | null = null;
  private readonly maxDuration: number;

  constructor(maxDuration: number = 12 * 60 * 60 * 1000) {
    // Default 12 hours
    this.maxDuration = maxDuration;
  }

  /**
   * Start the timeout timer.
   */
  start(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
  }

  /**
   * Get elapsed time since start in milliseconds.
   * @throws Error if timer not started
   */
  getElapsed(): number {
    if (this.startTime === null) {
      throw new Error('TimeoutManager not started');
    }
    return Date.now() - this.startTime;
  }

  /**
   * Check if timeout has been exceeded.
   * @throws Error if timer not started
   */
  isExceeded(): boolean {
    return this.getElapsed() >= this.maxDuration;
  }

  /**
   * Get remaining time in milliseconds.
   * Returns 0 if timeout exceeded.
   * @throws Error if timer not started
   */
  getRemaining(): number {
    const remaining = this.maxDuration - this.getElapsed();
    return Math.max(0, remaining);
  }

  /**
   * Get remaining time formatted as human-readable string.
   * Format: "Xh Ym"
   * @throws Error if timer not started
   */
  getFormattedRemaining(): string {
    const remainingMs = this.getRemaining();

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    return `${hours}h ${minutes}m`;
  }

  /**
   * Check if approaching timeout based on threshold.
   * @param threshold Percentage threshold (0-1), e.g., 0.8 for 80%
   * @throws Error if timer not started
   */
  isApproachingTimeout(threshold: number = 0.8): boolean {
    const elapsed = this.getElapsed();
    return elapsed >= this.maxDuration * threshold;
  }

  /**
   * Get comprehensive timeout summary.
   * @throws Error if timer not started
   */
  getSummary(): TimeoutSummary {
    const elapsed = this.getElapsed();
    const remaining = this.getRemaining();
    const exceeded = this.isExceeded();
    const percentComplete = Math.min(100, (elapsed / this.maxDuration) * 100);

    return {
      maxDuration: this.maxDuration,
      elapsed,
      remaining,
      exceeded,
      percentComplete,
    };
  }

  /**
   * Reset the timeout manager to initial state.
   */
  reset(): void {
    this.startTime = null;
  }
}
