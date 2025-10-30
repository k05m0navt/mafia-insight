import fs from 'fs/promises';
import path from 'path';
import {
  TestRunner,
  TestSuite,
  TestResult as _TestResult,
} from '../test-runner/TestRunner';
import { CoverageAnalyzer, CoverageReport } from '../coverage/CoverageAnalyzer';
import {
  PerformanceMonitor,
  PerformanceReport,
} from '../performance/PerformanceMonitor';

export interface TestReport {
  summary: {
    timestamp: Date;
    duration: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
    coverage: number;
    performance: number;
    overallStatus: 'passed' | 'failed' | 'warning';
  };
  testSuites: TestSuite[];
  coverage: CoverageReport | null;
  performance: PerformanceReport | null;
  trends: {
    tests: number;
    coverage: number;
    performance: number;
  };
  recommendations: string[];
  alerts: string[];
}

export interface ReportConfig {
  includeCoverage: boolean;
  includePerformance: boolean;
  includeTrends: boolean;
  includeRecommendations: boolean;
  format: 'json' | 'html' | 'markdown' | 'pdf';
  outputDir: string;
  filename?: string;
}

export class TestReporter {
  private testRunner: TestRunner;
  private coverageAnalyzer: CoverageAnalyzer;
  private performanceMonitor: PerformanceMonitor;
  private config: ReportConfig;

  constructor(
    testRunner: TestRunner,
    coverageAnalyzer: CoverageAnalyzer,
    performanceMonitor: PerformanceMonitor,
    config: Partial<ReportConfig> = {}
  ) {
    this.testRunner = testRunner;
    this.coverageAnalyzer = coverageAnalyzer;
    this.performanceMonitor = performanceMonitor;
    this.config = {
      includeCoverage: true,
      includePerformance: true,
      includeTrends: true,
      includeRecommendations: true,
      format: 'markdown',
      outputDir: 'test-reports',
      ...config,
    };
  }

  async generateReport(): Promise<TestReport> {
    const startTime = Date.now();

    // Collect test results
    const testSuites = this.testRunner.getTestSuites();
    const testResults = this.testRunner.getLastResults();

    // Calculate test summary
    const totalTests = testResults.reduce(
      (sum, result) => sum + result.tests,
      0
    );
    const passedTests = testResults.reduce(
      (sum, result) => sum + result.passed,
      0
    );
    const failedTests = testResults.reduce(
      (sum, result) => sum + result.failed,
      0
    );
    const skippedTests = testResults.reduce(
      (sum, result) => sum + result.skipped,
      0
    );
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

    // Collect coverage data
    let coverage: CoverageReport | null = null;
    if (this.config.includeCoverage) {
      try {
        coverage = this.coverageAnalyzer.analyzeCoverage();
      } catch (error) {
        console.warn('Failed to analyze coverage:', error);
      }
    }

    // Collect performance data
    let performance: PerformanceReport | null = null;
    if (this.config.includePerformance) {
      try {
        performance = this.performanceMonitor.generateReport();
      } catch (error) {
        console.warn('Failed to generate performance report:', error);
      }
    }

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(
      successRate,
      coverage,
      performance
    );

    // Calculate trends
    const trends = this.calculateTrends(testSuites, coverage, performance);

    // Generate recommendations and alerts
    const recommendations = this.generateRecommendations(
      testSuites,
      coverage,
      performance
    );
    const alerts = this.generateAlerts(testSuites, coverage, performance);

    const duration = Date.now() - startTime;

    return {
      summary: {
        timestamp: new Date(),
        duration,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate,
        coverage: coverage?.summary.score || 0,
        performance: performance?.summary.score || 0,
        overallStatus,
      },
      testSuites,
      coverage,
      performance,
      trends,
      recommendations,
      alerts,
    };
  }

  private calculateOverallStatus(
    successRate: number,
    coverage: CoverageReport | null,
    performance: PerformanceReport | null
  ): 'passed' | 'failed' | 'warning' {
    // Check test success rate
    if (successRate < 80) return 'failed';
    if (successRate < 95) return 'warning';

    // Check coverage
    if (coverage && coverage.summary.status === 'failed') return 'failed';
    if (coverage && coverage.summary.status === 'warning') return 'warning';

    // Check performance
    if (performance && performance.summary.score < 70) return 'failed';
    if (performance && performance.summary.score < 85) return 'warning';

    return 'passed';
  }

