import { TestLogger } from '../logging/TestLogger';

export interface SyncValidationRule {
  id: string;
  name: string;
  description: string;
  sourceTable: string;
  targetTable: string;
  syncKey: string; // Column used to match records
  validationQueries: SyncValidationQuery[];
  tolerance?: number; // For numeric comparisons
  enabled: boolean;
}

export interface SyncValidationQuery {
  id: string;
  name: string;
  sourceQuery: string;
  targetQuery: string;
  comparisonType: 'count' | 'sum' | 'avg' | 'max' | 'min' | 'exact' | 'custom';
  expectedDifference?: number; // Expected difference between source and target
  severity: 'critical' | 'high' | 'medium' | 'low';
  customComparator?: (source: unknown, target: unknown) => boolean;
}

export interface SyncValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  executionTime: number;
  queryResults: SyncQueryResult[];
  summary: {
    totalQueries: number;
    passedQueries: number;
    failedQueries: number;
    totalRecords: number;
    syncedRecords: number;
    unsyncedRecords: number;
    syncRate: number;
  };
  errors: string[];
  warnings: string[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SyncQueryResult {
  queryId: string;
  queryName: string;
  passed: boolean;
  sourceResult: unknown;
  targetResult: unknown;
  difference?: number;
  expectedDifference?: number;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  executionTime: number;
}

export interface SyncSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  totalQueries: number;
  passedQueries: number;
  failedQueries: number;
  averageSyncRate: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
}

export class DataSyncValidator {
  private rules: Map<string, SyncValidationRule> = new Map();
  private logger: TestLogger;
  private results: SyncValidationResult[] = [];

  constructor() {
    this.logger = new TestLogger({
      level: 'info',
      enableConsole: true,
    });
  }

  /**
   * Add a sync validation rule
   */
  addRule(rule: SyncValidationRule): void {
    this.rules.set(rule.id, rule);
    this.logger.debug(`Sync validation rule added: ${rule.name}`, { rule });
  }

  /**
   * Remove a sync validation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.debug(`Sync validation rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Update a sync validation rule
   */
  updateRule(ruleId: string, updates: Partial<SyncValidationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    this.logger.debug(`Sync validation rule updated: ${ruleId}`, { updates });
    return true;
  }

  /**
   * Run all enabled sync validation rules
   */
  async validateAll(): Promise<SyncValidationResult[]> {
    this.logger.info('Starting data sync validation');
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

        const errorResult: SyncValidationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          executionTime: 0,
          queryResults: [],
          summary: {
            totalQueries: 0,
            passedQueries: 0,
            failedQueries: 0,
            totalRecords: 0,
            syncedRecords: 0,
            unsyncedRecords: 0,
            syncRate: 0,
          },
          errors: [`Rule execution failed: ${error.message}`],
          warnings: [],
          timestamp: new Date(),
          metadata: { error: error.message },
        };

