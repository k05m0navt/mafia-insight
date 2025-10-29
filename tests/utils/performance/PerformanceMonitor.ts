import { performance } from 'perf_hooks';
import fs from 'fs/promises';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'memory' | 'cpu' | 'network' | 'rendering' | 'database' | 'api';
  threshold?: number;
  status: 'passed' | 'failed' | 'warning';
}

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: PerformanceMetric[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    score: number;
  };
}

export interface PerformanceThreshold {
  memory: {
    heapUsed: number; // MB
    heapTotal: number; // MB
    external: number; // MB
  };
  cpu: {
    usage: number; // percentage
    loadAverage: number;
  };
  network: {
    responseTime: number; // ms
    throughput: number; // requests per second
  };
  rendering: {
    firstPaint: number; // ms
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number; // ms
    cumulativeLayoutShift: number;
  };
  database: {
    queryTime: number; // ms
    connectionTime: number; // ms
  };
  api: {
    responseTime: number; // ms
    errorRate: number; // percentage
  };
}

export interface PerformanceReport {
  summary: PerformanceSnapshot['summary'];
  metrics: PerformanceMetric[];
  trends: {
    memory: number;
    cpu: number;
    network: number;
    rendering: number;
    database: number;
    api: number;
  };
  recommendations: string[];
  alerts: string[];
  historicalData: PerformanceSnapshot[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private threshold: PerformanceThreshold;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(threshold?: Partial<PerformanceThreshold>) {
    this.threshold = {
      memory: {
        heapUsed: threshold?.memory?.heapUsed || 100,
        heapTotal: threshold?.memory?.heapTotal || 200,
        external: threshold?.memory?.external || 50,
      },
      cpu: {
        usage: threshold?.cpu?.usage || 80,
        loadAverage: threshold?.cpu?.loadAverage || 2.0,
      },
      network: {
        responseTime: threshold?.network?.responseTime || 1000,
        throughput: threshold?.network?.throughput || 100,
      },
      rendering: {
        firstPaint: threshold?.rendering?.firstPaint || 2000,
        firstContentfulPaint:
          threshold?.rendering?.firstContentfulPaint || 3000,
        largestContentfulPaint:
          threshold?.rendering?.largestContentfulPaint || 4000,
        cumulativeLayoutShift:
          threshold?.rendering?.cumulativeLayoutShift || 0.1,
      },
      database: {
        queryTime: threshold?.database?.queryTime || 100,
        connectionTime: threshold?.database?.connectionTime || 50,
      },
      api: {
        responseTime: threshold?.api?.responseTime || 500,
        errorRate: threshold?.api?.errorRate || 5,
      },
    };
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.captureSnapshot();
    }, intervalMs);

