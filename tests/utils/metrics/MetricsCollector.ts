import { TestExecution, TestMetrics } from '../models/TestExecution';
import {
  TestReport as _TestReport,
  PerformanceMetrics as _PerformanceMetrics,
  CoverageMetrics,
  SecurityMetrics,
} from '../models/TestReport';

export interface MetricsData {
  timestamp: Date;
  testId: string;
  suiteId: string;
  executionId: string;
  metrics: TestMetrics;
  environment: string;
  browser: string;
  device: string;
}

export interface AggregatedMetrics {
  totalExecutions: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  averageThroughput: number;
  maxThroughput: number;
  averageMemoryUsage: number;
  maxMemoryUsage: number;
  averageCpuUsage: number;
  maxCpuUsage: number;
  averageNetworkLatency: number;
  maxNetworkLatency: number;
  errorRate: number;
  successRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceTrend {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
}

export interface CoverageTrend {
  timestamp: Date;
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  overall: number;
}

export interface SecurityTrend {
  timestamp: Date;
  vulnerabilities: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  securityScore: number;
  complianceScore: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricsData> = new Map();
  private performanceTrends: PerformanceTrend[] = [];
  private coverageTrends: CoverageTrend[] = [];
  private securityTrends: SecurityTrend[] = [];

  collectMetrics(execution: TestExecution, environment: string): void {
    const metricsData: MetricsData = {
      timestamp: new Date(),
      testId: execution.testCaseId,
      suiteId: execution.suiteId,
      executionId: execution.executionId,
      metrics: execution.metrics,
      environment,
      browser: execution.browser || 'Unknown',
      device: execution.device || 'Unknown',
    };

    this.metrics.set(execution.id, metricsData);
    this.updatePerformanceTrends(metricsData);
  }

  collectCoverageMetrics(coverage: CoverageMetrics): void {
    const coverageTrend: CoverageTrend = {
      timestamp: new Date(),
      lines: coverage.lines,
      functions: coverage.functions,
      branches: coverage.branches,
      statements: coverage.statements,
      overall: coverage.overall,
    };

    this.coverageTrends.push(coverageTrend);
  }

  collectSecurityMetrics(security: SecurityMetrics): void {
    const securityTrend: SecurityTrend = {
      timestamp: new Date(),
      vulnerabilities: security.vulnerabilities,
      criticalIssues: security.criticalIssues,
      highIssues: security.highIssues,
      mediumIssues: security.mediumIssues,
      lowIssues: security.lowIssues,
      securityScore: security.securityScore,
      complianceScore: security.complianceScore,
    };

    this.securityTrends.push(securityTrend);
  }

  getAggregatedMetrics(
    suiteId?: string,
    environment?: string,
    timeRange?: { start: Date; end: Date }
  ): AggregatedMetrics {
    let filteredMetrics = Array.from(this.metrics.values());

    if (suiteId) {
      filteredMetrics = filteredMetrics.filter((m) => m.suiteId === suiteId);
    }

    if (environment) {
      filteredMetrics = filteredMetrics.filter(
        (m) => m.environment === environment
      );
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return this.getEmptyAggregatedMetrics();
    }

    const responseTimes = filteredMetrics.map((m) => m.metrics.responseTime);
    const throughputs = filteredMetrics.map((m) => m.metrics.throughput);
    const memoryUsages = filteredMetrics.map((m) => m.metrics.memoryUsage);
    const cpuUsages = filteredMetrics.map((m) => m.metrics.cpuUsage);
    const networkLatencies = filteredMetrics.map(
      (m) => m.metrics.networkLatency
    );
    const errorRates = filteredMetrics.map((m) => m.metrics.errorRate);
    const successRates = filteredMetrics.map((m) => m.metrics.successRate);

    const timestamps = filteredMetrics.map((m) => m.timestamp);

    return {
      totalExecutions: filteredMetrics.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      averageThroughput: this.calculateAverage(throughputs),
      maxThroughput: Math.max(...throughputs),
      averageMemoryUsage: this.calculateAverage(memoryUsages),
      maxMemoryUsage: Math.max(...memoryUsages),
      averageCpuUsage: this.calculateAverage(cpuUsages),
      maxCpuUsage: Math.max(...cpuUsages),
      averageNetworkLatency: this.calculateAverage(networkLatencies),
      maxNetworkLatency: Math.max(...networkLatencies),
      errorRate: this.calculateAverage(errorRates),
      successRate: this.calculateAverage(successRates),
      timeRange: {
        start: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
        end: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      },
    };
  }

