export class E2EValidator {
  /**
   * Validate E2E test execution
   */
  validateExecution(result: TestExecutionResult): ValidationResult {
    const issues: string[] = [];

    if (result.totalTests === 0) {
      issues.push('No tests executed');
    }

    if (result.failedTests > 0) {
      issues.push(`${result.failedTests} test(s) failed`);
    }

    if (result.duration > 300000) {
      issues.push('Test execution exceeded 5 minutes');
    }

    if (result.passRate < 0.95) {
      issues.push(`Pass rate below threshold: ${result.passRate * 100}%`);
    }

    return {
      valid: issues.length === 0,
      issues,
      passRate: result.passRate,
    };
  }

  /**
   * Validate E2E test coverage
   */
  validateCoverage(coverage: CoverageMetrics): ValidationResult {
    const issues: string[] = [];

    if (coverage.lines < 0.8) {
      issues.push(`Line coverage below 80%: ${coverage.lines * 100}%`);
    }

    if (coverage.functions < 0.8) {
      issues.push(`Function coverage below 80%: ${coverage.functions * 100}%`);
    }

    if (coverage.branches < 0.8) {
      issues.push(`Branch coverage below 80%: ${coverage.branches * 100}%`);
    }

    return {
      valid: issues.length === 0,
      issues,
      passRate: (coverage.lines + coverage.functions + coverage.branches) / 3,
    };
  }

  /**
   * Validate test performance
   */
  validatePerformance(metrics: PerformanceMetrics): ValidationResult {
    const issues: string[] = [];

    if (metrics.averageResponseTime > 2000) {
      issues.push(
        `Average response time too high: ${metrics.averageResponseTime}ms`
      );
    }

    if (metrics.p95ResponseTime > 5000) {
      issues.push(`P95 response time too high: ${metrics.p95ResponseTime}ms`);
    }

    if (metrics.errorRate > 0.05) {
      issues.push(`Error rate too high: ${metrics.errorRate * 100}%`);
    }

    return {
      valid: issues.length === 0,
      issues,
      passRate: 1 - metrics.errorRate,
    };
  }
}

export interface TestExecutionResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  passRate: number;
}

export interface CoverageMetrics {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  passRate: number;
}