  private calculateTrends(
    _testSuites: TestSuite[],
    _coverage: CoverageReport | null,
    _performance: PerformanceReport | null
  ): TestReport['trends'] {
    // This would typically compare with historical data
    // For now, return neutral trends
    return {
      tests: 0,
      coverage: 0,
      performance: 0,
    };
  }

  private generateRecommendations(
    testSuites: TestSuite[],
    coverage: CoverageReport | null,
    performance: PerformanceReport | null
  ): string[] {
    const recommendations: string[] = [];

    // Test recommendations
    const failedSuites = testSuites.filter(
      (suite) => suite.status === 'failed'
    );
    if (failedSuites.length > 0) {
      recommendations.push(`Fix ${failedSuites.length} failed test suites`);
    }

    // Coverage recommendations
    if (coverage && coverage.recommendations.length > 0) {
      recommendations.push(...coverage.recommendations);
    }

    // Performance recommendations
    if (performance && performance.recommendations.length > 0) {
      recommendations.push(...performance.recommendations);
    }

    return recommendations;
  }

  private generateAlerts(
    testSuites: TestSuite[],
    coverage: CoverageReport | null,
    performance: PerformanceReport | null
  ): string[] {
    const alerts: string[] = [];

    // Test alerts
    const failedSuites = testSuites.filter(
      (suite) => suite.status === 'failed'
    );
    for (const suite of failedSuites) {
      alerts.push(`CRITICAL: ${suite.name} test suite failed`);
    }

    // Coverage alerts
    if (coverage && coverage.alerts.length > 0) {
      alerts.push(...coverage.alerts);
    }

    // Performance alerts
    if (performance && performance.alerts.length > 0) {
      alerts.push(...performance.alerts);
    }

    return alerts;
  }

  async saveReport(report: TestReport): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = this.config.filename || `test-report-${timestamp}`;
    const filepath = path.join(
      this.config.outputDir,
      `${filename}.${this.config.format}`
    );

    let content: string;

    switch (this.config.format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(report);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(report);
        break;
      case 'pdf':
        // PDF generation would require additional libraries
        throw new Error('PDF format not implemented yet');
      default:
        throw new Error(`Unsupported format: ${this.config.format}`);
    }

    await fs.writeFile(filepath, content, 'utf8');
    console.log(`Test report saved to: ${filepath}`);

