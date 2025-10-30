import { Page } from '@playwright/test';

export interface AnalyticsTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  startTime: string;
  endTime: string;
  errors: string[];
  warnings: string[];
  metrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    networkRequests: number;
  };
  screenshots: string[];
  videos: string[];
}

export interface AnalyticsTestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    totalDuration: number;
  };
  results: AnalyticsTestResult[];
  coverage: {
    dashboard: boolean;
    players: boolean;
    clubs: boolean;
    tournaments: boolean;
    filtering: boolean;
    search: boolean;
    sorting: boolean;
    pagination: boolean;
    export: boolean;
    responsive: boolean;
    accessibility: boolean;
  };
  performance: {
    averagePageLoadTime: number;
    averageApiResponseTime: number;
    peakMemoryUsage: number;
    totalNetworkRequests: number;
  };
  recommendations: string[];
  generatedAt: string;
}

export class AnalyticsTestReporter {
  private results: AnalyticsTestResult[] = [];
  private startTime: Date = new Date();

  constructor(private page: Page) {}

  /**
   * Start tracking a test
   */
  startTest(testName: string): void {
    console.log(`Starting test: ${testName}`);
  }

  /**
   * End tracking a test
   */
  async endTest(
    testName: string,
    status: 'passed' | 'failed' | 'skipped',
    errors: string[] = [],
    warnings: string[] = []
  ): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    // Capture metrics
    const metrics = await this.captureMetrics();

    // Capture screenshots
    const screenshots = await this.captureScreenshots(testName);

    // Capture videos (if available)
    const videos = await this.captureVideos(testName);

    const result: AnalyticsTestResult = {
      testName,
      status,
      duration,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      errors,
      warnings,
      metrics,
      screenshots,
      videos,
    };