  getPerformanceTrends(
    suiteId?: string,
    environment?: string,
    timeRange?: { start: Date; end: Date }
  ): PerformanceTrend[] {
    let filteredTrends = this.performanceTrends;

    if (timeRange) {
      filteredTrends = filteredTrends.filter(
        (t) => t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
      );
    }

    return filteredTrends.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  getCoverageTrends(timeRange?: { start: Date; end: Date }): CoverageTrend[] {
    let filteredTrends = this.coverageTrends;

    if (timeRange) {
      filteredTrends = filteredTrends.filter(
        (t) => t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
      );
    }

    return filteredTrends.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  getSecurityTrends(timeRange?: { start: Date; end: Date }): SecurityTrend[] {
    let filteredTrends = this.securityTrends;

    if (timeRange) {
      filteredTrends = filteredTrends.filter(
        (t) => t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
      );
    }

    return filteredTrends.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  getMetricsByEnvironment(): Map<string, MetricsData[]> {
    const environmentMap = new Map<string, MetricsData[]>();

    for (const metrics of this.metrics.values()) {
      if (!environmentMap.has(metrics.environment)) {
        environmentMap.set(metrics.environment, []);
      }
      environmentMap.get(metrics.environment)!.push(metrics);
    }

    return environmentMap;
  }

  getMetricsByBrowser(): Map<string, MetricsData[]> {
    const browserMap = new Map<string, MetricsData[]>();

    for (const metrics of this.metrics.values()) {
      if (!browserMap.has(metrics.browser)) {
        browserMap.set(metrics.browser, []);
      }
      browserMap.get(metrics.browser)!.push(metrics);
    }

    return browserMap;
  }

  getMetricsByDevice(): Map<string, MetricsData[]> {
    const deviceMap = new Map<string, MetricsData[]>();

    for (const metrics of this.metrics.values()) {
      if (!deviceMap.has(metrics.device)) {
        deviceMap.set(metrics.device, []);
      }
      deviceMap.get(metrics.device)!.push(metrics);
    }

    return deviceMap;
  }

  getMetricsBySuite(): Map<string, MetricsData[]> {
    const suiteMap = new Map<string, MetricsData[]>();

    for (const metrics of this.metrics.values()) {
      if (!suiteMap.has(metrics.suiteId)) {
        suiteMap.set(metrics.suiteId, []);
      }
      suiteMap.get(metrics.suiteId)!.push(metrics);
    }

    return suiteMap;
  }

  getLatestMetrics(count: number = 10): MetricsData[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  getMetricsSummary(): {
    totalMetrics: number;
    environments: string[];
    browsers: string[];
    devices: string[];
    suites: string[];
    timeRange: { start: Date; end: Date } | null;
  } {
    const metrics = Array.from(this.metrics.values());
    const environments = [...new Set(metrics.map((m) => m.environment))];
    const browsers = [...new Set(metrics.map((m) => m.browser))];
    const devices = [...new Set(metrics.map((m) => m.device))];
    const suites = [...new Set(metrics.map((m) => m.suiteId))];

    let timeRange: { start: Date; end: Date } | null = null;
    if (metrics.length > 0) {
      const timestamps = metrics.map((m) => m.timestamp);
      timeRange = {
        start: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
        end: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      };
    }

    return {
      totalMetrics: metrics.length,
      environments,
      browsers,
      devices,
      suites,
      timeRange,
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.performanceTrends = [];
    this.coverageTrends = [];
    this.securityTrends = [];
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const metrics = Array.from(this.metrics.values());

    if (format === 'csv') {
      return this.exportToCSV(metrics);
    }

    return JSON.stringify(metrics, null, 2);
  }

  private updatePerformanceTrends(metricsData: MetricsData): void {
    const trend: PerformanceTrend = {
      timestamp: metricsData.timestamp,
      responseTime: metricsData.metrics.responseTime,
      throughput: metricsData.metrics.throughput,
      memoryUsage: metricsData.metrics.memoryUsage,
      cpuUsage: metricsData.metrics.cpuUsage,
      errorRate: metricsData.metrics.errorRate,
    };

    this.performanceTrends.push(trend);
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;

    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private getEmptyAggregatedMetrics(): AggregatedMetrics {
    return {
      totalExecutions: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      averageThroughput: 0,
      maxThroughput: 0,
      averageMemoryUsage: 0,
      maxMemoryUsage: 0,
      averageCpuUsage: 0,
      maxCpuUsage: 0,
      averageNetworkLatency: 0,
      maxNetworkLatency: 0,
      errorRate: 0,
      successRate: 0,
      timeRange: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  private exportToCSV(metrics: MetricsData[]): string {
    if (metrics.length === 0) return '';

    const headers = [
      'timestamp',
      'testId',
      'suiteId',
      'executionId',
      'environment',
      'browser',
      'device',
      'responseTime',
      'throughput',
      'memoryUsage',
      'cpuUsage',
      'networkLatency',
      'errorRate',
      'successRate',
    ];

    const rows = metrics.map((m) => [
      m.timestamp.toISOString(),
      m.testId,
      m.suiteId,
      m.executionId,
      m.environment,
      m.browser,
      m.device,
      m.metrics.responseTime.toString(),
      m.metrics.throughput.toString(),
      m.metrics.memoryUsage.toString(),
      m.metrics.cpuUsage.toString(),
      m.metrics.networkLatency.toString(),
      m.metrics.errorRate.toString(),
      m.metrics.successRate.toString(),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}
