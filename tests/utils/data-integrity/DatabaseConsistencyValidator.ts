import { TestLogger } from '../logging/TestLogger';

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  query: string;
  expectedResult: unknown;
  tolerance?: number; // for numeric comparisons
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'referential' | 'business_logic' | 'data_quality' | 'performance';
  enabled: boolean;
}

export interface ConsistencyResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  actualResult: unknown;
  expectedResult: unknown;
  difference?: number;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  executionTime: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ValidationSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
}

export class DatabaseConsistencyValidator {
  private rules: Map<string, ConsistencyRule> = new Map();
  private logger: TestLogger;
  private results: ConsistencyResult[] = [];

  constructor() {
    this.logger = new TestLogger({
      level: 'info',
      enableConsole: true,
    });
  }

  /**
   * Add a consistency rule
   */
  addRule(rule: ConsistencyRule): void {
    this.rules.set(rule.id, rule);
    this.logger.debug(`Consistency rule added: ${rule.name}`, { rule });
  }

  /**
   * Remove a consistency rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.debug(`Consistency rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Update a consistency rule
   */
  updateRule(ruleId: string, updates: Partial<ConsistencyRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    this.logger.debug(`Consistency rule updated: ${ruleId}`, { updates });
    return true;
  }

  /**
   * Run all enabled consistency rules
   */
  async validateAll(): Promise<ConsistencyResult[]> {
    this.logger.info('Starting database consistency validation');
    this.results = [];

    const enabledRules = Array.from(this.rules.values()).filter(
      (rule) => rule.enabled
    );

    for (const rule of enabledRules) {
      try {
        const result = await this.validateRule(rule);
        this.results.push(result);

        if (result.passed) {
          this.logger.debug(`Rule passed: ${rule.name}`, { result });
        } else {
          this.logger.warn(`Rule failed: ${rule.name}`, { result });
        }
      } catch (error) {
        this.logger.error(`Rule execution failed: ${rule.name}`, {
          error: error.message,
        });

        const errorResult: ConsistencyResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          actualResult: null,
          expectedResult: rule.expectedResult,
          message: `Rule execution failed: ${error.message}`,
          severity: rule.severity,
          executionTime: 0,
          timestamp: new Date(),
          metadata: { error: error.message },
        };

        this.results.push(errorResult);
      }
    }

    this.logger.info('Database consistency validation completed', {
      totalRules: enabledRules.length,
      passedRules: this.results.filter((r) => r.passed).length,
      failedRules: this.results.filter((r) => !r.passed).length,
    });

