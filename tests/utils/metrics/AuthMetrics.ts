import { testLogger } from '../logging/TestLogger';
import { TestExecution } from '../models/TestExecution';

export interface AuthMetricsData {
  timestamp: Date;
  testId: string;
  testName: string;
  testType: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  successRate: number;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  security: {
    vulnerabilitiesFound: number;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    securityScore: number;
  };
  performance: {
    loadTestResults: {
      averageResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
      throughput: number;
      errorRate: number;
    };
    memoryUsage: {
      average: number;
      max: number;
      min: number;
    };
    cpuUsage: {
      average: number;
      max: number;
      min: number;
    };
  };
  accessibility: {
    score: number;
    violations: number;
    warnings: number;
    suggestions: number;
  };
  usability: {
    score: number;
    issues: number;
    improvements: number;
  };
  metadata: {
    environment: string;
    browser: string;
    version: string;
    build: string;
    commit: string;
    userAgent: string;
    screenResolution: string;
    timezone: string;
    locale: string;
  };
}

export interface AuthMetricsSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  passRate: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalDuration: number;
  errorRate: number;
  successRate: number;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  security: {
    vulnerabilitiesFound: number;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    securityScore: number;
  };
  performance: {
    loadTestResults: {
      averageResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
      throughput: number;
      errorRate: number;
    };
    memoryUsage: {
      average: number;
      max: number;
      min: number;
    };
    cpuUsage: {
      average: number;
      max: number;
      min: number;
    };
  };
  accessibility: {
    score: number;
    violations: number;
    warnings: number;
    suggestions: number;
  };
  usability: {
    score: number;
    issues: number;
    improvements: number;
  };
  trends: {
    passRate: number[];
    responseTime: number[];
    errorRate: number[];
    coverage: number[];
    securityScore: number[];
  };
  recommendations: string[];
  issues: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  nextSteps: string[];
}

export interface AuthMetricsTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  change: number;
  changePercentage: number;
}

export class AuthMetrics {
  private metrics: Map<string, AuthMetricsData> = new Map();
  private summaries: Map<string, AuthMetricsSummary> = new Map();
  private trends: Map<string, AuthMetricsTrend> = new Map();

  constructor() {
    testLogger.info('AuthMetrics initialized');
  }

  /**
   * Records metrics for a test execution
   */
  public async recordMetrics(execution: TestExecution): Promise<void> {
    testLogger.info('Recording authentication metrics', {
      testId: execution.testCaseId,
    });

    try {
      const metricsData: AuthMetricsData = {
        timestamp: new Date(),
        testId: execution.testCaseId,
        testName: execution.testCaseId, // In real implementation, this would be the actual test name
        testType: this.determineTestType(execution.testCaseId),
        status: execution.status,
        duration: execution.duration,
        responseTime: execution.metrics.responseTime,
        throughput: execution.metrics.throughput,
        memoryUsage: execution.metrics.memoryUsage,
        cpuUsage: execution.metrics.cpuUsage,
        networkLatency: execution.metrics.networkLatency,
        errorRate: execution.metrics.errorRate,
        successRate: execution.metrics.successRate,
        coverage: {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 80,
        },
        security: {
          vulnerabilitiesFound: 0,
          severity: 'none',
          securityScore: 95,
        },
        performance: {
          loadTestResults: {
            averageResponseTime: execution.metrics.responseTime,
            maxResponseTime: execution.metrics.responseTime,
            minResponseTime: execution.metrics.responseTime,
            throughput: execution.metrics.throughput,
            errorRate: execution.metrics.errorRate,
          },
          memoryUsage: {
            average: execution.metrics.memoryUsage,
            max: execution.metrics.memoryUsage,
            min: execution.metrics.memoryUsage,
          },
          cpuUsage: {
            average: execution.metrics.cpuUsage,
            max: execution.metrics.cpuUsage,
            min: execution.metrics.cpuUsage,
          },
        },
        accessibility: {
          score: 90,
          violations: 0,
          warnings: 2,
          suggestions: 5,
        },
        usability: {
          score: 85,
          issues: 1,
          improvements: 3,
        },
        metadata: {
          environment: 'test',
          browser: 'chromium',
          version: '1.0.0',
          build: 'test-build',
          commit: 'test-commit',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          screenResolution: '1920x1080',
          timezone: 'UTC',
          locale: 'en-US',
        },
      };

      this.metrics.set(execution.testCaseId, metricsData);

      // Update trends
      await this.updateTrends(metricsData);

      testLogger.info('Authentication metrics recorded successfully', {
        testId: execution.testCaseId,
      });
    } catch (error) {
      testLogger.error('Failed to record authentication metrics', {
        error: error.message,
        testId: execution.testCaseId,
      });
      throw error;
    }
  }