    return filepath;
  }

  private generateMarkdownReport(report: TestReport): string {
    const {
      summary,
      testSuites,
      coverage,
      performance,
      trends,
      recommendations,
      alerts,
    } = report;

    return `# Test Execution Report

## Summary
- **Timestamp**: ${summary.timestamp.toISOString()}
- **Duration**: ${(summary.duration / 1000).toFixed(2)}s
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passedTests}
- **Failed**: ${summary.failedTests}
- **Skipped**: ${summary.skippedTests}
- **Success Rate**: ${summary.successRate.toFixed(2)}%
- **Coverage**: ${summary.coverage.toFixed(2)}%
- **Performance**: ${summary.performance.toFixed(2)}%
- **Overall Status**: ${summary.overallStatus.toUpperCase()}

## Test Suites
${testSuites
  .map(
    (suite) => `
### ${suite.name}
- **Status**: ${suite.status}
- **Tests**: ${suite.results.reduce((sum, r) => sum + r.tests, 0)}
- **Passed**: ${suite.results.reduce((sum, r) => sum + r.passed, 0)}
- **Failed**: ${suite.results.reduce((sum, r) => sum + r.failed, 0)}
- **Duration**: ${(suite.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s
- **Last Run**: ${suite.lastRun?.toISOString() || 'Never'}
`
  )
  .join('')}

## Coverage Analysis
${
  coverage
    ? `
- **Overall Score**: ${coverage.summary.score.toFixed(2)}%
- **Status**: ${coverage.summary.status.toUpperCase()}
- **Lines**: ${coverage.summary.total.lines.pct.toFixed(2)}%
- **Statements**: ${coverage.summary.total.statements.pct.toFixed(2)}%
- **Functions**: ${coverage.summary.total.functions.pct.toFixed(2)}%
- **Branches**: ${coverage.summary.total.branches.pct.toFixed(2)}%

### Recommendations
${coverage.recommendations.map((rec) => `- ${rec}`).join('\n')}
`
    : 'Coverage analysis not available'
}

## Performance Analysis
${
  performance
    ? `
- **Overall Score**: ${performance.summary.score.toFixed(2)}%
- **Total Metrics**: ${performance.summary.total}
- **Passed**: ${performance.summary.passed}
- **Failed**: ${performance.summary.failed}
- **Warning**: ${performance.summary.warning}

### Recommendations
${performance.recommendations.map((rec) => `- ${rec}`).join('\n')}
`
    : 'Performance analysis not available'
}

## Trends
- **Tests**: ${trends.tests > 0 ? '+' : ''}${trends.tests}
- **Coverage**: ${trends.coverage > 0 ? '+' : ''}${trends.coverage.toFixed(2)}%
- **Performance**: ${trends.performance > 0 ? '+' : ''}${trends.performance.toFixed(2)}%

## Recommendations
${recommendations.map((rec) => `- ${rec}`).join('\n')}

## Alerts
${alerts.length > 0 ? alerts.map((alert) => `- ${alert}`).join('\n') : 'No alerts'}

---
*Report generated at ${new Date().toISOString()}*
`;
  }

  private generateHTMLReport(report: TestReport): string {
    const {
      summary,
      testSuites,
      coverage,
      performance,
      trends: _trends,
      recommendations,
      alerts,
    } = report;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-warning { color: #ffc107; }
        .test-suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .recommendations, .alerts { margin: 20px 0; }
        .recommendations ul, .alerts ul { padding-left: 20px; }
        .alerts { background: #f8d7da; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Report</h1>
        <p>Generated at ${summary.timestamp.toISOString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value status-${summary.successRate >= 95 ? 'passed' : summary.successRate >= 80 ? 'warning' : 'failed'}">${summary.successRate.toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Coverage</h3>
            <div class="value">${summary.coverage.toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Performance</h3>
            <div class="value">${summary.performance.toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Overall Status</h3>
            <div class="value status-${summary.overallStatus}">${summary.overallStatus.toUpperCase()}</div>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    ${testSuites
      .map(
        (suite) => `
        <div class="test-suite">
            <h3>${suite.name}</h3>
            <p><strong>Status:</strong> <span class="status-${suite.status}">${suite.status.toUpperCase()}</span></p>
            <p><strong>Tests:</strong> ${suite.results.reduce((sum, r) => sum + r.tests, 0)}</p>
            <p><strong>Passed:</strong> ${suite.results.reduce((sum, r) => sum + r.passed, 0)}</p>
            <p><strong>Failed:</strong> ${suite.results.reduce((sum, r) => sum + r.failed, 0)}</p>
            <p><strong>Duration:</strong> ${(suite.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s</p>
        </div>
    `
      )
      .join('')}
    
    ${
      coverage
        ? `
        <h2>Coverage Analysis</h2>
        <div class="metric">
            <h3>Overall Score</h3>
            <div class="value">${coverage.summary.score.toFixed(2)}%</div>
        </div>
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${coverage.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `
        : ''
    }
    
    ${
      performance
        ? `
        <h2>Performance Analysis</h2>
        <div class="metric">
            <h3>Overall Score</h3>
            <div class="value">${performance.summary.score.toFixed(2)}%</div>
        </div>
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${performance.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `
        : ''
    }
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    ${
      alerts.length > 0
        ? `
        <div class="alerts">
            <h2>Alerts</h2>
            <ul>
                ${alerts.map((alert) => `<li>${alert}</li>`).join('')}
            </ul>
        </div>
    `
        : ''
    }
</body>
</html>`;
  }

  async generateAndSaveReport(): Promise<string> {
    const report = await this.generateReport();
    return await this.saveReport(report);
  }

  setConfig(config: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ReportConfig {
    return { ...this.config };
  }
}