    return this.results;
  }

  /**
   * Run a specific consistency rule
   */
  async validateRule(rule: ConsistencyRule): Promise<ConsistencyResult> {
    const startTime = Date.now();

    try {
      // This would execute the actual database query
      // For now, we'll simulate the execution
      const actualResult = await this.executeQuery(rule.query);
      const executionTime = Date.now() - startTime;

      const passed = this.compareResults(
        actualResult,
        rule.expectedResult,
        rule.tolerance
      );
      const difference = this.calculateDifference(
        actualResult,
        rule.expectedResult
      );

      const result: ConsistencyResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        actualResult,
        expectedResult: rule.expectedResult,
        difference,
        message: passed
          ? `Rule passed: ${rule.name}`
          : `Rule failed: ${rule.name}. Expected: ${rule.expectedResult}, Actual: ${actualResult}`,
        severity: rule.severity,
        executionTime,
        timestamp: new Date(),
      };

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        actualResult: null,
        expectedResult: rule.expectedResult,
        message: `Query execution failed: ${error.message}`,
        severity: rule.severity,
        executionTime,
        timestamp: new Date(),
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Execute a database query (simulated)
   */
  private async executeQuery(query: string): Promise<unknown> {
    // This would execute the actual database query
    // For now, we'll simulate different types of queries

    if (query.includes('COUNT')) {
      return Math.floor(Math.random() * 1000);
    }

    if (query.includes('SUM')) {
      return Math.floor(Math.random() * 10000);
    }

    if (query.includes('AVG')) {
      return Math.random() * 100;
    }

    if (query.includes('MAX')) {
      return Math.floor(Math.random() * 1000);
    }

    if (query.includes('MIN')) {
      return Math.floor(Math.random() * 100);
    }

    // Default to a boolean result for other queries
    return Math.random() > 0.5;
  }

  /**
   * Compare actual and expected results
   */
  private compareResults(
    actual: unknown,
    expected: unknown,
    tolerance?: number
  ): boolean {
    if (actual === expected) {
      return true;
    }

    if (typeof actual === 'number' && typeof expected === 'number') {
      if (tolerance !== undefined) {
        return Math.abs(actual - expected) <= tolerance;
      }
      return actual === expected;
    }

    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        return false;
      }

      for (let i = 0; i < actual.length; i++) {
        if (!this.compareResults(actual[i], expected[i], tolerance)) {
          return false;
        }
      }
      return true;
    }

    if (typeof actual === 'object' && typeof expected === 'object') {
      const actualKeys = Object.keys(actual).sort();
      const expectedKeys = Object.keys(expected).sort();

      if (actualKeys.length !== expectedKeys.length) {
        return false;
      }

      for (let i = 0; i < actualKeys.length; i++) {
        if (actualKeys[i] !== expectedKeys[i]) {
          return false;
        }

        if (
          !this.compareResults(
            actual[actualKeys[i]],
            expected[expectedKeys[i]],
            tolerance
          )
        ) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Calculate difference between actual and expected results
   */
  private calculateDifference(
    actual: unknown,
    expected: unknown
  ): number | undefined {
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected);
    }
    return undefined;
  }

  /**
   * Get validation summary
   */
  getSummary(): ValidationSummary {
    const totalRules = this.results.length;
    const passedRules = this.results.filter((r) => r.passed).length;
    const failedRules = this.results.filter((r) => !r.passed).length;

    const criticalFailures = this.results.filter(
      (r) => !r.passed && r.severity === 'critical'
    ).length;
    const highFailures = this.results.filter(
      (r) => !r.passed && r.severity === 'high'
    ).length;
    const mediumFailures = this.results.filter(
      (r) => !r.passed && r.severity === 'medium'
    ).length;
    const lowFailures = this.results.filter(
      (r) => !r.passed && r.severity === 'low'
    ).length;

    const totalExecutionTime = this.results.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );
    const averageExecutionTime =
      totalRules > 0 ? totalExecutionTime / totalRules : 0;

    return {
      totalRules,
      passedRules,
      failedRules,
      criticalFailures,
      highFailures,
      mediumFailures,
      lowFailures,
      totalExecutionTime,
      averageExecutionTime,
    };
  }

  /**
   * Get results by severity
   */
  getResultsBySeverity(
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): ConsistencyResult[] {
    return this.results.filter((r) => r.severity === severity);
  }

  /**
   * Get failed results
   */
  getFailedResults(): ConsistencyResult[] {
    return this.results.filter((r) => !r.passed);
  }

  /**
   * Get passed results
   */
  getPassedResults(): ConsistencyResult[] {
    return this.results.filter((r) => r.passed);
  }

  /**
   * Get results by category
   */
  getResultsByCategory(
    category: 'referential' | 'business_logic' | 'data_quality' | 'performance'
  ): ConsistencyResult[] {
    return this.results.filter((r) => {
      const rule = this.rules.get(r.ruleId);
      return rule && rule.category === category;
    });
  }

  /**
   * Get all rules
   */
  getAllRules(): ConsistencyRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): ConsistencyRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  /**
   * Get disabled rules
   */
  getDisabledRules(): ConsistencyRule[] {
    return Array.from(this.rules.values()).filter((rule) => !rule.enabled);
  }

  /**
   * Enable a rule
   */
  enableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: true });
  }

  /**
   * Disable a rule
   */
  disableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: false });
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
    this.logger.info('Consistency validation results cleared');
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
    this.logger.info('All consistency rules cleared');
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(
      {
        summary: this.getSummary(),
        results: this.results,
        rules: this.getAllRules(),
      },
      null,
      2
    );
  }

  /**
   * Load predefined consistency rules
   */
  loadPredefinedRules(): void {
    const predefinedRules: ConsistencyRule[] = [
      {
        id: 'rule-001',
        name: 'Foreign Key Integrity',
        description: 'Check that all foreign key references are valid',
        query:
          'SELECT COUNT(*) FROM test_executions te LEFT JOIN test_cases tc ON te.test_case_id = tc.id WHERE tc.id IS NULL',
        expectedResult: 0,
        severity: 'critical',
        category: 'referential',
        enabled: true,
      },
      {
        id: 'rule-002',
        name: 'Test Suite Consistency',
        description:
          'Check that test suite pass rates are calculated correctly',
        query:
          'SELECT COUNT(*) FROM test_suites ts WHERE ts.pass_rate < 0 OR ts.pass_rate > 100',
        expectedResult: 0,
        severity: 'high',
        category: 'business_logic',
        enabled: true,
      },
      {
        id: 'rule-003',
        name: 'Test Execution Duration',
        description: 'Check that test execution durations are reasonable',
        query:
          'SELECT COUNT(*) FROM test_executions te WHERE te.duration < 0 OR te.duration > 3600000',
        expectedResult: 0,
        severity: 'medium',
        category: 'data_quality',
        enabled: true,
      },
      {
        id: 'rule-004',
        name: 'Test Data Anonymization',
        description: 'Check that sensitive data is properly anonymized',
        query:
          'SELECT COUNT(*) FROM test_data td WHERE td.anonymization_level = "none" AND td.type = "production"',
        expectedResult: 0,
        severity: 'critical',
        category: 'data_quality',
        enabled: true,
      },
      {
        id: 'rule-005',
        name: 'Test Report Completeness',
        description: 'Check that all test reports have required fields',
        query:
          'SELECT COUNT(*) FROM test_reports tr WHERE tr.summary IS NULL OR tr.generated_at IS NULL',
        expectedResult: 0,
        severity: 'high',
        category: 'data_quality',
        enabled: true,
      },
    ];

    predefinedRules.forEach((rule) => this.addRule(rule));
    this.logger.info(
      `Loaded ${predefinedRules.length} predefined consistency rules`
    );
  }
}
