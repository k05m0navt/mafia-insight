import { TestResult } from '../../e2e/cross-browser/CrossBrowserTestSuite';

/**
 * Cross-Browser Test Reporter
 */
export class CrossBrowserTestReporter {
  /**
   * Generate test report
   */
  static generateReport(results: TestResult[]): string {
    const summary = this.generateSummary(results);
    const details = this.generateDetails(results);

    return `${summary}\n\n${details}`;
  }

  /**
   * Generate summary statistics
   */
  static generateSummary(results: TestResult[]): string {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0';

    return `
=== Cross-Browser Test Summary ===
Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Pass Rate: ${passRate}%
    `.trim();
  }

  /**
   * Generate detailed report
   */
  static generateDetails(results: TestResult[]): string {
    const byBrowser = this.groupByBrowser(results);

    let details = '=== Browser Breakdown ===\n';

    for (const [browser, browserResults] of Object.entries(byBrowser)) {
      const browserPassed = browserResults.filter((r) => r.passed).length;
      const browserTotal = browserResults.length;

      details += `\n${browser}: ${browserPassed}/${browserTotal} passed\n`;

      const failures = browserResults.filter((r) => !r.passed);
      if (failures.length > 0) {
        details += '  Failures:\n';
        for (const failure of failures) {
          details += `    - ${failure.testName}: ${failure.error}\n`;
        }
      }
    }

    return details;
  }

  /**
   * Group results by browser
   */
  private static groupByBrowser(
    results: TestResult[]
  ): Record<string, TestResult[]> {
    const grouped: Record<string, TestResult[]> = {};

    for (const result of results) {
      const key = `${result.browser}-${result.platform}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(result);
    }

    return grouped;
  }

  /**
   * Export report to file
   */
  static exportToFile(results: TestResult[], filepath: string): void {
    this.generateReport(results);
    console.log(`Exporting report to ${filepath}`);
    // File export logic would go here
  }
}
