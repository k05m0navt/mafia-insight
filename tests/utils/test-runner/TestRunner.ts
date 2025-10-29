import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  framework: 'vitest' | 'playwright' | 'artillery' | 'lighthouse';
  pattern?: string;
  timeout?: number;
  parallel?: boolean;
  retries?: number;
  reporter?: string;
  coverage?: boolean;
  environment?: string;
}

export interface TestResult {
  success: boolean;
  duration: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
  errors: string[];
  output: string;
}

export interface TestSuite {
  name: string;
  config: TestConfig;
  results: TestResult[];
  lastRun?: Date;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
}

export class TestRunner {
  private suites: TestSuite[] = [];
  private isRunning = false;

  constructor() {
    this.loadTestSuites();
  }

  private async loadTestSuites(): Promise<void> {
    const testSuites = [
      {
        name: 'Unit Tests',
        config: {
          type: 'unit' as const,
          framework: 'vitest' as const,
          pattern: 'tests/unit/**/*.test.{ts,tsx}',
          timeout: 30000,
          parallel: true,
          retries: 2,
          reporter: 'verbose',
          coverage: true,
        },
      },
      {
        name: 'Integration Tests',
        config: {
          type: 'integration' as const,
          framework: 'vitest' as const,
          pattern: 'tests/integration/**/*.test.{ts,tsx}',
          timeout: 60000,
          parallel: false,
          retries: 1,
          reporter: 'verbose',
          coverage: true,
        },
      },
      {
        name: 'E2E Tests',
        config: {
          type: 'e2e' as const,
          framework: 'playwright' as const,
          pattern: 'tests/e2e/**/*.spec.ts',
          timeout: 300000,
          parallel: true,
          retries: 1,
          reporter: 'html',
          coverage: false,
        },
      },
      {
        name: 'Performance Tests',
        config: {
          type: 'performance' as const,
          framework: 'artillery' as const,
          pattern: 'tests/performance/**/*.yml',
          timeout: 600000,
          parallel: false,
          retries: 0,
          reporter: 'json',
          coverage: false,
        },
      },
      {
        name: 'Security Tests',
        config: {
          type: 'security' as const,
          framework: 'lighthouse' as const,
          pattern: 'tests/security/**/*.test.ts',
          timeout: 120000,
          parallel: false,
          retries: 1,
          reporter: 'json',
          coverage: false,
        },
      },
    ];

    this.suites = testSuites.map((suite) => ({
      ...suite,
      results: [],
      status: 'pending' as const,
    }));
  }

  async runAllTests(): Promise<TestSuite[]> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    console.log('Starting comprehensive test run...');

