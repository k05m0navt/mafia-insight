import {
  TestExecution,
  TestResult,
  TestMetrics,
  EnvironmentInfo,
} from '../models/TestExecution';
import { TestCase } from '../models/TestCase';
import { TestSuite } from '../models/TestSuite';
import { TestEnvironment } from '../models/TestEnvironment';

export interface ExecutionOptions {
  environment: TestEnvironment;
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  retries: number;
  captureScreenshots: boolean;
  captureVideos: boolean;
  captureLogs: boolean;
}

export interface ExecutionResult {
  executionId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  executions: TestExecution[];
  summary: string;
}

export class TestExecutor {
  private executions: Map<string, TestExecution> = new Map();
  private isRunning: boolean = false;

  async executeTestSuite(
    suite: TestSuite,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    this.isRunning = true;

    try {
      console.log(`Starting execution of test suite: ${suite.name}`);

      const executions: TestExecution[] = [];

      if (options.parallel && suite.testCases.length > 1) {
        executions.push(
          ...(await this.executeTestsInParallel(
            suite.testCases,
            executionId,
            options
          ))
        );
      } else {
        executions.push(
          ...(await this.executeTestsSequentially(
            suite.testCases,
            executionId,
            options
          ))
        );
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result = this.calculateExecutionResult(
        executionId,
        executions,
        startTime,
        endTime,
        duration
      );

      console.log(`Completed execution of test suite: ${suite.name}`);
      console.log(`Results: ${result.passedTests}/${result.totalTests} passed`);

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  async executeTestCase(
    testCase: TestCase,
    executionId: string,
    options: ExecutionOptions
  ): Promise<TestExecution> {
    const startTime = new Date();
    const environmentInfo = this.createEnvironmentInfo(options.environment);

    let status: TestResult = 'passed';
    let errorMessage: string | undefined;
    let errorStack: string | undefined;
    let screenshots: string[] = [];
    let videos: string[] = [];
    let logs: string[] = [];

    try {
      console.log(`Executing test case: ${testCase.name}`);

      // Simulate test execution based on test case type
      if (testCase.type === 'automated') {
        const result = await this.executeAutomatedTest(testCase, options);
        status = result.status;
        errorMessage = result.errorMessage;
        errorStack = result.errorStack;
        screenshots = result.screenshots;
        videos = result.videos;
        logs = result.logs;
      } else if (testCase.type === 'manual') {
        // For manual tests, we just mark them as skipped for now
        status = 'skipped';
        logs.push('Manual test - requires human intervention');
      } else if (testCase.type === 'hybrid') {
        // Hybrid tests combine automated and manual steps
        const result = await this.executeHybridTest(testCase, options);
        status = result.status;
        errorMessage = result.errorMessage;
        errorStack = result.errorStack;
        screenshots = result.screenshots;
        videos = result.videos;
        logs = result.logs;
      }
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorStack = error instanceof Error ? error.stack : undefined;
      logs.push(`Error: ${errorMessage}`);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const execution: TestExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testCaseId: testCase.id,
      suiteId: testCase.suiteId,
      executionId,
      status,
      startTime,
      endTime,
      duration,
      environment: environmentInfo,
      browser: options.environment.browserConfig.userAgent || 'Unknown',
      device: options.environment.deviceConfig.name,
      errorMessage,
      errorStack,
      screenshots,
      videos,
      logs,
      metrics: this.calculateMetrics(duration, status),
      createdAt: new Date(),
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  private async executeTestsInParallel(
    testCases: TestCase[],
    executionId: string,
    options: ExecutionOptions
  ): Promise<TestExecution[]> {
    const concurrency = Math.min(options.maxConcurrency, testCases.length);
    const results: TestExecution[] = [];

    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency);
      const batchPromises = batch.map((testCase) =>
        this.executeTestCase(testCase, executionId, options)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private async executeTestsSequentially(
    testCases: TestCase[],
    executionId: string,
    options: ExecutionOptions
  ): Promise<TestExecution[]> {
    const results: TestExecution[] = [];

    for (const testCase of testCases) {
      const result = await this.executeTestCase(testCase, executionId, options);
      results.push(result);
    }

    return results;
  }

  private async executeAutomatedTest(
    testCase: TestCase,
    options: ExecutionOptions
  ): Promise<{
    status: TestResult;
    errorMessage?: string;
    errorStack?: string;
    screenshots: string[];
    videos: string[];
    logs: string[];
  }> {
    const logs: string[] = [];
    const screenshots: string[] = [];
    const videos: string[] = [];

    try {
      // Simulate test step execution
      for (const step of testCase.steps) {
        logs.push(`Executing step ${step.stepNumber}: ${step.action}`);

        // Simulate step execution with random success/failure
        const stepSuccess = Math.random() > 0.1; // 90% success rate

        if (!stepSuccess) {
          return {
            status: 'failed',
            errorMessage: `Step ${step.stepNumber} failed: ${step.action}`,
            errorStack: `Error in step ${step.stepNumber}`,
            screenshots,
            videos,
            logs,
          };
        }

        // Simulate screenshot capture
        if (options.captureScreenshots && Math.random() > 0.7) {
          screenshots.push(`screenshot-${Date.now()}-${step.stepNumber}.png`);
        }

        // Simulate video capture
        if (options.captureVideos && Math.random() > 0.9) {
          videos.push(`video-${Date.now()}-${step.stepNumber}.mp4`);
        }

        logs.push(`Step ${step.stepNumber} completed successfully`);
      }

      return {
        status: 'passed',
        screenshots,
        videos,
        logs,
      };
    } catch (error) {
      return {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        screenshots,
        videos,
        logs,
      };
    }
  }

  private async executeHybridTest(
    testCase: TestCase,
    options: ExecutionOptions
  ): Promise<{
    status: TestResult;
    errorMessage?: string;
    errorStack?: string;
    screenshots: string[];
    videos: string[];
    logs: string[];
  }> {
    // For hybrid tests, we execute automated steps and mark manual steps as skipped
    const logs: string[] = [];
    const screenshots: string[] = [];
    const videos: string[] = [];

    try {
      for (const step of testCase.steps) {
        logs.push(`Executing step ${step.stepNumber}: ${step.action}`);

        // Determine if step is automated or manual based on action type
        const isAutomated = this.isAutomatedStep(step.action);

        if (isAutomated) {
          const stepSuccess = Math.random() > 0.1; // 90% success rate

          if (!stepSuccess) {
            return {
              status: 'failed',
              errorMessage: `Automated step ${step.stepNumber} failed: ${step.action}`,
              errorStack: `Error in automated step ${step.stepNumber}`,
              screenshots,
              videos,
              logs,
            };
          }

          logs.push(`Automated step ${step.stepNumber} completed successfully`);
        } else {
          logs.push(
            `Manual step ${step.stepNumber} - requires human intervention`
          );
        }

        // Simulate media capture
        if (options.captureScreenshots && Math.random() > 0.7) {
          screenshots.push(`screenshot-${Date.now()}-${step.stepNumber}.png`);
        }

        if (options.captureVideos && Math.random() > 0.9) {
          videos.push(`video-${Date.now()}-${step.stepNumber}.mp4`);
        }
      }

      return {
        status: 'passed',
        screenshots,
        videos,
        logs,
      };
    } catch (error) {
      return {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        screenshots,
        videos,
        logs,
      };
    }
  }

  private isAutomatedStep(action: string): boolean {
    const automatedActions = [
      'click',
      'type',
      'select',
      'navigate',
      'wait',
      'verify',
      'assert',
      'fill',
      'submit',
      'scroll',
      'hover',
      'double-click',
      'right-click',
    ];

    return automatedActions.some((autoAction) =>
      action.toLowerCase().includes(autoAction)
    );
  }

  private createEnvironmentInfo(environment: TestEnvironment): EnvironmentInfo {
    return {
      os: 'macOS', // This would be detected from the actual environment
      browser: environment.browserConfig.userAgent || 'Unknown',
      device: environment.deviceConfig.name,
      screenResolution: `${environment.deviceConfig.viewport.width}x${environment.deviceConfig.viewport.height}`,
      networkType: environment.networkConfig.connectionType || 'wifi',
      timezone: 'UTC',
      locale: environment.browserConfig.locale || 'en-US',
    };
  }

  private calculateMetrics(duration: number, status: TestResult): TestMetrics {
    return {
      responseTime: duration,
      throughput: status === 'passed' ? 1 : 0,
      memoryUsage: Math.random() * 100, // Simulated memory usage
      cpuUsage: Math.random() * 100, // Simulated CPU usage
      networkLatency: Math.random() * 100, // Simulated network latency
      errorRate: status === 'failed' || status === 'error' ? 1 : 0,
      successRate: status === 'passed' ? 1 : 0,
    };
  }

  private calculateExecutionResult(
    executionId: string,
    executions: TestExecution[],
    startTime: Date,
    endTime: Date,
    duration: number
  ): ExecutionResult {
    const totalTests = executions.length;
    const passedTests = executions.filter((e) => e.status === 'passed').length;
    const failedTests = executions.filter((e) => e.status === 'failed').length;
    const skippedTests = executions.filter(
      (e) => e.status === 'skipped'
    ).length;
    const errorTests = executions.filter((e) => e.status === 'error').length;

    const summary = `Execution completed: ${passedTests}/${totalTests} passed, ${failedTests} failed, ${skippedTests} skipped, ${errorTests} errors`;

    return {
      executionId,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      errorTests,
      duration,
      startTime,
      endTime,
      executions,
      summary,
    };
  }

  getExecution(id: string): TestExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): TestExecution[] {
    return Array.from(this.executions.values());
  }

  getExecutionsByStatus(status: TestResult): TestExecution[] {
    return this.getAllExecutions().filter((e) => e.status === status);
  }

  getExecutionsBySuite(suiteId: string): TestExecution[] {
    return this.getAllExecutions().filter((e) => e.suiteId === suiteId);
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  getExecutionStats(): {
    total: number;
    byStatus: Record<string, number>;
    averageDuration: number;
    successRate: number;
  } {
    const executions = this.getAllExecutions();
    const total = executions.length;

    const byStatus = executions.reduce(
      (acc, exec) => {
        acc[exec.status] = (acc[exec.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageDuration =
      total > 0
        ? executions.reduce((sum, exec) => sum + exec.duration, 0) / total
        : 0;

    const successRate =
      total > 0
        ? (executions.filter((e) => e.status === 'passed').length / total) * 100
        : 0;

    return {
      total,
      byStatus,
      averageDuration,
      successRate,
    };
  }
}