        this.results.push(errorResult);
      }
    }

    this.logger.info('Data sync validation completed', {
      totalRules: enabledRules.length,
      passedRules: this.results.filter((r) => r.passed).length,
      failedRules: this.results.filter((r) => !r.passed).length,
    });

    return this.results;
  }

  /**
   * Run a specific sync validation rule
   */
  async validateRule(rule: SyncValidationRule): Promise<SyncValidationResult> {
    const startTime = Date.now();

    try {
      this.logger.info(`Running sync validation: ${rule.name}`, {
        sourceTable: rule.sourceTable,
        targetTable: rule.targetTable,
      });

      // Run validation queries
      const queryResults: SyncQueryResult[] = [];

      for (const query of rule.validationQueries) {
        try {
          const queryResult = await this.runSyncQuery(query, rule);
          queryResults.push(queryResult);
        } catch (error) {
          queryResults.push({
            queryId: query.id,
            queryName: query.name,
            passed: false,
            sourceResult: null,
            targetResult: null,
            message: `Query execution failed: ${error.message}`,
            severity: query.severity,
            executionTime: 0,
          });
        }
      }

      // Calculate summary
      const totalQueries = queryResults.length;
      const passedQueries = queryResults.filter((q) => q.passed).length;
      const failedQueries = queryResults.filter((q) => !q.passed).length;

      const totalRecords = await this.getTotalRecords(rule.sourceTable);
      const syncedRecords = await this.getSyncedRecords(
        rule.sourceTable,
        rule.targetTable,
        rule.syncKey
      );
      const unsyncedRecords = totalRecords - syncedRecords;
      const syncRate =
        totalRecords > 0 ? (syncedRecords / totalRecords) * 100 : 0;

      const executionTime = Date.now() - startTime;
      const passed = queryResults.every((q) => q.passed);

      const result: SyncValidationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        executionTime,
        queryResults,
        summary: {
          totalQueries,
          passedQueries,
          failedQueries,
          totalRecords,
          syncedRecords,
          unsyncedRecords,
          syncRate,
        },
        errors: queryResults
          .filter(
            (q) =>
              !q.passed && (q.severity === 'critical' || q.severity === 'high')
          )
          .map((q) => q.message),
        warnings: queryResults
          .filter(
            (q) =>
              !q.passed && (q.severity === 'medium' || q.severity === 'low')
          )
          .map((q) => q.message),
        timestamp: new Date(),
      };

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        executionTime,
        queryResults: [],
        summary: {
          totalQueries: 0,
          passedQueries: 0,
          failedQueries: 0,
          totalRecords: 0,
          syncedRecords: 0,
          unsyncedRecords: 0,
          syncRate: 0,
        },
        errors: [`Rule execution failed: ${error.message}`],
        warnings: [],
        timestamp: new Date(),
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Run a sync validation query
   */
  private async runSyncQuery(
    query: SyncValidationQuery,
    rule: SyncValidationRule
  ): Promise<SyncQueryResult> {
    const startTime = Date.now();

    try {
      // Execute source query
      const sourceResult = await this.executeQuery(query.sourceQuery);

      // Execute target query
      const targetResult = await this.executeQuery(query.targetQuery);

      // Compare results based on comparison type
      let passed = false;
      let difference: number | undefined;
      let message = '';

      switch (query.comparisonType) {
        case 'count':
          passed = sourceResult === targetResult;
          difference = Math.abs(sourceResult - targetResult);
          message = passed
            ? `Count matches: ${sourceResult}`
            : `Count mismatch: Source=${sourceResult}, Target=${targetResult}`;
          break;

        case 'sum':
          passed = this.compareNumeric(
            sourceResult,
            targetResult,
            rule.tolerance
          );
          difference = Math.abs(sourceResult - targetResult);
          message = passed
            ? `Sum matches: ${sourceResult}`
            : `Sum mismatch: Source=${sourceResult}, Target=${targetResult}`;
          break;

        case 'avg':
          passed = this.compareNumeric(
            sourceResult,
            targetResult,
            rule.tolerance
          );
          difference = Math.abs(sourceResult - targetResult);
          message = passed
            ? `Average matches: ${sourceResult}`
            : `Average mismatch: Source=${sourceResult}, Target=${targetResult}`;
          break;

        case 'max':
          passed = sourceResult === targetResult;
          difference = Math.abs(sourceResult - targetResult);
          message = passed
            ? `Max matches: ${sourceResult}`
            : `Max mismatch: Source=${sourceResult}, Target=${targetResult}`;
          break;

        case 'min':
          passed = sourceResult === targetResult;
          difference = Math.abs(sourceResult - targetResult);
          message = passed
            ? `Min matches: ${sourceResult}`
            : `Min mismatch: Source=${sourceResult}, Target=${targetResult}`;
          break;

        case 'exact':
          passed = this.deepEqual(sourceResult, targetResult);
          message = passed
            ? `Exact match`
            : `Exact mismatch: Source=${JSON.stringify(sourceResult)}, Target=${JSON.stringify(targetResult)}`;
          break;

        case 'custom':
          if (query.customComparator) {
            passed = query.customComparator(sourceResult, targetResult);
            message = passed
              ? `Custom comparison passed`
              : `Custom comparison failed`;
          } else {
            passed = false;
            message = 'Custom comparator not provided';
          }
          break;

        default:
          passed = false;
          message = `Unknown comparison type: ${query.comparisonType}`;
      }

      // Check expected difference
      if (query.expectedDifference !== undefined && difference !== undefined) {
        const expectedDiff = Math.abs(query.expectedDifference);
        const actualDiff = Math.abs(difference);
        const diffPassed =
          Math.abs(actualDiff - expectedDiff) <= (rule.tolerance || 0);

        if (!diffPassed) {
          passed = false;
          message += ` (Expected difference: ${expectedDiff}, Actual: ${actualDiff})`;
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        queryId: query.id,
        queryName: query.name,
        passed,
        sourceResult,
        targetResult,
        difference,
        expectedDifference: query.expectedDifference,
        message,
        severity: query.severity,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        queryId: query.id,
        queryName: query.name,
        passed: false,
        sourceResult: null,
        targetResult: null,
        message: `Query execution failed: ${error.message}`,
        severity: query.severity,
        executionTime,
      };
    }
  }

  /**
   * Execute a query (simulated)
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
   * Get total records in a table
   */
  private async getTotalRecords(_table: string): Promise<number> {
    // This would execute actual count query
    // For now, we'll simulate the count
    return Math.floor(Math.random() * 1000);
  }

  /**
   * Get synced records count
   */
  private async getSyncedRecords(
    _sourceTable: string,
    _targetTable: string,
    _syncKey: string
  ): Promise<number> {
    // This would execute actual sync count query
    // For now, we'll simulate the count
    return Math.floor(Math.random() * 800);
  }

  /**
   * Compare numeric values
   */
  private compareNumeric(
    actual: number,
    expected: number,
    tolerance?: number
  ): boolean {
    if (tolerance !== undefined) {
      return Math.abs(actual - expected) <= tolerance;
    }
    return actual === expected;
  }

  /**
   * Deep equal comparison
   */
  private deepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        return false;
      }

      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get sync validation summary
   */
  getSummary(): SyncSummary {
    const totalRules = this.results.length;
    const passedRules = this.results.filter((r) => r.passed).length;
    const failedRules = this.results.filter((r) => !r.passed).length;

    const allQueries = this.results.flatMap((r) => r.queryResults);
    const totalQueries = allQueries.length;
    const passedQueries = allQueries.filter((q) => q.passed).length;
    const failedQueries = allQueries.filter((q) => !q.passed).length;

    const averageSyncRate =
      this.results.length > 0
        ? this.results.reduce((sum, r) => sum + r.summary.syncRate, 0) /
          this.results.length
        : 0;

    const totalExecutionTime = this.results.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );
    const averageExecutionTime =
      totalRules > 0 ? totalExecutionTime / totalRules : 0;

    const criticalFailures = allQueries.filter(
      (q) => !q.passed && q.severity === 'critical'
    ).length;
    const highFailures = allQueries.filter(
      (q) => !q.passed && q.severity === 'high'
    ).length;
    const mediumFailures = allQueries.filter(
      (q) => !q.passed && q.severity === 'medium'
    ).length;
    const lowFailures = allQueries.filter(
      (q) => !q.passed && q.severity === 'low'
    ).length;

    return {
      totalRules,
      passedRules,
      failedRules,
      totalQueries,
      passedQueries,
      failedQueries,
      averageSyncRate,
      totalExecutionTime,
      averageExecutionTime,
      criticalFailures,
      highFailures,
      mediumFailures,
      lowFailures,
    };
  }

  /**
   * Get results by severity
   */
  getResultsBySeverity(
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): SyncValidationResult[] {
    return this.results.filter((r) =>
      r.queryResults.some((q) => q.severity === severity && !q.passed)
    );
  }

  /**
   * Get failed results
   */
  getFailedResults(): SyncValidationResult[] {
    return this.results.filter((r) => !r.passed);
  }

  /**
   * Get passed results
   */
  getPassedResults(): SyncValidationResult[] {
    return this.results.filter((r) => r.passed);
  }

  /**
   * Get all rules
   */
  getAllRules(): SyncValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): SyncValidationRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
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
    this.logger.info('Sync validation results cleared');
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
    this.logger.info('All sync validation rules cleared');
  }

  /**
   * Load predefined sync validation rules
   */
  loadPredefinedRules(): void {
    const predefinedRules: SyncValidationRule[] = [
      {
        id: 'sync-001',
        name: 'Test Suites Sync',
        description: 'Validate sync between test_suites and test_executions',
        sourceTable: 'test_suites',
        targetTable: 'test_executions',
        syncKey: 'suite_id',
        validationQueries: [
          {
            id: 'query-001',
            name: 'Suite Count Match',
            sourceQuery:
              'SELECT COUNT(*) FROM test_suites WHERE status = "active"',
            targetQuery: 'SELECT COUNT(DISTINCT suite_id) FROM test_executions',
            comparisonType: 'count',
            severity: 'critical',
          },
          {
            id: 'query-002',
            name: 'Execution Count Per Suite',
            sourceQuery:
              'SELECT AVG(execution_count) FROM (SELECT suite_id, COUNT(*) as execution_count FROM test_executions GROUP BY suite_id)',
            targetQuery: 'SELECT 10', // Expected average
            comparisonType: 'avg',
            expectedDifference: 2,
            severity: 'medium',
          },
        ],
        tolerance: 1,
        enabled: true,
      },
      {
        id: 'sync-002',
        name: 'Test Data Sync',
        description: 'Validate sync between test_data and test_executions',
        sourceTable: 'test_data',
        targetTable: 'test_executions',
        syncKey: 'data_id',
        validationQueries: [
          {
            id: 'query-003',
            name: 'Data Usage Count',
            sourceQuery:
              'SELECT COUNT(*) FROM test_data WHERE type = "anonymized"',
            targetQuery:
              'SELECT COUNT(DISTINCT test_data_id) FROM test_execution_data_usage',
            comparisonType: 'count',
            severity: 'high',
          },
        ],
        enabled: true,
      },
    ];

    predefinedRules.forEach((rule) => this.addRule(rule));
    this.logger.info(
      `Loaded ${predefinedRules.length} predefined sync validation rules`
    );
  }
}
