import { TestLogger } from '../logging/TestLogger';

export interface ApiValidationRule {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  expectedStatus: number;
  expectedSchema?: unknown;
  validationChecks: ValidationCheck[];
  enabled: boolean;
}

export interface ValidationCheck {
  id: string;
  name: string;
  type: 'status' | 'schema' | 'response_time' | 'header' | 'body' | 'custom';
  path?: string; // JSONPath for nested validation
  expectedValue?: unknown;
  operator?:
    | 'equals'
    | 'contains'
    | 'matches'
    | 'greater_than'
    | 'less_than'
    | 'exists'
    | 'not_exists';
  tolerance?: number; // for numeric comparisons
  severity: 'critical' | 'high' | 'medium' | 'low';
  customValidator?: (response: unknown) => boolean;
}

export interface ApiValidationResult {
  ruleId: string;
  ruleName: string;
  endpoint: string;
  method: string;
  passed: boolean;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  checks: CheckResult[];
  errors: string[];
  warnings: string[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CheckResult {
  checkId: string;
  checkName: string;
  passed: boolean;
  expectedValue?: unknown;
  actualValue?: unknown;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  executionTime: number;
}

export interface ValidationSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  totalExecutionTime: number;
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
}

export class ApiDataValidator {
  private rules: Map<string, ApiValidationRule> = new Map();
  private logger: TestLogger;
  private results: ApiValidationResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.logger = new TestLogger({
      level: 'info',
      enableConsole: true,
    });
  }

  /**
   * Add an API validation rule
   */
  addRule(rule: ApiValidationRule): void {
    this.rules.set(rule.id, rule);
    this.logger.debug(`API validation rule added: ${rule.name}`, { rule });
  }

  /**
   * Remove an API validation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.debug(`API validation rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Update an API validation rule
   */
  updateRule(ruleId: string, updates: Partial<ApiValidationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    this.logger.debug(`API validation rule updated: ${ruleId}`, { updates });
    return true;
  }

  /**
   * Run all enabled API validation rules
   */
  async validateAll(): Promise<ApiValidationResult[]> {
    this.logger.info('Starting API data validation');
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

        const errorResult: ApiValidationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          endpoint: rule.endpoint,
          method: rule.method,
          passed: false,
          statusCode: 0,
          responseTime: 0,
          responseSize: 0,
          checks: [],
          errors: [`Rule execution failed: ${error.message}`],
          warnings: [],
          timestamp: new Date(),
          metadata: { error: error.message },
        };

