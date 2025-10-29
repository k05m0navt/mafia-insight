export type TestResult = 'passed' | 'failed' | 'skipped' | 'error' | 'timeout';

export interface TestStep {
  stepNumber: number;
  action: string;
  target: string;
  input?: string;
  expectedResult: string;
  timeout: number;
  retryCount: number;
  isOptional: boolean;
}

export interface TestCase {
  id: string;
  suiteId: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'hybrid';
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  preconditions: string[];
  steps: TestStep[];
  expectedResults: string[];
  dataRequirements: DataRequirement[];
  environment: EnvironmentConfig;
  timeout: number;
  retryCount: number;
  status: 'draft' | 'ready' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  priority: 'P1' | 'P2' | 'P3';
  userStoryId?: string;
  status: 'draft' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  passRate: number;
  testCases: TestCase[];
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  suiteId: string;
  executionId: string;
  status: TestResult;
  startTime: Date;
  endTime: Date;
  duration: number;
  environment: EnvironmentInfo;
  browser?: string;
  device?: string;
  errorMessage?: string;
  errorStack?: string;
  screenshots?: string[];
  videos?: string[];
  logs: string[];
  metrics: TestMetrics;
  createdAt: Date;
}

export interface DataRequirement {
  dataType: string;
  quantity: number;
  quality: 'exact' | 'approximate' | 'any';
  freshness: 'current' | 'historical' | 'any';
  anonymization: 'none' | 'partial' | 'full';
  relationships: string[];
}

export interface EnvironmentConfig {
  os?: string;
  browser?: string;
  device?: string;
  screenResolution?: string;
  networkType?: string;
  timezone?: string;
  locale?: string;
}

export interface EnvironmentInfo {
  os: string;
  browser: string;
  device: string;
  screenResolution: string;
  networkType: string;
  timezone: string;
  locale: string;
}

export interface TestMetrics {
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  successRate: number;
}