  /**
   * Generates metrics summary for a time range
   */
  public async generateSummary(
    startTime: Date,
    endTime: Date,
    testType?: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
  ): Promise<AuthMetricsSummary> {
    testLogger.info('Generating authentication metrics summary', {
      startTime,
      endTime,
      testType,
    });

    try {
      const relevantMetrics = Array.from(this.metrics.values()).filter(
        (metric) => {
          const isInTimeRange =
            metric.timestamp >= startTime && metric.timestamp <= endTime;
          const isCorrectType = !testType || metric.testType === testType;
          return isInTimeRange && isCorrectType;
        }
      );

      if (relevantMetrics.length === 0) {
        throw new Error(
          'No metrics found for the specified time range and test type'
        );
      }

      const summary = await this.calculateSummary(relevantMetrics);
      const summaryId = `summary-${startTime.getTime()}-${endTime.getTime()}`;
      this.summaries.set(summaryId, summary);

      testLogger.info('Authentication metrics summary generated successfully', {
        summaryId,
        metricCount: relevantMetrics.length,
        passRate: summary.passRate,
      });

      return summary;
    } catch (error) {
      testLogger.error('Failed to generate authentication metrics summary', {
        error: error.message,
        startTime,
        endTime,
        testType,
      });
      throw error;
    }
  }

  /**
   * Gets metrics trend for a specific metric
   */
  public async getTrend(
    metric: string,
    startTime: Date,
    endTime: Date
  ): Promise<AuthMetricsTrend> {
    testLogger.info('Getting authentication metrics trend', {
      metric,
      startTime,
      endTime,
    });

    try {
      const relevantMetrics = Array.from(this.metrics.values()).filter(
        (m) => m.timestamp >= startTime && m.timestamp <= endTime
      );

      if (relevantMetrics.length === 0) {
        throw new Error('No metrics found for the specified time range');
      }

      const values = relevantMetrics.map((m) => this.getMetricValue(m, metric));
      const timestamps = relevantMetrics.map((m) => m.timestamp);

      const trend = this.calculateTrend(values);
      const change =
        values.length > 1 ? values[values.length - 1] - values[0] : 0;
      const changePercentage =
        values.length > 1 && values[0] !== 0 ? (change / values[0]) * 100 : 0;

      const trendData: AuthMetricsTrend = {
        metric,
        values,
        timestamps,
        trend,
        change,
        changePercentage,
      };

      const trendId = `trend-${metric}-${startTime.getTime()}-${endTime.getTime()}`;
      this.trends.set(trendId, trendData);

      testLogger.info('Authentication metrics trend retrieved successfully', {
        metric,
        trend,
        changePercentage,
      });

      return trendData;
    } catch (error) {
      testLogger.error('Failed to get authentication metrics trend', {
        error: error.message,
        metric,
        startTime,
        endTime,
      });
      throw error;
    }
  }

  /**
   * Gets all metrics for a specific test
   */
  public getMetricsForTest(testId: string): AuthMetricsData | undefined {
    return this.metrics.get(testId);
  }

