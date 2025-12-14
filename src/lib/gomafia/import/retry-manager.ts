/**
 * Retry Manager
 *
 * Provides automatic retry logic with exponential backoff for transient failures.
 * Implements special handling for complete unavailability (EC-001) with 5-minute wait.
 */

/**
 * Error category classification
 */
export enum ErrorCategory {
  TRANSIENT = 'TRANSIENT',
  PERMANENT = 'PERMANENT',
}

/**
 * Error classification result with category and code
 */
export interface ErrorClassification {
  category: ErrorCategory;
  code: string;
  type: string;
}

export interface RetryOptions {
  signal?: AbortSignal;
  isCompleteUnavailability?: boolean;
  onRetryAttempt?: (attempt: number, error: Error, delay: number) => void;
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
      } catch (error: unknown) {
        lastError = error as Error;

        // Don't retry permanent errors
        if (!this.isTransientError(error as Error)) {
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

        // Log retry attempt with timestamp
        const classification = this.categorizeError(error as Error);
        const timestamp = new Date().toISOString();
        console.log(
          `[RetryManager] Retry attempt ${attempt}/${this.maxAttempts} at ${timestamp}`,
          {
            error: (error as Error).message,
            category: classification.category,
            code: classification.code,
            type: classification.type,
            delayMs: delay,
          }
        );

        // Call retry callback if provided
        if (options.onRetryAttempt) {
          options.onRetryAttempt(attempt, error as Error, delay);
        }

        // Wait before retry
        await this.delay(delay, options.signal);
      }
    }

    // This should never be reached, but TypeScript needs it
    this.failedOperations++;
    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * Categorize an error as transient or permanent.
   * Returns category, classification code, and error type.
   */
  categorizeError(error: Error): ErrorClassification {
    const message = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Check for HTTP status codes in error message
    const httpStatusMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
    const httpStatus = httpStatusMatch
      ? parseInt(httpStatusMatch[1], 10)
      : null;

    // Transient errors: network issues, timeouts, rate limits, server errors
    const transientPatterns = [
      'network timeout',
      'connection refused',
      'econnreset',
      'econnrefused',
      'etimedout',
      'request timeout',
      'socket hang up',
      'temporary failure',
      'getaddrinfo enotfound',
      'timeout', // Playwright timeouts (page.goto: Timeout, etc.)
      'exceeded', // Timeout exceeded errors
      'rate limit',
      'too many requests',
      'service unavailable',
      'bad gateway',
      'gateway timeout',
    ];

    // Permanent errors: validation, parsing, data format, client errors
    const permanentPatterns = [
      'validation error',
      'invalid data',
      'parsing error',
      'parse error',
      'schema validation',
      'missing required',
      'invalid format',
      'type error',
      'not found',
      'unauthorized',
      'forbidden',
    ];

    // Check HTTP status codes
    if (httpStatus) {
      if (
        httpStatus >= 500 ||
        httpStatus === 502 ||
        httpStatus === 503 ||
        httpStatus === 504
      ) {
        return {
          category: ErrorCategory.TRANSIENT,
          code: `HTTP_${httpStatus}`,
          type: 'network',
        };
      }
      if (httpStatus === 429) {
        return {
          category: ErrorCategory.TRANSIENT,
          code: 'HTTP_429',
          type: 'rate_limit',
        };
      }
      if (httpStatus >= 400 && httpStatus < 500) {
        return {
          category: ErrorCategory.PERMANENT,
          code: `HTTP_${httpStatus}`,
          type: httpStatus === 404 ? 'not_found' : 'client_error',
        };
      }
    }

    // Check error name patterns
    if (
      errorName.includes('timeout') ||
      errorName.includes('network') ||
      errorName.includes('connection')
    ) {
      return {
        category: ErrorCategory.TRANSIENT,
        code: 'NETWORK_ERROR',
        type: 'network',
      };
    }

    if (errorName.includes('validation') || errorName.includes('parse')) {
      return {
        category: ErrorCategory.PERMANENT,
        code: 'VALIDATION_ERROR',
        type: 'validation',
      };
    }

    // Check message patterns for transient errors
    if (transientPatterns.some((pattern) => message.includes(pattern))) {
      // Determine specific type
      if (
        message.includes('rate limit') ||
        message.includes('too many requests')
      ) {
        return {
          category: ErrorCategory.TRANSIENT,
          code: 'RATE_LIMIT',
          type: 'rate_limit',
        };
      }
      if (message.includes('timeout') || message.includes('exceeded')) {
        return {
          category: ErrorCategory.TRANSIENT,
          code: 'TIMEOUT',
          type: 'timeout',
        };
      }
      return {
        category: ErrorCategory.TRANSIENT,
        code: 'NETWORK_ERROR',
        type: 'network',
      };
    }

    // Check message patterns for permanent errors (order matters - check specific before general)
    if (message.includes('missing required')) {
      return {
        category: ErrorCategory.PERMANENT,
        code: 'MISSING_REQUIRED_FIELD',
        type: 'validation',
      };
    }
    if (message.includes('parse') || message.includes('parsing')) {
      return {
        category: ErrorCategory.PERMANENT,
        code: 'PARSE_ERROR',
        type: 'parsing',
      };
    }
    if (message.includes('validation') || message.includes('schema')) {
      return {
        category: ErrorCategory.PERMANENT,
        code: 'VALIDATION_ERROR',
        type: 'validation',
      };
    }
    if (permanentPatterns.some((pattern) => message.includes(pattern))) {
      return {
        category: ErrorCategory.PERMANENT,
        code: 'DATA_ERROR',
        type: 'data_format',
      };
    }

    // Default: treat unknown errors as permanent (safer)
    return {
      category: ErrorCategory.PERMANENT,
      code: 'UNKNOWN_ERROR',
      type: 'unknown',
    };
  }

  /**
   * Check if an error is transient (retryable).
   * @deprecated Use categorizeError() instead for more detailed classification
   */
  isTransientError(error: Error): boolean {
    return this.categorizeError(error).category === ErrorCategory.TRANSIENT;
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
