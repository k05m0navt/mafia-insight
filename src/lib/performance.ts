import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance Monitoring Utilities
 *
 * Provides performance measurement and monitoring capabilities
 * for theme switching, navigation updates, and authentication flows.
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceThreshold {
  name: string;
  maxDuration: number;
  description: string;
}

// Performance thresholds based on requirements
export const PERFORMANCE_THRESHOLDS: PerformanceThreshold[] = [
  {
    name: 'theme-switch',
    maxDuration: 500, // 500ms
    description: 'Theme switching should complete within 500ms',
  },
  {
    name: 'navigation-update',
    maxDuration: 1000, // 1s
    description: 'Navigation updates should complete within 1s',
  },
  {
    name: 'auth-completion',
    maxDuration: 30000, // 30s
    description: 'Authentication should complete within 30s',
  },
  {
    name: 'component-render',
    maxDuration: 100, // 100ms
    description: 'Component rendering should complete within 100ms',
  },
];

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: ((metric: PerformanceMetric) => void)[] = [];

  /**
   * Start measuring performance for a specific operation
   */
  startMeasure(name: string, metadata?: Record<string, unknown>): () => void {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: startTimestamp,
        metadata,
      };

      this.recordMetric(metric);
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.notifyObservers(metric);
    this.checkThresholds(metric);
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(name: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const operationMetrics = this.getMetricsForOperation(name);
    if (operationMetrics.length === 0) return 0;

    const totalDuration = operationMetrics.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    return totalDuration / operationMetrics.length;
  }

  /**
   * Get performance statistics for an operation
   */
  getPerformanceStats(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } {
    const operationMetrics = this.getMetricsForOperation(name);
    if (operationMetrics.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0, p95: 0 };
    }

    const durations = operationMetrics
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = durations[0];
    const max = durations[durations.length - 1];
    const p95Index = Math.floor(durations.length * 0.95);
    const p95 = durations[p95Index] || 0;

    return { average, min, max, count: durations.length, p95 };
  }

  /**
   * Check if a metric exceeds performance thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = PERFORMANCE_THRESHOLDS.find(
      (t) => t.name === metric.name
    );
    if (!threshold) return;

    if (metric.duration > threshold.maxDuration) {
      console.warn(
        `⚠️ Performance Warning: ${metric.name} took ${metric.duration.toFixed(2)}ms, ` +
          `exceeding threshold of ${threshold.maxDuration}ms. ${threshold.description}`
      );

      // In development, also log to console for debugging
      if (process.env.NODE_ENV === 'development') {
        console.group(`Performance Issue: ${metric.name}`);
        console.log('Duration:', metric.duration.toFixed(2), 'ms');
        console.log('Threshold:', threshold.maxDuration, 'ms');
        console.log('Metadata:', metric.metadata);
        console.groupEnd();
      }
    }
  }

  /**
   * Subscribe to performance metric updates
   */
  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify observers of new metrics
   */
  private notifyObservers(metric: PerformanceMetric): void {
    this.observers.forEach((observer) => {
      try {
        observer(metric);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        thresholds: PERFORMANCE_THRESHOLDS,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for measuring React component performance
 */
export function usePerformanceMeasure(
  name: string,
  metadata?: Record<string, unknown>
) {
  const measureRef = useRef<(() => void) | null>(null);
  const metadataKey = JSON.stringify(metadata);

  useEffect(() => {
    measureRef.current = performanceMonitor.startMeasure(name, metadata);

    return () => {
      if (measureRef.current) {
        measureRef.current();
        measureRef.current = null;
      }
    };
  }, [name, metadata, metadataKey]);

  const endMeasure = useCallback(() => {
    if (measureRef.current) {
      measureRef.current();
      measureRef.current = null;
    }
  }, []);

  return endMeasure;
}

/**
 * Utility function to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const endMeasure = performanceMonitor.startMeasure(name, metadata);

  try {
    const result = await operation();
    return result;
  } finally {
    endMeasure();
  }
}

/**
 * Utility function to measure sync operations
 */
export function measureSync<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T {
  const endMeasure = performanceMonitor.startMeasure(name, metadata);

  try {
    return operation();
  } finally {
    endMeasure();
  }
}

/**
 * Performance monitoring for theme switching
 */
export const themePerformance = {
  startSwitch: (theme: string) =>
    performanceMonitor.startMeasure('theme-switch', { theme }),

  getStats: () => performanceMonitor.getPerformanceStats('theme-switch'),
};

/**
 * Performance monitoring for navigation updates
 */
export const navigationPerformance = {
  startUpdate: (page: string) =>
    performanceMonitor.startMeasure('navigation-update', { page }),

  getStats: () => performanceMonitor.getPerformanceStats('navigation-update'),
};

/**
 * Performance monitoring for authentication
 */
export const authPerformance = {
  startAuth: (type: 'login' | 'logout' | 'signup') =>
    performanceMonitor.startMeasure('auth-completion', { type }),

  getStats: () => performanceMonitor.getPerformanceStats('auth-completion'),
};
