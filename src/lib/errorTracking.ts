interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class ErrorTrackingService {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  // Track error with context
  trackError(error: Error, context?: Partial<ErrorContext>): void {
    const errorContext: ErrorContext = {
      timestamp: new Date(),
      severity: 'medium',
      ...context,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', {
        message: error.message,
        stack: error.stack,
        context: errorContext,
      });
    }

    // Send to external service (Sentry, etc.)
    this.sendToExternalService(error, errorContext);
  }

  // Track API errors with retry logic
  async trackApiError(
    error: Error,
    endpoint: string,
    retryable: boolean = true
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      url: endpoint,
      severity: retryable ? 'medium' : 'high',
    };

    this.trackError(error, context);

    if (retryable) {
      await this.retryApiCall(endpoint);
    }
  }

  // Retry logic for API calls
  private async retryApiCall(endpoint: string): Promise<void> {
    let attempt = 0;
    let delay = this.retryConfig.baseDelay;

    while (attempt < this.retryConfig.maxRetries) {
      try {
        await this.delay(delay);
        // Implement your retry logic here
        console.log(`Retrying API call to ${endpoint}, attempt ${attempt + 1}`);
        break;
      } catch (error) {
        attempt++;
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelay
        );

        if (attempt >= this.retryConfig.maxRetries) {
          this.trackError(error as Error, {
            url: endpoint,
            severity: 'critical',
          });
        }
      }
    }
  }

  // Track database errors
  trackDatabaseError(error: Error, query: string): void {
    this.trackError(error, {
      severity: 'high',
      url: `database:${query.substring(0, 50)}`,
    });
  }

  // Track authentication errors
  trackAuthError(error: Error, action: string): void {
    this.trackError(error, {
      severity: 'high',
      url: `auth:${action}`,
    });
  }

  // Track validation errors
  trackValidationError(error: Error, field: string): void {
    this.trackError(error, {
      severity: 'low',
      url: `validation:${field}`,
    });
  }

  // Track performance errors
  trackPerformanceError(error: Error, operation: string): void {
    this.trackError(error, {
      severity: 'medium',
      url: `performance:${operation}`,
    });
  }

  // Send to external monitoring service
  private async sendToExternalService(
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    try {
      // Send to Sentry if available
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            severity: context.severity,
            url: context.url,
          },
          user: {
            id: context.userId,
          },
          extra: {
            sessionId: context.sessionId,
            userAgent: context.userAgent,
            timestamp: context.timestamp.toISOString(),
          },
        });
      }

      // Send to Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: context.severity === 'critical',
        });
      }

      // Send to custom endpoint
      await this.sendToCustomEndpoint(error, context);
    } catch (trackingError) {
      console.error('Failed to send error to external service:', trackingError);
    }
  }

  // Send to custom error tracking endpoint
  private async sendToCustomEndpoint(
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
        }),
      });
    } catch (fetchError) {
      console.error('Failed to send error to custom endpoint:', fetchError);
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Set retry configuration
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorContext[];
  } {
    // This would typically come from your error storage
    return {
      totalErrors: 0,
      errorsBySeverity: {},
      recentErrors: [],
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTrackingService.trackError(event.error, {
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'medium',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTrackingService.trackError(new Error(event.reason), {
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'medium',
    });
  });
}

// Declare global types for external services
declare global {
  interface Window {
    Sentry?: {
      captureException: (
        error: Error,
        context?: Record<string, unknown>
      ) => void;
    };
    gtag?: (...args: unknown[]) => void;
  }
}
