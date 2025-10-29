import { TestExecution as _TestExecution } from '../models/TestExecution';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  executionId: string;
  testCaseId?: string;
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  format?: 'json' | 'text' | 'pretty';
  includeStackTrace?: boolean;
  includeTimestamp?: boolean;
  includeContext?: boolean;
}

export class TestLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private fileStream?: NodeJS.WritableStream;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableDatabase: false,
      format: 'json',
      includeStackTrace: true,
      includeTimestamp: true,
      includeContext: true,
      ...config,
    };

    if (this.config.enableFile && this.config.filePath) {
      this.initializeFileStream();
    }
  }

  private initializeFileStream(): void {
    const fs = require('fs');
    const path = require('path');

    // Ensure directory exists
    const dir = path.dirname(this.config.filePath!);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.fileStream = fs.createWriteStream(this.config.filePath!, {
      flags: 'a',
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };

    return levels[level] >= levels[this.config.level];
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseEntry = {
      id: entry.id,
      executionId: entry.executionId,
      testCaseId: entry.testCaseId,
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
    };

    if (this.config.includeContext && Object.keys(entry.context).length > 0) {
      (baseEntry as Record<string, unknown>).context = entry.context;
    }

    if (this.config.includeStackTrace && entry.context.stack) {
      (baseEntry as Record<string, unknown>).stack = entry.context.stack;
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      (baseEntry as Record<string, unknown>).metadata = entry.metadata;
    }

    switch (this.config.format) {
      case 'json':
        return JSON.stringify(baseEntry);
      case 'pretty':
        return JSON.stringify(baseEntry, null, 2);
      case 'text':
        return `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`;
      default:
        return JSON.stringify(baseEntry);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionId: context.executionId || 'unknown',
      testCaseId: context.testCaseId,
      level,
      message,
      context,
      timestamp: new Date(),
      metadata,
    };
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedLog = this.formatLogEntry(entry);
    this.logs.push(entry);

    // Console output
    if (this.config.enableConsole) {
      const consoleMethod =
        entry.level === 'debug'
          ? 'debug'
          : entry.level === 'info'
            ? 'info'
            : entry.level === 'warn'
              ? 'warn'
              : entry.level === 'error'
                ? 'error'
                : 'error';

      console[consoleMethod](formattedLog);
    }

    // File output
    if (this.config.enableFile && this.fileStream) {
      this.fileStream.write(formattedLog + '\n');
    }

    // Database output (would be implemented with actual database connection)
    if (this.config.enableDatabase) {
      // This would be implemented with actual database operations
      console.log('Database logging not implemented yet');
    }
  }

  debug(
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog(this.createLogEntry('debug', message, context, metadata));
  }

  info(
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog(this.createLogEntry('info', message, context, metadata));
  }

  warn(
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog(this.createLogEntry('warn', message, context, metadata));
  }

  error(
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog(this.createLogEntry('error', message, context, metadata));
  }

  fatal(
    message: string,
    context: Record<string, unknown> = {},
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog(this.createLogEntry('fatal', message, context, metadata));
  }

  // Test execution specific logging methods
  logTestStart(
    executionId: string,
    testCaseId: string,
    testName: string
  ): void {
    this.info(`Test started: ${testName}`, {
      executionId,
      testCaseId,
      testName,
      event: 'test_start',
    });
  }

  logTestEnd(
    executionId: string,
    testCaseId: string,
    testName: string,
    status: string,
    duration: number
  ): void {
    this.info(`Test completed: ${testName}`, {
      executionId,
      testCaseId,
      testName,
      status,
      duration,
      event: 'test_end',
    });
  }

  logTestError(
    executionId: string,
    testCaseId: string,
    testName: string,
    error: Error
  ): void {
    this.error(`Test failed: ${testName}`, {
      executionId,
      testCaseId,
      testName,
      error: error.message,
      stack: error.stack,
      event: 'test_error',
    });
  }

  logTestStep(
    executionId: string,
    testCaseId: string,
    stepNumber: number,
    stepName: string,
    status: string
  ): void {
    this.debug(`Test step ${stepNumber}: ${stepName}`, {
      executionId,
      testCaseId,
      stepNumber,
      stepName,
      status,
      event: 'test_step',
    });
  }

  logTestAssertion(
    executionId: string,
    testCaseId: string,
    assertion: string,
    passed: boolean,
    actual?: unknown,
    expected?: unknown
  ): void {
    this.debug(`Assertion: ${assertion}`, {
      executionId,
      testCaseId,
      assertion,
      passed,
      actual,
      expected,
      event: 'test_assertion',
    });
  }

  logTestData(
    executionId: string,
    testCaseId: string,
    dataType: string,
    data: unknown
  ): void {
    this.debug(`Test data: ${dataType}`, {
      executionId,
      testCaseId,
      dataType,
      data,
      event: 'test_data',
    });
  }

  logTestEnvironment(
    executionId: string,
    environment: Record<string, unknown>
  ): void {
    this.info('Test environment', {
      executionId,
      environment,
      event: 'test_environment',
    });
  }

  logTestMetrics(executionId: string, metrics: Record<string, unknown>): void {
    this.info('Test metrics', {
      executionId,
      metrics,
      event: 'test_metrics',
    });
  }

  // Utility methods
  getLogs(executionId?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;

    if (executionId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.executionId === executionId
      );
    }

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    return filteredLogs;
  }

  getLogsByTestCase(testCaseId: string): LogEntry[] {
    return this.logs.filter((log) => log.testCaseId === testCaseId);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'id',
        'executionId',
        'testCaseId',
        'level',
        'message',
        'timestamp',
      ];
      const csvRows = [headers.join(',')];

      this.logs.forEach((log) => {
        const row = headers.map((header) => {
          const value = (log as Record<string, unknown>)[header];
          return typeof value === 'string'
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        });
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (
      newConfig.enableFile &&
      newConfig.filePath &&
      newConfig.filePath !== this.config.filePath
    ) {
      this.initializeFileStream();
    }
  }

  close(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

// Singleton instance for global use
export const testLogger = new TestLogger({
  level: (process.env.TEST_LOG_LEVEL as LogLevel) || 'info',
  enableConsole: true,
  enableFile: process.env.TEST_LOG_FILE === 'true',
  filePath: process.env.TEST_LOG_FILE_PATH || './test-results/test.log',
  format: (process.env.TEST_LOG_FORMAT as 'json' | 'text' | 'pretty') || 'json',
});