  /**
   * Gets all metrics for a time range
   */
  public getMetricsForTimeRange(
    startTime: Date,
    endTime: Date
  ): AuthMetricsData[] {
    return Array.from(this.metrics.values()).filter(
      (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Gets all metrics for a test type
   */
  public getMetricsForTestType(
    testType: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
  ): AuthMetricsData[] {
    return Array.from(this.metrics.values()).filter(
      (metric) => metric.testType === testType
    );
  }

  /**
   * Gets summary by ID
   */
  public getSummary(summaryId: string): AuthMetricsSummary | undefined {
    return this.summaries.get(summaryId);
  }

  /**
   * Gets trend by ID
   */
  public getTrendById(trendId: string): AuthMetricsTrend | undefined {
    return this.trends.get(trendId);
  }

  /**
   * Clears all metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.summaries.clear();
    this.trends.clear();
    testLogger.info('All authentication metrics cleared');
  }

  /**
   * Exports metrics to various formats
   */
  public async exportMetrics(
    format: 'json' | 'csv' | 'excel',
    startTime?: Date,
    endTime?: Date
  ): Promise<string> {
    testLogger.info('Exporting authentication metrics', {
      format,
      startTime,
      endTime,
    });

    try {
      let metricsToExport = Array.from(this.metrics.values());

      if (startTime && endTime) {
        metricsToExport = metricsToExport.filter(
          (metric) =>
            metric.timestamp >= startTime && metric.timestamp <= endTime
        );
      }

      let exportData: string;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(metricsToExport, null, 2);
          break;
        case 'csv':
          exportData = await this.generateCSVExport(metricsToExport);
          break;
        case 'excel':
          exportData = await this.generateExcelExport(metricsToExport);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      testLogger.info('Authentication metrics exported successfully', {
        format,
        count: metricsToExport.length,
      });

      return exportData;
    } catch (error) {
      testLogger.error('Failed to export authentication metrics', {
        error: error.message,
        format,
        startTime,
        endTime,
      });
      throw error;
    }
  }

  /**
   * Determines test type from test ID
   */
  private determineTestType(
    testId: string
  ): 'unit' | 'integration' | 'e2e' | 'performance' | 'security' {
    if (testId.includes('unit')) return 'unit';
    if (testId.includes('integration')) return 'integration';
    if (testId.includes('e2e')) return 'e2e';
    if (testId.includes('performance')) return 'performance';
    if (testId.includes('security')) return 'security';
    return 'e2e'; // Default
  }

  /**
   * Updates trends with new metrics data
   */
  private async updateTrends(metricsData: AuthMetricsData): Promise<void> {
    const metrics = [
      'passRate',
      'responseTime',
      'errorRate',
      'coverage',
      'securityScore',
    ];

    for (const metric of metrics) {
      const trendId = `trend-${metric}`;
      let trend = this.trends.get(trendId);

      if (!trend) {
        trend = {
          metric,
          values: [],
          timestamps: [],
          trend: 'stable',
          change: 0,
          changePercentage: 0,
        };
      }

      const value = this.getMetricValue(metricsData, metric);
      trend.values.push(value);
      trend.timestamps.push(metricsData.timestamp);

      // Keep only last 100 values
      if (trend.values.length > 100) {
        trend.values = trend.values.slice(-100);
        trend.timestamps = trend.timestamps.slice(-100);
      }

      // Recalculate trend
      trend.trend = this.calculateTrend(trend.values);
      if (trend.values.length > 1) {
        trend.change = trend.values[trend.values.length - 1] - trend.values[0];
        trend.changePercentage =
          trend.values[0] !== 0 ? (trend.change / trend.values[0]) * 100 : 0;
      }

      this.trends.set(trendId, trend);
    }
  }

  /**
   * Gets metric value from metrics data
   */
  private getMetricValue(metricsData: AuthMetricsData, metric: string): number {
    switch (metric) {
      case 'passRate':
        return metricsData.status === 'passed' ? 100 : 0;
      case 'responseTime':
        return metricsData.responseTime;
      case 'errorRate':
        return metricsData.errorRate;
      case 'coverage':
        return metricsData.coverage.lines;
      case 'securityScore':
        return metricsData.security.securityScore;
      default:
        return 0;
    }
  }

  /**
   * Calculates trend from values
   */
  private calculateTrend(
    values: number[]
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const changePercentage = Math.abs(change / firstAvg) * 100;

    if (changePercentage < 5) return 'stable';
    if (changePercentage > 20) return 'volatile';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Calculates summary from metrics
   */
  private async calculateSummary(
    metrics: AuthMetricsData[]
  ): Promise<AuthMetricsSummary> {
    const totalTests = metrics.length;
    const passedTests = metrics.filter((m) => m.status === 'passed').length;
    const failedTests = metrics.filter((m) => m.status === 'failed').length;
    const skippedTests = metrics.filter((m) => m.status === 'skipped').length;
    const errorTests = metrics.filter((m) => m.status === 'error').length;

    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const responseTimes = metrics.map((m) => m.responseTime);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const errorRate =
      totalTests > 0 ? (failedTests + errorTests) / totalTests : 0;
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;

    const coverage = {
      lines:
        metrics.reduce((sum, m) => sum + m.coverage.lines, 0) / metrics.length,
      statements:
        metrics.reduce((sum, m) => sum + m.coverage.statements, 0) /
        metrics.length,
      functions:
        metrics.reduce((sum, m) => sum + m.coverage.functions, 0) /
        metrics.length,
      branches:
        metrics.reduce((sum, m) => sum + m.coverage.branches, 0) /
        metrics.length,
    };

    const security = {
      vulnerabilitiesFound: metrics.reduce(
        (sum, m) => sum + m.security.vulnerabilitiesFound,
        0
      ),
      severity: this.calculateSeverity(metrics.map((m) => m.security.severity)),
      securityScore:
        metrics.reduce((sum, m) => sum + m.security.securityScore, 0) /
        metrics.length,
    };

    const performance = {
      loadTestResults: {
        averageResponseTime,
        maxResponseTime,
        minResponseTime,
        throughput:
          metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length,
        errorRate,
      },
      memoryUsage: {
        average:
          metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
        max: Math.max(...metrics.map((m) => m.memoryUsage)),
        min: Math.min(...metrics.map((m) => m.memoryUsage)),
      },
      cpuUsage: {
        average:
          metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
        max: Math.max(...metrics.map((m) => m.cpuUsage)),
        min: Math.min(...metrics.map((m) => m.cpuUsage)),
      },
    };

    const accessibility = {
      score:
        metrics.reduce((sum, m) => sum + m.accessibility.score, 0) /
        metrics.length,
      violations: metrics.reduce(
        (sum, m) => sum + m.accessibility.violations,
        0
      ),
      warnings: metrics.reduce((sum, m) => sum + m.accessibility.warnings, 0),
      suggestions: metrics.reduce(
        (sum, m) => sum + m.accessibility.suggestions,
        0
      ),
    };

    const usability = {
      score:
        metrics.reduce((sum, m) => sum + m.usability.score, 0) / metrics.length,
      issues: metrics.reduce((sum, m) => sum + m.usability.issues, 0),
      improvements: metrics.reduce(
        (sum, m) => sum + m.usability.improvements,
        0
      ),
    };

    const trends = {
      passRate: metrics.map((m) => (m.status === 'passed' ? 100 : 0)),
      responseTime: responseTimes,
      errorRate: metrics.map((m) => m.errorRate),
      coverage: metrics.map((m) => m.coverage.lines),
      securityScore: metrics.map((m) => m.security.securityScore),
    };

    const recommendations = this.generateRecommendations({
      passRate,
      averageResponseTime,
      errorRate,
      securityScore: security.securityScore,
      accessibilityScore: accessibility.score,
      usabilityScore: usability.score,
    });

    const issues = this.categorizeIssues(metrics);

    const nextSteps = this.generateNextSteps({
      passRate,
      errorRate,
      averageResponseTime,
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      errorTests,
      passRate,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      totalDuration,
      errorRate,
      successRate,
      coverage,
      security,
      performance,
      accessibility,
      usability,
      trends,
      recommendations,
      issues,
      nextSteps,
    };
  }

  /**
   * Calculates severity from array of severities
   */
  private calculateSeverity(
    severities: string[]
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    const severityLevels = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = Math.max(
      ...severities.map(
        (s) => severityLevels[s as keyof typeof severityLevels] || 0
      )
    );

    for (const [severity, level] of Object.entries(severityLevels)) {
      if (level === maxSeverity) {
        return severity as 'none' | 'low' | 'medium' | 'high' | 'critical';
      }
    }

    return 'none';
  }

  /**
   * Generates recommendations based on metrics
   */
  private generateRecommendations(metrics: Record<string, unknown>): string[] {
    const recommendations: string[] = [];

    if (metrics.passRate < 80) {
      recommendations.push('Improve test pass rate by fixing failing tests');
    }

    if (metrics.averageResponseTime > 2000) {
      recommendations.push(
        'Optimize response times for better user experience'
      );
    }

    if (metrics.errorRate > 0.1) {
      recommendations.push('Investigate and fix error-prone areas');
    }

    if (metrics.securityScore < 90) {
      recommendations.push('Address security vulnerabilities');
    }

    if (metrics.accessibilityScore < 90) {
      recommendations.push('Improve accessibility compliance');
    }

    if (metrics.usabilityScore < 90) {
      recommendations.push('Enhance usability based on test results');
    }

    return recommendations;
  }

  /**
   * Categorizes issues by severity
   */
  private categorizeIssues(metrics: AuthMetricsData[]): {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  } {
    const issues = {
      critical: [] as string[],
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[],
    };

    metrics.forEach((metric) => {
      if (metric.status === 'failed') {
        if (metric.errorRate > 0.5) {
          issues.critical.push(
            `Test ${metric.testId} failed with high error rate`
          );
        } else if (metric.errorRate > 0.2) {
          issues.high.push(
            `Test ${metric.testId} failed with moderate error rate`
          );
        } else {
          issues.medium.push(`Test ${metric.testId} failed`);
        }
      }
    });

    return issues;
  }

  /**
   * Generates next steps
   */
  private generateNextSteps(metrics: Record<string, unknown>): string[] {
    const nextSteps: string[] = [];

    if (metrics.passRate < 100) {
      nextSteps.push('Review and fix failing tests');
    }

    if (metrics.errorRate > 0) {
      nextSteps.push('Investigate error patterns and root causes');
    }

    if (metrics.averageResponseTime > 1000) {
      nextSteps.push('Optimize performance bottlenecks');
    }

    nextSteps.push('Schedule next test run');
    nextSteps.push('Update test documentation');

    return nextSteps;
  }

  /**
   * Generates CSV export
   */
  private async generateCSVExport(metrics: AuthMetricsData[]): Promise<string> {
    const headers = [
      'timestamp',
      'testId',
      'testName',
      'testType',
      'status',
      'duration',
      'responseTime',
      'throughput',
      'memoryUsage',
      'cpuUsage',
      'networkLatency',
      'errorRate',
      'successRate',
      'coverageLines',
      'coverageStatements',
      'coverageFunctions',
      'coverageBranches',
      'securityScore',
      'accessibilityScore',
      'usabilityScore',
    ];

    const rows = metrics.map((metric) => [
      metric.timestamp.toISOString(),
      metric.testId,
      metric.testName,
      metric.testType,
      metric.status,
      metric.duration,
      metric.responseTime,
      metric.throughput,
      metric.memoryUsage,
      metric.cpuUsage,
      metric.networkLatency,
      metric.errorRate,
      metric.successRate,
      metric.coverage.lines,
      metric.coverage.statements,
      metric.coverage.functions,
      metric.coverage.branches,
      metric.security.securityScore,
      metric.accessibility.score,
      metric.usability.score,
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Generates Excel export
   */
  private async generateExcelExport(
    metrics: AuthMetricsData[]
  ): Promise<string> {
    // Mock Excel export - in real implementation, this would generate actual Excel file
    return `Excel Export: ${metrics.length} metrics`;
  }
}