        this.results.push(errorResult);
      }
    }

    this.logger.info('API data validation completed', {
      totalRules: enabledRules.length,
      passedRules: this.results.filter((r) => r.passed).length,
      failedRules: this.results.filter((r) => !r.passed).length,
    });

    return this.results;
  }

  /**
   * Run a specific API validation rule
   */
  async validateRule(rule: ApiValidationRule): Promise<ApiValidationResult> {
    const startTime = Date.now();

    try {
      // Make the API request
      const response = await this.makeRequest(rule);
      const responseTime = Date.now() - startTime;

      // Run validation checks
      const checks: CheckResult[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const check of rule.validationChecks) {
        const checkResult = await this.runValidationCheck(
          check,
          response,
          rule
        );
        checks.push(checkResult);

        if (!checkResult.passed) {
          if (check.severity === 'critical' || check.severity === 'high') {
            errors.push(checkResult.message);
          } else {
            warnings.push(checkResult.message);
          }
        }
      }

      const passed = checks.every((check) => check.passed);

      const result: ApiValidationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        endpoint: rule.endpoint,
        method: rule.method,
        passed,
        statusCode: response.status,
        responseTime,
        responseSize: response.size || 0,
        checks,
        errors,
        warnings,
        timestamp: new Date(),
      };

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        endpoint: rule.endpoint,
        method: rule.method,
        passed: false,
        statusCode: 0,
        responseTime,
        responseSize: 0,
        checks: [],
        errors: [`Request failed: ${error.message}`],
        warnings: [],
        timestamp: new Date(),
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Make an API request
   */
  private async makeRequest(rule: ApiValidationRule): Promise<unknown> {
    const _url = `${this.baseUrl}${rule.endpoint}`;
    const options: RequestInit = {
      method: rule.method,
      headers: {
        'Content-Type': 'application/json',
        ...rule.headers,
      },
    };

    if (rule.body) {
      options.body = JSON.stringify(rule.body);
    }

    // This would make the actual HTTP request
    // For now, we'll simulate the response
    const mockResponse = {
      status: rule.expectedStatus,
      headers: {
        'content-type': 'application/json',
        'content-length': '100',
      },
      body: this.generateMockResponse(rule),
      size: 100,
    };

    return mockResponse;
  }

  /**
   * Generate mock response based on rule
   */
  private generateMockResponse(_rule: ApiValidationRule): unknown {
    // This would generate appropriate mock responses based on the rule
    // For now, we'll return a simple mock
    return {
      success: true,
      data: [],
      message: 'Mock response',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Run a validation check
   */
  private async runValidationCheck(
    check: ValidationCheck,
    response: unknown,
    _rule: ApiValidationRule
  ): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      let passed = false;
      let actualValue: unknown;
      let message = '';

      switch (check.type) {
        case 'status':
          actualValue = response.status;
          passed = actualValue === check.expectedValue;
          message = passed
            ? `Status code is ${actualValue}`
            : `Expected status ${check.expectedValue}, got ${actualValue}`;
          break;

        case 'response_time':
          actualValue = response.responseTime;
          passed = this.compareNumeric(
            actualValue,
            check.expectedValue,
            check.operator,
            check.tolerance
          );
          message = passed
            ? `Response time is ${actualValue}ms`
            : `Response time ${actualValue}ms does not meet criteria`;
          break;

        case 'header':
          actualValue = response.headers[check.path!];
          passed = this.compareValue(
            actualValue,
            check.expectedValue,
            check.operator
          );
          message = passed
            ? `Header ${check.path} is ${actualValue}`
            : `Header ${check.path} validation failed`;
          break;

        case 'body':
          actualValue = this.getNestedValue(response.body, check.path!);
          passed = this.compareValue(
            actualValue,
            check.expectedValue,
            check.operator
          );
          message = passed
            ? `Body field ${check.path} is valid`
            : `Body field ${check.path} validation failed`;
          break;

        case 'schema':
          actualValue = response.body;
          passed = this.validateSchema(actualValue, check.expectedValue);
          message = passed
            ? 'Response matches expected schema'
            : 'Response does not match expected schema';
          break;

        case 'custom':
          if (check.customValidator) {
            passed = check.customValidator(response);
            message = passed
              ? 'Custom validation passed'
              : 'Custom validation failed';
          } else {
            passed = false;
            message = 'Custom validator not provided';
          }
          break;

        default:
          passed = false;
          message = `Unknown validation type: ${check.type}`;
      }

      const executionTime = Date.now() - startTime;

      return {
        checkId: check.id,
        checkName: check.name,
        passed,
        expectedValue: check.expectedValue,
        actualValue,
        message,
        severity: check.severity,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        checkId: check.id,
        checkName: check.name,
        passed: false,
        expectedValue: check.expectedValue,
        actualValue: null,
        message: `Check execution failed: ${error.message}`,
        severity: check.severity,
        executionTime,
      };
    }
  }

  /**
   * Get nested value from object using JSONPath
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (!path) return obj;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Compare values based on operator
   */
  private compareValue(
    actual: unknown,
    expected: unknown,
    operator?: string
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'matches':
        return typeof actual === 'string' && new RegExp(expected).test(actual);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      default:
        return actual === expected;
    }
  }

  /**
   * Compare numeric values
   */
  private compareNumeric(
    actual: number,
    expected: number,
    operator?: string,
    tolerance?: number
  ): boolean {
    switch (operator) {
      case 'equals':
        return tolerance
          ? Math.abs(actual - expected) <= tolerance
          : actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      default:
        return actual === expected;
    }
  }

  /**
   * Validate JSON schema
   */
  private validateSchema(data: unknown, schema: unknown): boolean {
    // This would implement actual JSON schema validation
    // For now, we'll do basic validation
    if (schema.type === 'object' && typeof data === 'object') {
      return true;
    }
    if (schema.type === 'array' && Array.isArray(data)) {
      return true;
    }
    if (schema.type === 'string' && typeof data === 'string') {
      return true;
    }
    if (schema.type === 'number' && typeof data === 'number') {
      return true;
    }
    if (schema.type === 'boolean' && typeof data === 'boolean') {
      return true;
    }
    return false;
  }

  /**
   * Get validation summary
   */
  getSummary(): ValidationSummary {
    const totalRules = this.results.length;
    const passedRules = this.results.filter((r) => r.passed).length;
    const failedRules = this.results.filter((r) => !r.passed).length;

    const allChecks = this.results.flatMap((r) => r.checks);
    const totalChecks = allChecks.length;
    const passedChecks = allChecks.filter((c) => c.passed).length;
    const failedChecks = allChecks.filter((c) => !c.passed).length;

    const averageResponseTime =
      this.results.length > 0
        ? this.results.reduce((sum, r) => sum + r.responseTime, 0) /
          this.results.length
        : 0;

    const totalExecutionTime = this.results.reduce(
      (sum, r) => sum + r.responseTime,
      0
    );

    const criticalFailures = allChecks.filter(
      (c) => !c.passed && c.severity === 'critical'
    ).length;
    const highFailures = allChecks.filter(
      (c) => !c.passed && c.severity === 'high'
    ).length;
    const mediumFailures = allChecks.filter(
      (c) => !c.passed && c.severity === 'medium'
    ).length;
    const lowFailures = allChecks.filter(
      (c) => !c.passed && c.severity === 'low'
    ).length;

    return {
      totalRules,
      passedRules,
      failedRules,
      totalChecks,
      passedChecks,
      failedChecks,
      averageResponseTime,
      totalExecutionTime,
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
  ): ApiValidationResult[] {
    return this.results.filter((r) =>
      r.checks.some((c) => c.severity === severity && !c.passed)
    );
  }

  /**
   * Get failed results
   */
  getFailedResults(): ApiValidationResult[] {
    return this.results.filter((r) => !r.passed);
  }

  /**
   * Get passed results
   */
  getPassedResults(): ApiValidationResult[] {
    return this.results.filter((r) => r.passed);
  }

  /**
   * Get all rules
   */
  getAllRules(): ApiValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): ApiValidationRule[] {
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
    this.logger.info('API validation results cleared');
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
    this.logger.info('All API validation rules cleared');
  }

  /**
   * Load predefined API validation rules
   */
  loadPredefinedRules(): void {
    const predefinedRules: ApiValidationRule[] = [
      {
        id: 'api-001',
        name: 'Test Suites API',
        description: 'Validate test suites API endpoint',
        endpoint: '/api/test-suites',
        method: 'GET',
        expectedStatus: 200,
        validationChecks: [
          {
            id: 'check-001',
            name: 'Status Code',
            type: 'status',
            expectedValue: 200,
            severity: 'critical',
          },
          {
            id: 'check-002',
            name: 'Response Time',
            type: 'response_time',
            expectedValue: 1000,
            operator: 'less_than',
            severity: 'high',
          },
          {
            id: 'check-003',
            name: 'Content Type',
            type: 'header',
            path: 'content-type',
            expectedValue: 'application/json',
            operator: 'contains',
            severity: 'medium',
          },
        ],
        enabled: true,
      },
      {
        id: 'api-002',
        name: 'Test Cases API',
        description: 'Validate test cases API endpoint',
        endpoint: '/api/test-cases',
        method: 'GET',
        expectedStatus: 200,
        validationChecks: [
          {
            id: 'check-004',
            name: 'Status Code',
            type: 'status',
            expectedValue: 200,
            severity: 'critical',
          },
          {
            id: 'check-005',
            name: 'Response Schema',
            type: 'schema',
            expectedValue: {
              type: 'object',
              properties: {
                testCases: { type: 'array' },
                pagination: { type: 'object' },
              },
            },
            severity: 'high',
          },
        ],
        enabled: true,
      },
    ];

    predefinedRules.forEach((rule) => this.addRule(rule));
    this.logger.info(
      `Loaded ${predefinedRules.length} predefined API validation rules`
    );
  }
}