    try {
      for (const suite of this.suites) {
        await this.runTestSuite(suite);
      }

      console.log('All tests completed');
      return this.suites;
    } finally {
      this.isRunning = false;
    }
  }

  async runTestSuite(suite: TestSuite): Promise<TestResult> {
    console.log(`Running ${suite.name}...`);
    suite.status = 'running';

    try {
      const result = await this.executeTestSuite(suite.config);
      suite.results.push(result);
      suite.lastRun = new Date();
      suite.status = result.success ? 'passed' : 'failed';

      console.log(
        `${suite.name} ${result.success ? 'PASSED' : 'FAILED'} (${result.duration}ms)`
      );
      return result;
    } catch (error) {
      const result: TestResult = {
        success: false,
        duration: 0,
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        output: '',
      };

      suite.results.push(result);
      suite.lastRun = new Date();
      suite.status = 'failed';

      console.error(`${suite.name} FAILED:`, error);
      return result;
    }
  }

  private async executeTestSuite(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    let command: string;
    let args: string[] = [];

    switch (config.framework) {
      case 'vitest':
        command = 'npx vitest run';
        args = [
          config.pattern ? `--reporter=${config.reporter}` : '',
          config.coverage ? '--coverage' : '',
          config.parallel ? '--threads' : '--no-threads',
          config.timeout ? `--testTimeout=${config.timeout}` : '',
          config.retries ? `--retry=${config.retries}` : '',
          config.pattern || '',
        ].filter(Boolean);
        break;

      case 'playwright':
        command = 'npx playwright test';
        args = [
          config.pattern || '',
          config.reporter ? `--reporter=${config.reporter}` : '',
          config.parallel ? '--workers=4' : '--workers=1',
          config.retries ? `--retries=${config.retries}` : '',
          config.timeout ? `--timeout=${config.timeout}` : '',
        ].filter(Boolean);
        break;

      case 'artillery':
        command = 'npx artillery run';
        args = [
          config.pattern || '',
          config.reporter ? `--output=${config.reporter}` : '',
        ].filter(Boolean);
        break;

      case 'lighthouse':
        command = 'npx lighthouse-ci autorun';
        args = [
          config.pattern ? `--config=${config.pattern}` : '',
          config.reporter ? `--output=${config.reporter}` : '',
        ].filter(Boolean);
        break;

      default:
        throw new Error(`Unsupported test framework: ${config.framework}`);
    }

    try {
      const { stdout, stderr } = await execAsync(
        `${command} ${args.join(' ')}`,
        {
          timeout: config.timeout || 300000,
          cwd: process.cwd(),
        }
      );

      const duration = Date.now() - startTime;
      const output = stdout + stderr;

      // Parse test results based on framework
      const results = this.parseTestResults(config.framework, output);

      return {
        success: results.failed === 0,
        duration,
        tests: results.tests,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        coverage: results.coverage,
        errors: results.errors,
        output,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        output: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private parseTestResults(framework: string, output: string): unknown {
    switch (framework) {
      case 'vitest':
        return this.parseVitestResults(output);
      case 'playwright':
        return this.parsePlaywrightResults(output);
      case 'artillery':
        return this.parseArtilleryResults(output);
      case 'lighthouse':
        return this.parseLighthouseResults(output);
      default:
        return { tests: 0, passed: 0, failed: 0, skipped: 0, errors: [] };
    }
  }

  private parseVitestResults(output: string): unknown {
    const testMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);
    const coverageMatch = output.match(/Coverage: (\d+\.?\d*)%/);

    return {
      tests:
        (testMatch ? parseInt(testMatch[1]) : 0) +
        (failMatch ? parseInt(failMatch[1]) : 0) +
        (skipMatch ? parseInt(skipMatch[1]) : 0),
      passed: testMatch ? parseInt(testMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0,
      skipped: skipMatch ? parseInt(skipMatch[1]) : 0,
      coverage: coverageMatch ? parseFloat(coverageMatch[1]) : undefined,
      errors: [],
    };
  }

  private parsePlaywrightResults(output: string): unknown {
    const testMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);

    return {
      tests:
        (testMatch ? parseInt(testMatch[1]) : 0) +
        (failMatch ? parseInt(failMatch[1]) : 0) +
        (skipMatch ? parseInt(skipMatch[1]) : 0),
      passed: testMatch ? parseInt(testMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0,
      skipped: skipMatch ? parseInt(skipMatch[1]) : 0,
      errors: [],
    };
  }

  private parseArtilleryResults(output: string): unknown {
    const summaryMatch = output.match(/Summary report/);
    const _durationMatch = output.match(/Duration: (\d+\.?\d*)s/);
    const _requestsMatch = output.match(/Total requests: (\d+)/);

    return {
      tests: 1,
      passed: summaryMatch ? 1 : 0,
      failed: summaryMatch ? 0 : 1,
      skipped: 0,
      errors: [],
    };
  }

  private parseLighthouseResults(output: string): unknown {
    const scoreMatch = output.match(/Performance: (\d+)/);
    const pwaMatch = output.match(/PWA: (\d+)/);
    const accessibilityMatch = output.match(/Accessibility: (\d+)/);

    const scores = [scoreMatch, pwaMatch, accessibilityMatch].filter(Boolean);
    const passed = scores.filter(
      (match) => match && parseInt(match[1]) >= 90
    ).length;

    return {
      tests: scores.length,
      passed,
      failed: scores.length - passed,
      skipped: 0,
      errors: [],
    };
  }

  async runSpecificTests(patterns: string[]): Promise<TestSuite[]> {
    const filteredSuites = this.suites.filter((suite) =>
      patterns.some((pattern) =>
        suite.name.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    for (const suite of filteredSuites) {
      await this.runTestSuite(suite);
    }

    return filteredSuites;
  }

  async runTestsByType(type: TestConfig['type']): Promise<TestSuite[]> {
    const filteredSuites = this.suites.filter(
      (suite) => suite.config.type === type
    );

    for (const suite of filteredSuites) {
      await this.runTestSuite(suite);
    }

    return filteredSuites;
  }

  getTestSuites(): TestSuite[] {
    return this.suites;
  }

  getTestSuite(name: string): TestSuite | undefined {
    return this.suites.find((suite) => suite.name === name);
  }

  getLastResults(): TestResult[] {
    return this.suites.flatMap((suite) => suite.results);
  }

  getOverallStatus(): 'pending' | 'running' | 'passed' | 'failed' | 'mixed' {
    if (this.isRunning) return 'running';

    const statuses = this.suites.map((suite) => suite.status);
    if (statuses.every((status) => status === 'passed')) return 'passed';
    if (statuses.every((status) => status === 'failed')) return 'failed';
    if (statuses.some((status) => status === 'failed')) return 'mixed';

    return 'pending';
  }

  async generateReport(): Promise<string> {
    const suites = this.suites;
    const totalTests = suites.reduce(
      (sum, suite) => sum + suite.results.reduce((s, r) => s + r.tests, 0),
      0
    );
    const totalPassed = suites.reduce(
      (sum, suite) => sum + suite.results.reduce((s, r) => s + r.passed, 0),
      0
    );
    const totalFailed = suites.reduce(
      (sum, suite) => sum + suite.results.reduce((s, r) => s + r.failed, 0),
      0
    );
    const totalDuration = suites.reduce(
      (sum, suite) => sum + suite.results.reduce((s, r) => s + r.duration, 0),
      0
    );

    const report = `
# Test Execution Report

## Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${totalPassed}
- **Failed**: ${totalFailed}
- **Success Rate**: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%
- **Total Duration**: ${(totalDuration / 1000).toFixed(2)}s

## Test Suites
${suites
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

## Overall Status: ${this.getOverallStatus().toUpperCase()}
`;

    return report;
  }

  async saveReport(filename?: string): Promise<void> {
    const report = await this.generateReport();
    const reportPath =
      filename || `test-report-${new Date().toISOString().split('T')[0]}.md`;

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`Test report saved to: ${reportPath}`);
  }
}
