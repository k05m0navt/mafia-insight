import { TestResult } from '../../e2e/cross-browser/CrossBrowserTestSuite';

/**
 * Cross-Browser Test Metrics
 */
interface MetricGroup {
  total: number;
  passed: number;
  failed: number;
  passRate?: number;
}

export interface CrossBrowserMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  averageDuration: number;
  byBrowser: Record<string, MetricGroup>;
  byPlatform: Record<string, MetricGroup>;
}

export class CrossBrowserMetricsCollector {
  /**
   * Collect metrics from test results
   */
  static collectMetrics(results: TestResult[]): CrossBrowserMetrics {
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const durations = results.map((r) => r.duration);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const byBrowser = this.groupMetrics(results, (r) => r.browser);
    const byPlatform = this.groupMetrics(results, (r) => r.platform);

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      averageDuration,
      byBrowser,
      byPlatform,
    };
  }

  /**
   * Group metrics by a key function
   */
  private static groupMetrics(
    results: TestResult[],
    keyFn: (r: TestResult) => string
  ): Record<string, MetricGroup> {
    const grouped: Record<string, MetricGroup> = {};

    for (const result of results) {
      const key = keyFn(result);
      if (!grouped[key]) {
        grouped[key] = { total: 0, passed: 0, failed: 0 };
      }

      grouped[key].total++;
      if (result.passed) {
        grouped[key].passed++;
      } else {
        grouped[key].failed++;
      }
    }

    // Calculate pass rates
    for (const key of Object.keys(grouped)) {
      const group = grouped[key];
      group.passRate = group.total > 0 ? (group.passed / group.total) * 100 : 0;
    }

    return grouped;
  }

  /**
   * Generate comparison report
   */
  static generateComparisonReport(metrics: CrossBrowserMetrics): string {
    let report = '=== Cross-Browser Comparison ===\n\n';

    report += `Overall: ${metrics.passRate.toFixed(2)}% pass rate\n`;
    report += `Average Duration: ${metrics.averageDuration.toFixed(2)}ms\n\n`;

    report += 'By Browser:\n';
    for (const [browser, data] of Object.entries(metrics.byBrowser)) {
      report += `  ${browser}: ${data.passRate.toFixed(2)}% (${data.passed}/${data.total})\n`;
    }

    report += '\nBy Platform:\n';
    for (const [platform, data] of Object.entries(metrics.byPlatform)) {
      report += `  ${platform}: ${data.passRate.toFixed(2)}% (${data.passed}/${data.total})\n`;
    }

    return report;
  }
}
