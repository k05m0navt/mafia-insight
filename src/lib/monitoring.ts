interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  url?: string;
  userAgent?: string;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];

  // Performance monitoring
  trackPageLoad(page: string, loadTime: number): void {
    this.metrics.push({
      name: 'page_load_time',
      value: loadTime,
      timestamp: new Date(),
      tags: { page },
    });
  }

  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.metrics.push({
      name: 'api_call_duration',
      value: duration,
      timestamp: new Date(),
      tags: { endpoint, status: status.toString() },
    });
  }

  trackDatabaseQuery(query: string, duration: number): void {
    this.metrics.push({
      name: 'database_query_duration',
      value: duration,
      timestamp: new Date(),
      tags: { query: query.substring(0, 50) },
    });
  }

  trackCacheHit(key: string): void {
    this.metrics.push({
      name: 'cache_hit',
      value: 1,
      timestamp: new Date(),
      tags: { key },
    });
  }

  trackCacheMiss(key: string): void {
    this.metrics.push({
      name: 'cache_miss',
      value: 1,
      timestamp: new Date(),
      tags: { key },
    });
  }

  // Error tracking
  trackError(
    error: Error,
    context?: {
      userId?: string;
      url?: string;
      userAgent?: string;
    }
  ): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      ...context,
    });

    // Send to external monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  // Core Web Vitals
  trackLCP(value: number): void {
    this.metrics.push({
      name: 'lcp',
      value,
      timestamp: new Date(),
    });
  }

  trackFID(value: number): void {
    this.metrics.push({
      name: 'fid',
      value,
      timestamp: new Date(),
    });
  }

  trackCLS(value: number): void {
    this.metrics.push({
      name: 'cls',
      value,
      timestamp: new Date(),
    });
  }

  trackFCP(value: number): void {
    this.metrics.push({
      name: 'fcp',
      value,
      timestamp: new Date(),
    });
  }

  trackTTFB(value: number): void {
    this.metrics.push({
      name: 'ttfb',
      value,
      timestamp: new Date(),
    });
  }

  // Analytics tracking
  trackUserAction(action: string, properties?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, properties);
    }
  }

  trackPageView(page: string): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: page,
        page_location: window.location.href,
      });
    }
  }

  // Get metrics for analysis
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorMetric[] {
    return [...this.errors];
  }

  // Clear old metrics (keep last 1000)
  cleanup(): void {
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  // Performance monitoring hooks
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().then(
      (result) => {
        const duration = performance.now() - start;
        this.trackApiCall(name, duration, 200);
        return result;
      },
      (error) => {
        const duration = performance.now() - start;
        this.trackApiCall(name, duration, 500);
        this.trackError(error);
        throw error;
      }
    );
  }

  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.trackApiCall(name, duration, 200);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackApiCall(name, duration, 500);
      this.trackError(error as Error);
      throw error;
    }
  }
}

export const monitoringService = new MonitoringService();

// Web Vitals monitoring
if (typeof window !== 'undefined') {
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => monitoringService.trackCLS(metric.value));
    onFCP((metric) => monitoringService.trackFCP(metric.value));
    onLCP((metric) => monitoringService.trackLCP(metric.value));
    onTTFB((metric) => monitoringService.trackTTFB(metric.value));
  });
}
