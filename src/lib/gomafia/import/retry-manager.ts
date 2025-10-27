/**
 * Retry Manager
 *
 * Provides automatic retry logic with exponential backoff for transient failures.
 * Implements special handling for complete unavailability (EC-001) with 5-minute wait.
 */

export interface RetryOptions {
  signal?: AbortSignal;
  isCompleteUnavailability?: boolean;
}

export interface RetryManagerOptions {
  completeUnavailabilityWait?: number; // milliseconds
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedOperations: number;
}

/**
 * Manages retry logic with exponential backoff for import operations.
 */
export class RetryManager {
  private totalAttempts: number = 0;
  private successfulRetries: number = 0;
  private failedOperations: number = 0;
  private readonly completeUnavailabilityWait: number;

  constructor(
    private maxAttempts: number = 3,
    options: RetryManagerOptions = {}
  ) {
    this.completeUnavailabilityWait =
      options.completeUnavailabilityWait || 300000; // 5 minutes default
  }

  /**
   * Execute an operation with automatic retry on transient failures.
   *
   * @param operation Function to execute
   * @param options Retry options including cancellation signal
   * @returns Result of the operation
   * @throws Error if all retry attempts fail or operation is cancelled
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      // Check for cancellation
      if (options.signal?.aborted) {
        throw new Error('Operation cancelled');
      }

      this.totalAttempts++;
      attempt++;

      try {
        const result = await operation();

        // Track successful retry (if not first attempt)
        if (attempt > 1) {
          this.successfulRetries++;
        }

        return result;
      } catch (error: any) {
        lastError = error;

        // Don't retry permanent errors
        if (!this.isTransientError(error)) {
          this.failedOperations++;
          throw error;
        }

        // If this was the last attempt, fail
        if (attempt >= this.maxAttempts) {
          this.failedOperations++;
          throw lastError;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoff(
          attempt,
          options.isCompleteUnavailability
        );

        // Wait before retry
        await this.delay(delay, options.signal);
      }
    }

    // This should never be reached, but TypeScript needs it
    this.failedOperations++;
    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * Check if an error is transient (retryable).
   */
  isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network-related transient errors
    const transientPatterns = [
      'network timeout',
      'connection refused',
      'econnreset',
      'econnrefused',
      'etimedout',
      'request timeout',
      'socket hang up',
      'temporary failure',
      '503',
      '502',
      '504',
      'getaddrinfo enotfound',
    ];

    return transientPatterns.some((pattern) => message.includes(pattern));
  }

  /**
   * Calculate backoff delay using exponential backoff.
   *
   * @param attempt Current attempt number (1-indexed)
   * @param isCompleteUnavailability Special case for complete unavailability (EC-001)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(
    attempt: number,
    isCompleteUnavailability?: boolean
  ): number {
    // EC-001: Complete unavailability - wait 5 minutes
    if (isCompleteUnavailability) {
      return this.completeUnavailabilityWait;
    }

    // Standard exponential backoff: 1s, 2s, 4s, 8s, ...
    return Math.pow(2, attempt - 1) * 1000;
  }

  /**
   * Delay for a specified duration, supporting cancellation.
   */
  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Operation cancelled'));
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);

      const onAbort = () => {
        cleanup();
        reject(new Error('Operation cancelled'));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
      };

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  /**
   * Get current retry metrics.
   */
  getMetrics(): RetryMetrics {
    return {
      totalAttempts: this.totalAttempts,
      successfulRetries: this.successfulRetries,
      failedOperations: this.failedOperations,
    };
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this.totalAttempts = 0;
    this.successfulRetries = 0;
    this.failedOperations = 0;
  }
}
