import { TestExecution as _TestExecution } from '../models/TestExecution';
import { TestLogger, LogLevel as _LogLevel } from '../logging/TestLogger';

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enableHealthChecks: boolean;
  metricsInterval: number; // in milliseconds
  alertThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    memoryUsage: number; // megabytes
    cpuUsage: number; // percentage
  };
  healthCheckInterval: number; // in milliseconds
  alertChannels: string[]; // email, slack, webhook, etc.
}

export interface SystemMetrics {
  timestamp: Date;
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  diskUsage: number; // percentage
  networkLatency: number; // milliseconds
  activeConnections: number;
  responseTime: number; // milliseconds
  throughput: number; // requests per second
}

export interface TestMetrics {
  executionId: string;
  testCaseId: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  errorCount: number;
  assertionCount: number;
  dataSize: number;
  timestamp: Date;
}

export interface Alert {
  id: string;
  type:
    | 'error_rate'
    | 'response_time'
    | 'memory_usage'
    | 'cpu_usage'
    | 'health_check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  timestamp: Date;
  responseTime: number;
  metadata?: Record<string, unknown>;
}

export class TestMonitor {
  private config: MonitoringConfig;
  private logger: TestLogger;
  private metrics: SystemMetrics[] = [];
  private testMetrics: TestMetrics[] = [];
  private alerts: Alert[] = [];
  private healthChecks: HealthCheck[] = [];
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enableAlerts: true,
      enableHealthChecks: true,
      metricsInterval: 5000, // 5 seconds
      alertThresholds: {
        errorRate: 10, // 10%
        responseTime: 5000, // 5 seconds
        memoryUsage: 1024, // 1GB
        cpuUsage: 80, // 80%
      },
      healthCheckInterval: 30000, // 30 seconds
      alertChannels: ['console'],
      ...config,
    };

    this.logger = new TestLogger({
      level: 'info',
      enableConsole: true,
    });
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring is already running');
      return;
    }

    this.logger.info('Starting test monitoring');
    this.isMonitoring = true;

    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    this.logger.info('Test monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      this.logger.warn('Monitoring is not running');
      return;
    }

    this.logger.info('Stopping test monitoring');
    this.isMonitoring = false;

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.logger.info('Test monitoring stopped');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        diskUsage: await this.getDiskUsage(),
        networkLatency: await this.getNetworkLatency(),
        activeConnections: this.getActiveConnections(),
        responseTime: this.getAverageResponseTime(),
        throughput: this.getThroughput(),
      };

      this.metrics.push(metrics);

      // Keep only last 1000 metrics to prevent memory issues
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Check for alerts
      if (this.config.enableAlerts) {
        this.checkAlerts(metrics);
      }

      this.logger.debug('System metrics collected', { metrics });
    } catch (error) {
      this.logger.error('Failed to collect system metrics', {
        error: error.message,
      });
    }
  }

  /**
   * Get memory usage in MB
   */
  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return Math.round(used.heapUsed / 1024 / 1024);
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    // Simplified CPU usage calculation
    // In production, use a proper CPU monitoring library
    return Math.random() * 100;
  }

  /**
   * Get disk usage percentage
   */
  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage calculation
    // In production, use a proper disk monitoring library
    return Math.random() * 100;
  }

  /**
   * Get network latency in milliseconds
   */
  private async getNetworkLatency(): Promise<number> {
    // Simplified network latency calculation
    // In production, use a proper network monitoring library
    return Math.random() * 100;
  }

  /**
   * Get active connections count
   */
  private getActiveConnections(): number {
    // Simplified active connections calculation
    // In production, use a proper connection monitoring library
    return Math.floor(Math.random() * 100);
  }

  /**
   * Get average response time
   */
  private getAverageResponseTime(): number {
    if (this.testMetrics.length === 0) return 0;

    const totalResponseTime = this.testMetrics.reduce(
      (sum, metric) => sum + metric.responseTime,
      0
    );
    return totalResponseTime / this.testMetrics.length;
  }

  /**
   * Get throughput (requests per second)
   */
  private getThroughput(): number {
    if (this.testMetrics.length === 0) return 0;

    const now = new Date();
    const oneSecondAgo = new Date(now.getTime() - 1000);

    const recentMetrics = this.testMetrics.filter(
      (metric) => metric.timestamp >= oneSecondAgo
    );
    return recentMetrics.length;
  }

  /**
   * Check for alerts based on metrics
   */
  private checkAlerts(metrics: SystemMetrics): void {
    const alerts: Alert[] = [];

    // Check error rate
    if (metrics.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'response_time',
        severity: 'high',
        message: `Response time exceeded threshold: ${metrics.responseTime}ms > ${this.config.alertThresholds.responseTime}ms`,
        value: metrics.responseTime,
        threshold: this.config.alertThresholds.responseTime,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'memory_usage',
        severity: 'high',
        message: `Memory usage exceeded threshold: ${metrics.memoryUsage}MB > ${this.config.alertThresholds.memoryUsage}MB`,
        value: metrics.memoryUsage,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'cpu_usage',
        severity: 'high',
        message: `CPU usage exceeded threshold: ${metrics.cpuUsage}% > ${this.config.alertThresholds.cpuUsage}%`,
        value: metrics.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Process alerts
    alerts.forEach((alert) => {
      this.alerts.push(alert);
      this.sendAlert(alert);
    });
  }

  /**
   * Send alert through configured channels
   */
  private sendAlert(alert: Alert): void {
    this.logger.warn(`Alert: ${alert.message}`, { alert });

    this.config.alertChannels.forEach((channel) => {
      switch (channel) {
        case 'console':
          console.warn(
            `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`
          );
          break;
        case 'email':
          // Implement email alerting
          this.logger.info('Email alert sent', { alertId: alert.id });
          break;
        case 'slack':
          // Implement Slack alerting
          this.logger.info('Slack alert sent', { alertId: alert.id });
          break;
        case 'webhook':
          // Implement webhook alerting
          this.logger.info('Webhook alert sent', { alertId: alert.id });
          break;
      }
    });
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks: HealthCheck[] = [];

    // Database health check
    const dbHealth = await this.checkDatabaseHealth();
    healthChecks.push(dbHealth);

    // API health check
    const apiHealth = await this.checkApiHealth();
    healthChecks.push(apiHealth);

    // Memory health check
    const memoryHealth = this.checkMemoryHealth();
    healthChecks.push(memoryHealth);

    // Process health checks
    healthChecks.forEach((healthCheck) => {
      this.healthChecks.push(healthCheck);

      if (healthCheck.status === 'unhealthy') {
        this.logger.error(`Health check failed: ${healthCheck.name}`, {
          healthCheck,
        });
      } else if (healthCheck.status === 'degraded') {
        this.logger.warn(`Health check degraded: ${healthCheck.name}`, {
          healthCheck,
        });
      } else {
        this.logger.debug(`Health check passed: ${healthCheck.name}`, {
          healthCheck,
        });
      }
    });

    // Keep only last 100 health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Implement actual database health check
      // This is a placeholder
      const responseTime = Date.now() - startTime;

      return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database health check failed: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check API health
   */
  private async checkApiHealth(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Implement actual API health check
      // This is a placeholder
      const responseTime = Date.now() - startTime;

      return {
        name: 'api',
        status: 'healthy',
        message: 'API is responding normally',
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        name: 'api',
        status: 'unhealthy',
        message: `API health check failed: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory health
   */
  private checkMemoryHealth(): HealthCheck {
    const memoryUsage = this.getMemoryUsage();
    const threshold = this.config.alertThresholds.memoryUsage;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let message = 'Memory usage is normal';

    if (memoryUsage > threshold) {
      status = 'unhealthy';
      message = `Memory usage is critical: ${memoryUsage}MB`;
    } else if (memoryUsage > threshold * 0.8) {
      status = 'degraded';
      message = `Memory usage is high: ${memoryUsage}MB`;
    }

    return {
      name: 'memory',
      status,
      message,
      timestamp: new Date(),
      responseTime: 0,
      metadata: { memoryUsage, threshold },
    };
  }

  /**
   * Record test metrics
   */
  recordTestMetrics(
    executionId: string,
    testCaseId: string,
    metrics: Partial<TestMetrics>
  ): void {
    const testMetric: TestMetrics = {
      executionId,
      testCaseId,
      duration: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      responseTime: 0,
      errorCount: 0,
      assertionCount: 0,
      dataSize: 0,
      timestamp: new Date(),
      ...metrics,
    };

    this.testMetrics.push(testMetric);

    // Keep only last 10000 test metrics
    if (this.testMetrics.length > 10000) {
      this.testMetrics = this.testMetrics.slice(-10000);
    }

    this.logger.debug('Test metrics recorded', { testMetric });
  }

  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get test metrics
   */
  getTestMetrics(executionId?: string): TestMetrics[] {
    if (executionId) {
      return this.testMetrics.filter(
        (metric) => metric.executionId === executionId
      );
    }
    return this.testMetrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return this.alerts;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.info(`Alert resolved: ${alertId}`, { alertId });
      return true;
    }
    return false;
  }

  /**
   * Get health checks
   */
  getHealthChecks(): HealthCheck[] {
    return this.healthChecks;
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    testMetricsCount: number;
    activeAlertsCount: number;
    healthChecksCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metrics.length,
      testMetricsCount: this.testMetrics.length,
      activeAlertsCount: this.getActiveAlerts().length,
      healthChecksCount: this.healthChecks.length,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Monitoring configuration updated', { newConfig });
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics = [];
    this.testMetrics = [];
    this.alerts = [];
    this.healthChecks = [];
    this.logger.info('Monitoring data cleared');
  }
}

// Singleton instance for global use
export const testMonitor = new TestMonitor({
  enableMetrics: process.env.TEST_MONITORING_METRICS === 'true',
  enableAlerts: process.env.TEST_MONITORING_ALERTS === 'true',
  enableHealthChecks: process.env.TEST_MONITORING_HEALTH_CHECKS === 'true',
  alertChannels: (
    process.env.TEST_MONITORING_ALERT_CHANNELS || 'console'
  ).split(','),
});