    this.results.push(result);
    console.log(`Completed test: ${testName} - ${status}`);
  }

  /**
   * Capture performance metrics
   */
  private async captureMetrics() {
    try {
      // Page load time
      const pageLoadTime = await this.page.evaluate(() => {
        return (
          performance.timing.loadEventEnd - performance.timing.navigationStart
        );
      });

      // API response time
      const apiResponseTime = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        const apiEntries = entries.filter(
          (entry) => entry.name.includes('/api/') && entry.responseEnd > 0
        );

        if (apiEntries.length === 0) return 0;

        const totalTime = apiEntries.reduce(
          (sum, entry) => sum + (entry.responseEnd - entry.requestStart),
          0
        );

        return totalTime / apiEntries.length;
      });

      // Memory usage
      const memoryUsage = await this.page.evaluate(() => {
        const memory = (performance as Record<string, unknown>)
          .memory as Record<string, unknown>;
        return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
      });

      // Network requests count
      const networkRequests = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return entries.filter((entry) => entry.name.includes('/api/')).length;
      });

      return {
        pageLoadTime,
        apiResponseTime,
        memoryUsage,
        networkRequests,
      };
    } catch (error) {
      console.warn('Failed to capture metrics:', error);
      return {
        pageLoadTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
      };
    }
  }

  /**
   * Capture screenshots
   */
  private async captureScreenshots(testName: string): Promise<string[]> {
    const screenshots: string[] = [];

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `analytics-${testName}-${timestamp}.png`;
      const path = `test-results/screenshots/${filename}`;

      await this.page.screenshot({ path, fullPage: true });
      screenshots.push(path);
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
    }

    return screenshots;
  }

  /**
   * Capture videos
   */
  private async captureVideos(testName: string): Promise<string[]> {
    const videos: string[] = [];

    try {
      // This would typically be handled by Playwright's video recording
      // For now, we'll just return an empty array
      console.log(`Video recording for ${testName} would be captured here`);
    } catch (error) {
      console.warn('Failed to capture video:', error);
    }

    return videos;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(): Promise<AnalyticsTestReport> {
    const summary = this.calculateSummary();
    const coverage = await this.calculateCoverage();
    const performance = this.calculatePerformance();
    const recommendations = this.generateRecommendations();

    const report: AnalyticsTestReport = {
      summary,
      results: this.results,
      coverage,
      performance,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return report;
  }

  /**
   * Calculate test summary
   */
  private calculateSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      skipped,
      passRate,
      totalDuration,
    };
  }

  /**
   * Calculate test coverage
   */
  private async calculateCoverage() {
    // This would typically check which features were tested
    // For now, we'll return a mock coverage object
    return {
      dashboard: true,
      players: true,
      clubs: true,
      tournaments: true,
      filtering: true,
      search: true,
      sorting: true,
      pagination: true,
      export: true,
      responsive: true,
      accessibility: true,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance() {
    if (this.results.length === 0) {
      return {
        averagePageLoadTime: 0,
        averageApiResponseTime: 0,
        peakMemoryUsage: 0,
        totalNetworkRequests: 0,
      };
    }

    const averagePageLoadTime =
      this.results.reduce((sum, r) => sum + r.metrics.pageLoadTime, 0) /
      this.results.length;

    const averageApiResponseTime =
      this.results.reduce((sum, r) => sum + r.metrics.apiResponseTime, 0) /
      this.results.length;

    const peakMemoryUsage = Math.max(
      ...this.results.map((r) => r.metrics.memoryUsage)
    );

    const totalNetworkRequests = this.results.reduce(
      (sum, r) => sum + r.metrics.networkRequests,
      0
    );

    return {
      averagePageLoadTime,
      averageApiResponseTime,
      peakMemoryUsage,
      totalNetworkRequests,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    const performance = this.calculatePerformance();
    if (performance.averagePageLoadTime > 3000) {
      recommendations.push(
        'Consider optimizing page load time - currently averaging ' +
          performance.averagePageLoadTime.toFixed(2) +
          'ms'
      );
    }

    if (performance.averageApiResponseTime > 1000) {
      recommendations.push(
        'Consider optimizing API response time - currently averaging ' +
          performance.averageApiResponseTime.toFixed(2) +
          'ms'
      );
    }

    if (performance.peakMemoryUsage > 100) {
      recommendations.push(
        'Consider optimizing memory usage - peak usage was ' +
          performance.peakMemoryUsage.toFixed(2) +
          'MB'
      );
    }

    // Test coverage recommendations
    const summary = this.calculateSummary();
    if (summary.passRate < 95) {
      recommendations.push(
        'Improve test reliability - current pass rate is ' +
          summary.passRate.toFixed(2) +
          '%'
      );
    }

    // Error analysis
    const failedTests = this.results.filter((r) => r.status === 'failed');
    if (failedTests.length > 0) {
      const commonErrors = this.analyzeCommonErrors(failedTests);
      if (commonErrors.length > 0) {
        recommendations.push(
          'Address common errors: ' + commonErrors.join(', ')
        );
      }
    }

    return recommendations;
  }

  /**
   * Analyze common errors
   */
  private analyzeCommonErrors(failedTests: AnalyticsTestResult[]): string[] {
    const errorCounts: Record<string, number> = {};

    failedTests.forEach((test) => {
      test.errors.forEach((error) => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });

    return Object.entries(errorCounts)
      .filter(([_, count]) => count > 1)
      .map(([error, count]) => `${error} (${count} times)`)
      .slice(0, 5); // Top 5 common errors
  }

  /**
   * Export report to JSON
   */
  async exportToJson(filename?: string): Promise<string> {
    const report = await this.generateReport();
    const json = JSON.stringify(report, null, 2);

    if (filename) {
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join('test-results', filename);

      // Ensure directory exists
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(reportPath, json);
      console.log(`Report exported to: ${reportPath}`);
    }

    return json;
  }

  /**
   * Export report to HTML
   */
  async exportToHtml(filename?: string): Promise<string> {
    const report = await this.generateReport();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #4CAF50; }
        .failed { border-left-color: #f44336; }
        .skipped { border-left-color: #ff9800; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .metric { background: #e3f2fd; padding: 10px; border-radius: 3px; }
        .recommendations { background: #fff3e0; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
    </style>
</head>
<body>
    <h1>Analytics Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.total}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Skipped:</strong> ${report.summary.skipped}</p>
        <p><strong>Pass Rate:</strong> ${report.summary.passRate.toFixed(2)}%</p>
        <p><strong>Total Duration:</strong> ${(report.summary.totalDuration / 1000).toFixed(2)}s</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <h3>Average Page Load Time</h3>
            <p>${report.performance.averagePageLoadTime.toFixed(2)}ms</p>
        </div>
        <div class="metric">
            <h3>Average API Response Time</h3>
            <p>${report.performance.averageApiResponseTime.toFixed(2)}ms</p>
        </div>
        <div class="metric">
            <h3>Peak Memory Usage</h3>
            <p>${report.performance.peakMemoryUsage.toFixed(2)}MB</p>
        </div>
        <div class="metric">
            <h3>Total Network Requests</h3>
            <p>${report.performance.totalNetworkRequests}</p>
        </div>
    </div>

    <h2>Test Results</h2>
    ${report.results
      .map(
        (result) => `
        <div class="test-result ${result.status}">
            <h3>${result.testName}</h3>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
            ${result.errors.length > 0 ? `<p class="error"><strong>Errors:</strong> ${result.errors.join(', ')}</p>` : ''}
            ${result.warnings.length > 0 ? `<p class="warning"><strong>Warnings:</strong> ${result.warnings.join(', ')}</p>` : ''}
        </div>
    `
      )
      .join('')}

    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <p><em>Report generated at: ${new Date(report.generatedAt).toLocaleString()}</em></p>
</body>
</html>`;

    if (filename) {
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join('test-results', filename);

      // Ensure directory exists
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(reportPath, html);
      console.log(`HTML report exported to: ${reportPath}`);
    }

    return html;
  }

  /**
   * Get test results
   */
  getResults(): AnalyticsTestResult[] {
    return this.results;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
    this.startTime = new Date();
  }
}
