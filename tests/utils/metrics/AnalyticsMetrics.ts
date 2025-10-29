import { Page } from '@playwright/test';

export interface AnalyticsMetrics {
  performance: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    slowestRequest: number;
    errorRate: number;
    successRate: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    memoryLeaks: boolean;
  };
  network: {
    totalBytes: number;
    totalRequests: number;
    averageLatency: number;
    connectionType: string;
  };
  user: {
    interactions: number;
    clicks: number;
    scrolls: number;
    formSubmissions: number;
    errors: number;
  };
  coverage: {
    features: {
      dashboard: boolean;
      players: boolean;
      clubs: boolean;
      tournaments: boolean;
      filtering: boolean;
      search: boolean;
      sorting: boolean;
      pagination: boolean;
      export: boolean;
    };
    testCases: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    };
  };
}

export class AnalyticsMetricsCollector {
  private metrics: Partial<AnalyticsMetrics> = {};
  private startTime: number = Date.now();
  private interactionCount: number = 0;
  private clickCount: number = 0;
  private scrollCount: number = 0;
  private formSubmissionCount: number = 0;
  private errorCount: number = 0;

  constructor(private page: Page) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for metrics collection
   */
  private setupEventListeners() {
    // Track user interactions
    this.page.on('click', () => {
      this.clickCount++;
      this.interactionCount++;
    });

    this.page.on('scroll', () => {
      this.scrollCount++;
      this.interactionCount++;
    });

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errorCount++;
      }
    });

    // Track form submissions
    this.page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/')) {
        this.formSubmissionCount++;
        this.interactionCount++;
      }
    });
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics(): Promise<AnalyticsMetrics['performance']> {
    try {
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const lcp = performance.getEntriesByType('largest-contentful-paint');
        const cls = performance.getEntriesByType('layout-shift');
        const fid = performance.getEntriesByType('first-input');

        return {
          pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          firstContentfulPaint:
            paint.find((p) => p.name === 'first-contentful-paint')?.startTime ||
            0,
          largestContentfulPaint:
            lcp.length > 0 ? lcp[lcp.length - 1].startTime : 0,
          cumulativeLayoutShift: cls.reduce(
            (sum, entry) =>
              (sum + (entry as Record<string, unknown>).value) as number,
            0
          ),
          firstInputDelay:
            fid.length > 0
              ? ((fid[0] as Record<string, unknown>)
                  .processingStart as number) -
                ((fid[0] as Record<string, unknown>).startTime as number)
              : 0,
          timeToInteractive:
            navigation.domContentLoadedEventEnd - navigation.navigationStart,
        };
      });

      this.metrics.performance = performanceMetrics;
      return performanceMetrics;
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
      return {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
      };
    }
  }

  /**
   * Collect API metrics
   */
  async collectApiMetrics(): Promise<AnalyticsMetrics['api']> {
    try {
      const apiMetrics = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        const apiEntries = entries.filter((entry) =>
          entry.name.includes('/api/')
        );

        const totalRequests = apiEntries.length;
        const responseTimes = apiEntries
          .filter((entry) => entry.responseEnd > 0)
          .map((entry) => entry.responseEnd - entry.requestStart);

        const averageResponseTime =
          responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length
            : 0;

        const slowestRequest =
          responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

        // Count errors (status codes 4xx and 5xx)
        const errorCount = apiEntries.filter((entry) => {
          const status = (entry as Record<string, unknown>)
            .responseStatus as number;
          return status >= 400 && status < 600;
        }).length;

        const errorRate =
          totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
        const successRate = 100 - errorRate;

        return {
          totalRequests,
          averageResponseTime,
          slowestRequest,
          errorRate,
          successRate,
        };
      });

      this.metrics.api = apiMetrics;
      return apiMetrics;
    } catch (error) {
      console.warn('Failed to collect API metrics:', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: 0,
        errorRate: 0,
        successRate: 100,
      };
    }
  }

  /**
   * Collect memory metrics
   */
  async collectMemoryMetrics(): Promise<AnalyticsMetrics['memory']> {
    try {
      const memoryMetrics = await this.page.evaluate(() => {
        const memory = (performance as Record<string, unknown>)
          .memory as Record<string, unknown>;

        if (!memory) {
          return {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            memoryLeaks: false,
          };
        }

        return {
          usedJSHeapSize: memory.usedJSHeapSize / 1024 / 1024, // MB
          totalJSHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
          jsHeapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024, // MB
          memoryLeaks: memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9,
        };
      });

      this.metrics.memory = memoryMetrics;
      return memoryMetrics;
    } catch (error) {
      console.warn('Failed to collect memory metrics:', error);
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        memoryLeaks: false,
      };
    }
  }

  /**
   * Collect network metrics
   */
  async collectNetworkMetrics(): Promise<AnalyticsMetrics['network']> {
    try {
      const networkMetrics = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');

        const totalBytes = entries.reduce((sum, entry) => {
          const transferSize =
            ((entry as Record<string, unknown>).transferSize as number) || 0;
          return sum + transferSize;
        }, 0);

        const totalRequests = entries.length;

        const latencies = entries
          .filter((entry) => entry.responseEnd > 0)
          .map((entry) => entry.responseEnd - entry.requestStart);

        const averageLatency =
          latencies.length > 0
            ? latencies.reduce((sum, latency) => sum + latency, 0) /
              latencies.length
            : 0;

        // Get connection type from navigator
        const connection = (navigator as Record<string, unknown>)
          .connection as Record<string, unknown>;
        const connectionType = connection
          ? connection.effectiveType || 'unknown'
          : 'unknown';

        return {
          totalBytes,
          totalRequests,
          averageLatency,
          connectionType,
        };
      });

      this.metrics.network = networkMetrics;
      return networkMetrics;
    } catch (error) {
      console.warn('Failed to collect network metrics:', error);
      return {
        totalBytes: 0,
        totalRequests: 0,
        averageLatency: 0,
        connectionType: 'unknown',
      };
    }
  }

  /**
   * Collect user interaction metrics
   */
  collectUserMetrics(): AnalyticsMetrics['user'] {
    const userMetrics = {
      interactions: this.interactionCount,
      clicks: this.clickCount,
      scrolls: this.scrollCount,
      formSubmissions: this.formSubmissionCount,
      errors: this.errorCount,
    };

    this.metrics.user = userMetrics;
    return userMetrics;
  }

  /**
   * Collect test coverage metrics
   */
  async collectCoverageMetrics(): Promise<AnalyticsMetrics['coverage']> {
    try {
      // Check which features are available on the page
      const features = await this.page.evaluate(() => {
        return {
          dashboard: !!document.querySelector(
            '[data-testid="analytics-dashboard"]'
          ),
          players: !!document.querySelector('[data-testid="players-section"]'),
          clubs: !!document.querySelector('[data-testid="clubs-section"]'),
          tournaments: !!document.querySelector(
            '[data-testid="tournaments-section"]'
          ),
          filtering: !!document.querySelector(
            '[data-testid="apply-filters-button"]'
          ),
          search: !!document.querySelector('[data-testid="search-input"]'),
          sorting: !!document.querySelector(
            '[data-testid="sort-by-name-button"]'
          ),
          pagination: !!document.querySelector(
            '[data-testid="pagination-container"]'
          ),
          export: !!document.querySelector('[data-testid="export-button"]'),
        };
      });

      const coverage = {
        features,
        testCases: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
        },
      };

      this.metrics.coverage = coverage;
      return coverage;
    } catch (error) {
      console.warn('Failed to collect coverage metrics:', error);
      return {
        features: {
          dashboard: false,
          players: false,
          clubs: false,
          tournaments: false,
          filtering: false,
          search: false,
          sorting: false,
          pagination: false,
          export: false,
        },
        testCases: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
        },
      };
    }
  }

  /**
   * Collect all metrics
   */
  async collectAllMetrics(): Promise<AnalyticsMetrics> {
    console.log('Collecting analytics metrics...');

    const [performance, api, memory, network, coverage] = await Promise.all([
      this.collectPerformanceMetrics(),
      this.collectApiMetrics(),
      this.collectMemoryMetrics(),
      this.collectNetworkMetrics(),
      this.collectCoverageMetrics(),
    ]);

    const user = this.collectUserMetrics();

    const allMetrics: AnalyticsMetrics = {
      performance,
      api,
      memory,
      network,
      user,
      coverage,
    };

    this.metrics = allMetrics;
    return allMetrics;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<AnalyticsMetrics> {
    return this.metrics;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {};
    this.startTime = Date.now();
    this.interactionCount = 0;
    this.clickCount = 0;
    this.scrollCount = 0;
    this.formSubmissionCount = 0;
    this.errorCount = 0;
  }

  /**
   * Export metrics to JSON
   */
  async exportMetrics(filename?: string): Promise<string> {
    const metrics = await this.collectAllMetrics();
    const json = JSON.stringify(metrics, null, 2);

    if (filename) {
      const fs = require('fs');
      const path = require('path');
      const metricsPath = path.join('test-results', 'metrics', filename);

      // Ensure directory exists
      const dir = path.dirname(metricsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(metricsPath, json);
      console.log(`Metrics exported to: ${metricsPath}`);
    }

    return json;
  }

  /**
   * Generate metrics summary
   */
  generateSummary(metrics: AnalyticsMetrics): string {
    const summary = `
Analytics Metrics Summary:
========================

Performance:
- Page Load Time: ${metrics.performance.pageLoadTime.toFixed(2)}ms
- First Contentful Paint: ${metrics.performance.firstContentfulPaint.toFixed(2)}ms
- Largest Contentful Paint: ${metrics.performance.largestContentfulPaint.toFixed(2)}ms
- Cumulative Layout Shift: ${metrics.performance.cumulativeLayoutShift.toFixed(4)}
- First Input Delay: ${metrics.performance.firstInputDelay.toFixed(2)}ms
- Time to Interactive: ${metrics.performance.timeToInteractive.toFixed(2)}ms

API:
- Total Requests: ${metrics.api.totalRequests}
- Average Response Time: ${metrics.api.averageResponseTime.toFixed(2)}ms
- Slowest Request: ${metrics.api.slowestRequest.toFixed(2)}ms
- Error Rate: ${metrics.api.errorRate.toFixed(2)}%
- Success Rate: ${metrics.api.successRate.toFixed(2)}%

Memory:
- Used JS Heap Size: ${metrics.memory.usedJSHeapSize.toFixed(2)}MB
- Total JS Heap Size: ${metrics.memory.totalJSHeapSize.toFixed(2)}MB
- JS Heap Size Limit: ${metrics.memory.jsHeapSizeLimit.toFixed(2)}MB
- Memory Leaks: ${metrics.memory.memoryLeaks ? 'Yes' : 'No'}

Network:
- Total Bytes: ${(metrics.network.totalBytes / 1024 / 1024).toFixed(2)}MB
- Total Requests: ${metrics.network.totalRequests}
- Average Latency: ${metrics.network.averageLatency.toFixed(2)}ms
- Connection Type: ${metrics.network.connectionType}

User Interactions:
- Total Interactions: ${metrics.user.interactions}
- Clicks: ${metrics.user.clicks}
- Scrolls: ${metrics.user.scrolls}
- Form Submissions: ${metrics.user.formSubmissions}
- Errors: ${metrics.user.errors}

Coverage:
- Dashboard: ${metrics.coverage.features.dashboard ? '✓' : '✗'}
- Players: ${metrics.coverage.features.players ? '✓' : '✗'}
- Clubs: ${metrics.coverage.features.clubs ? '✓' : '✗'}
- Tournaments: ${metrics.coverage.features.tournaments ? '✓' : '✗'}
- Filtering: ${metrics.coverage.features.filtering ? '✓' : '✗'}
- Search: ${metrics.coverage.features.search ? '✓' : '✗'}
- Sorting: ${metrics.coverage.features.sorting ? '✓' : '✗'}
- Pagination: ${metrics.coverage.features.pagination ? '✓' : '✗'}
- Export: ${metrics.coverage.features.export ? '✓' : '✗'}
`;

    return summary;
  }
}