    console.log(`Performance monitoring started with ${intervalMs}ms interval`);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Performance monitoring is not running');
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  private captureSnapshot(): void {
    const timestamp = new Date();
    const metrics = this.collectMetrics();

    const snapshot: PerformanceSnapshot = {
      timestamp,
      metrics,
      summary: this.calculateSummary(metrics),
    };

    this.snapshots.push(snapshot);
    this.metrics.push(...metrics);

    // Keep only last 100 snapshots to prevent memory issues
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }
  }

  private collectMetrics(): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = [];
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    metrics.push({
      name: 'heapUsed',
      value: memUsage.heapUsed / 1024 / 1024, // Convert to MB
      unit: 'MB',
      timestamp: new Date(),
      category: 'memory',
      threshold: this.threshold.memory.heapUsed,
      status: this.evaluateMetric(
        memUsage.heapUsed / 1024 / 1024,
        this.threshold.memory.heapUsed
      ),
    });

    metrics.push({
      name: 'heapTotal',
      value: memUsage.heapTotal / 1024 / 1024,
      unit: 'MB',
      timestamp: new Date(),
      category: 'memory',
      threshold: this.threshold.memory.heapTotal,
      status: this.evaluateMetric(
        memUsage.heapTotal / 1024 / 1024,
        this.threshold.memory.heapTotal
      ),
    });

    metrics.push({
      name: 'external',
      value: memUsage.external / 1024 / 1024,
      unit: 'MB',
      timestamp: new Date(),
      category: 'memory',
      threshold: this.threshold.memory.external,
      status: this.evaluateMetric(
        memUsage.external / 1024 / 1024,
        this.threshold.memory.external
      ),
    });

    // CPU metrics
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    metrics.push({
      name: 'cpuUsage',
      value: cpuUsagePercent,
      unit: 'seconds',
      timestamp: new Date(),
      category: 'cpu',
      threshold: this.threshold.cpu.usage,
      status: this.evaluateMetric(cpuUsagePercent, this.threshold.cpu.usage),
    });

    return metrics;
  }

  private evaluateMetric(
    value: number,
    threshold: number
  ): 'passed' | 'failed' | 'warning' {
    if (value <= threshold) return 'passed';
    if (value <= threshold * 1.2) return 'warning';
    return 'failed';
  }

  private calculateSummary(
    metrics: PerformanceMetric[]
  ): PerformanceSnapshot['summary'] {
    const total = metrics.length;
    const passed = metrics.filter((m) => m.status === 'passed').length;
    const failed = metrics.filter((m) => m.status === 'failed').length;
    const warning = metrics.filter((m) => m.status === 'warning').length;
    const score = total > 0 ? ((passed + warning * 0.5) / total) * 100 : 100;

    return { total, passed, failed, warning, score };
  }

  recordMetric(
    name: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    threshold?: number
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      threshold,
      status: threshold ? this.evaluateMetric(value, threshold) : 'passed',
    };

    this.metrics.push(metric);
  }

  recordTiming(
    name: string,
    startTime: number,
    category: PerformanceMetric['category']
  ): void {
    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, 'ms', category);
  }

  recordMemoryUsage(category: PerformanceMetric['category'] = 'memory'): void {
    const memUsage = process.memoryUsage();
    this.recordMetric(
      'heapUsed',
      memUsage.heapUsed / 1024 / 1024,
      'MB',
      category,
      this.threshold.memory.heapUsed
    );
    this.recordMetric(
      'heapTotal',
      memUsage.heapTotal / 1024 / 1024,
      'MB',
      category,
      this.threshold.memory.heapTotal
    );
    this.recordMetric(
      'external',
      memUsage.external / 1024 / 1024,
      'MB',
      category,
      this.threshold.memory.external
    );
  }

  recordNetworkMetric(
    name: string,
    responseTime: number,
    throughput?: number
  ): void {
    this.recordMetric(
      name,
      responseTime,
      'ms',
      'network',
      this.threshold.network.responseTime
    );

    if (throughput) {
      this.recordMetric(
        `${name}_throughput`,
        throughput,
        'req/s',
        'network',
        this.threshold.network.throughput
      );
    }
  }

  recordRenderingMetric(
    name: string,
    value: number,
    unit: string = 'ms'
  ): void {
    let threshold: number | undefined;

    switch (name) {
      case 'firstPaint':
        threshold = this.threshold.rendering.firstPaint;
        break;
      case 'firstContentfulPaint':
        threshold = this.threshold.rendering.firstContentfulPaint;
        break;
      case 'largestContentfulPaint':
        threshold = this.threshold.rendering.largestContentfulPaint;
        break;
      case 'cumulativeLayoutShift':
        threshold = this.threshold.rendering.cumulativeLayoutShift;
        break;
    }

    this.recordMetric(name, value, unit, 'rendering', threshold);
  }

  recordDatabaseMetric(name: string, value: number, unit: string = 'ms'): void {
    let threshold: number | undefined;

    switch (name) {
      case 'queryTime':
        threshold = this.threshold.database.queryTime;
        break;
      case 'connectionTime':
        threshold = this.threshold.database.connectionTime;
        break;
    }

    this.recordMetric(name, value, unit, 'database', threshold);
  }

  recordAPIMetric(
    name: string,
    responseTime: number,
    errorRate?: number
  ): void {
    this.recordMetric(
      name,
      responseTime,
      'ms',
      'api',
      this.threshold.api.responseTime
    );

    if (errorRate !== undefined) {
      this.recordMetric(
        `${name}_errorRate`,
        errorRate,
        '%',
        'api',
        this.threshold.api.errorRate
      );
    }
  }

  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  getMetricsByCategory(
    category: PerformanceMetric['category']
  ): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  getAverageMetric(
    name: string,
    category?: PerformanceMetric['category']
  ): number {
    const metrics = category
      ? this.metrics.filter((m) => m.name === name && m.category === category)
      : this.metrics.filter((m) => m.name === name);

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  generateReport(): PerformanceReport {
    const currentSnapshot = this.getCurrentSnapshot();
    if (!currentSnapshot) {
      throw new Error('No performance data available');
    }

    const trends = this.calculateTrends();
    const recommendations = this.generateRecommendations();
    const alerts = this.generateAlerts();

    return {
      summary: currentSnapshot.summary,
      metrics: currentSnapshot.metrics,
      trends,
      recommendations,
      alerts,
      historicalData: this.snapshots,
    };
  }

  private calculateTrends(): PerformanceReport['trends'] {
    if (this.snapshots.length < 2) {
      return {
        memory: 0,
        cpu: 0,
        network: 0,
        rendering: 0,
        database: 0,
        api: 0,
      };
    }

    const current = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    const calculateTrend = (category: PerformanceMetric['category']) => {
      const currentMetrics = current.metrics.filter(
        (m) => m.category === category
      );
      const previousMetrics = previous.metrics.filter(
        (m) => m.category === category
      );

      if (currentMetrics.length === 0 || previousMetrics.length === 0) return 0;

      const currentAvg =
        currentMetrics.reduce((sum, m) => sum + m.value, 0) /
        currentMetrics.length;
      const previousAvg =
        previousMetrics.reduce((sum, m) => sum + m.value, 0) /
        previousMetrics.length;

      return currentAvg - previousAvg;
    };

    return {
      memory: calculateTrend('memory'),
      cpu: calculateTrend('cpu'),
      network: calculateTrend('network'),
      rendering: calculateTrend('rendering'),
      database: calculateTrend('database'),
      api: calculateTrend('api'),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentSnapshot = this.getCurrentSnapshot();

    if (!currentSnapshot) return recommendations;

    const failedMetrics = currentSnapshot.metrics.filter(
      (m) => m.status === 'failed'
    );
    const warningMetrics = currentSnapshot.metrics.filter(
      (m) => m.status === 'warning'
    );

    if (failedMetrics.length > 0) {
      recommendations.push(
        `Address ${failedMetrics.length} critical performance issues`
      );
    }

    if (warningMetrics.length > 0) {
      recommendations.push(
        `Monitor ${warningMetrics.length} performance warnings`
      );
    }

    // Specific recommendations based on metrics
    const memoryMetrics = currentSnapshot.metrics.filter(
      (m) => m.category === 'memory'
    );
    const highMemoryUsage = memoryMetrics.filter(
      (m) => m.status === 'failed' || m.status === 'warning'
    );

    if (highMemoryUsage.length > 0) {
      recommendations.push(
        'Consider optimizing memory usage or increasing memory limits'
      );
    }

    const cpuMetrics = currentSnapshot.metrics.filter(
      (m) => m.category === 'cpu'
    );
    const highCpuUsage = cpuMetrics.filter(
      (m) => m.status === 'failed' || m.status === 'warning'
    );

    if (highCpuUsage.length > 0) {
      recommendations.push(
        'Consider optimizing CPU-intensive operations or scaling horizontally'
      );
    }

    return recommendations;
  }

  private generateAlerts(): string[] {
    const alerts: string[] = [];
    const currentSnapshot = this.getCurrentSnapshot();

    if (!currentSnapshot) return alerts;

    const failedMetrics = currentSnapshot.metrics.filter(
      (m) => m.status === 'failed'
    );

    for (const metric of failedMetrics) {
      alerts.push(
        `CRITICAL: ${metric.name} exceeded threshold (${metric.value}${metric.unit} > ${metric.threshold}${metric.unit})`
      );
    }

    return alerts;
  }

  async saveReport(filename?: string): Promise<void> {
    const report = this.generateReport();
    const reportPath =
      filename ||
      `performance-report-${new Date().toISOString().split('T')[0]}.json`;

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Performance report saved to: ${reportPath}`);
  }

  async exportData(filename: string): Promise<void> {
    const data = {
      metrics: this.metrics,
      snapshots: this.snapshots,
      threshold: this.threshold,
      exportedAt: new Date().toISOString(),
    };

    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Performance data exported to: ${filename}`);
  }

  setThreshold(threshold: Partial<PerformanceThreshold>): void {
    this.threshold = {
      memory: { ...this.threshold.memory, ...threshold.memory },
      cpu: { ...this.threshold.cpu, ...threshold.cpu },
      network: { ...this.threshold.network, ...threshold.network },
      rendering: { ...this.threshold.rendering, ...threshold.rendering },
      database: { ...this.threshold.database, ...threshold.database },
      api: { ...this.threshold.api, ...threshold.api },
    };
  }

  getThreshold(): PerformanceThreshold {
    return { ...this.threshold };
  }

  clearData(): void {
    this.metrics = [];
    this.snapshots = [];
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}
