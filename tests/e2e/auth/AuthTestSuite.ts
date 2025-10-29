import { Page, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';
import { AuthTestUtils } from '../../utils/auth/AuthTestUtils';
import { AuthScenarios } from '../../utils/auth/AuthScenarios';
import { AuthValidator } from '../../utils/validation/AuthValidator';
import { AuthTestReporter } from '../../utils/reporting/AuthTestReporter';
import { AuthMetrics } from '../../utils/metrics/AuthMetrics';

export interface AuthTestConfig {
  baseUrl: string;
  testUsers: {
    admin: { email: string; password: string; role: string };
    user: { email: string; password: string; role: string };
    guest: { email: string; password: string; role: string };
  };
  timeout: number;
  retries: number;
}

export interface AuthTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class AuthTestSuite {
  private config: AuthTestConfig;
  private utils: AuthTestUtils;
  private scenarios: AuthScenarios;
  private validator: AuthValidator;
  private reporter: AuthTestReporter;
  private metrics: AuthMetrics;
  private results: AuthTestResult[] = [];

  constructor(config: AuthTestConfig) {
    this.config = config;
    this.utils = new AuthTestUtils(config);
    this.scenarios = new AuthScenarios(config);
    this.validator = new AuthValidator(config);
    this.reporter = new AuthTestReporter(config);
    this.metrics = new AuthMetrics(config);
  }

  async runLoginTests(page: Page): Promise<AuthTestResult[]> {
    const loginResults: AuthTestResult[] = [];

    testLogger.info('Starting login tests', { suite: 'AuthTestSuite' });

    // Test 1: Successful login with valid credentials
    try {
      const startTime = Date.now();
      await this.scenarios.successfulLogin(page, this.config.testUsers.user);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'successful_login',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      loginResults.push(result);
      testLogger.info('Login test passed', {
        test: 'successful_login',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'successful_login',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      loginResults.push(result);
      testLogger.error('Login test failed', error as Error, 'AuthTestSuite');
    }

    // Test 2: Failed login with invalid credentials
    try {
      const startTime = Date.now();
      await this.scenarios.failedLogin(page, {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'failed_login_invalid_credentials',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      loginResults.push(result);
      testLogger.info('Failed login test passed', {
        test: 'failed_login_invalid_credentials',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'failed_login_invalid_credentials',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      loginResults.push(result);
      testLogger.error(
        'Failed login test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    // Test 3: Login with empty fields
    try {
      const startTime = Date.now();
      await this.scenarios.loginWithEmptyFields(page);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'login_empty_fields',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      loginResults.push(result);
      testLogger.info('Empty fields login test passed', {
        test: 'login_empty_fields',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'login_empty_fields',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      loginResults.push(result);
      testLogger.error(
        'Empty fields login test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    // Test 4: Login with invalid email format
    try {
      const startTime = Date.now();
      await this.scenarios.loginWithInvalidEmail(page, 'invalid-email');
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'login_invalid_email_format',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      loginResults.push(result);
      testLogger.info('Invalid email format login test passed', {
        test: 'login_invalid_email_format',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'login_invalid_email_format',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      loginResults.push(result);
      testLogger.error(
        'Invalid email format login test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    this.results.push(...loginResults);
    return loginResults;
  }

  async runSignupTests(page: Page): Promise<AuthTestResult[]> {
    const signupResults: AuthTestResult[] = [];

    testLogger.info('Starting signup tests', { suite: 'AuthTestSuite' });

    // Test 1: Successful signup with valid data
    try {
      const startTime = Date.now();
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        confirmPassword: 'password123',
      };
      await this.scenarios.successfulSignup(page, userData);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'successful_signup',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      signupResults.push(result);
      testLogger.info('Signup test passed', {
        test: 'successful_signup',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'successful_signup',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      signupResults.push(result);
      testLogger.error('Signup test failed', error as Error, 'AuthTestSuite');
    }

    // Test 2: Signup with password mismatch
    try {
      const startTime = Date.now();
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        confirmPassword: 'differentpassword',
      };
      await this.scenarios.signupWithPasswordMismatch(page, userData);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'signup_password_mismatch',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      signupResults.push(result);
      testLogger.info('Password mismatch signup test passed', {
        test: 'signup_password_mismatch',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'signup_password_mismatch',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      signupResults.push(result);
      testLogger.error(
        'Password mismatch signup test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    // Test 3: Signup with existing email
    try {
      const startTime = Date.now();
      const userData = {
        name: 'Test User',
        email: this.config.testUsers.user.email,
        password: 'password123',
        confirmPassword: 'password123',
      };
      await this.scenarios.signupWithExistingEmail(page, userData);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'signup_existing_email',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      signupResults.push(result);
      testLogger.info('Existing email signup test passed', {
        test: 'signup_existing_email',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'signup_existing_email',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      signupResults.push(result);
      testLogger.error(
        'Existing email signup test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    this.results.push(...signupResults);
    return signupResults;
  }

  async runLogoutTests(page: Page): Promise<AuthTestResult[]> {
    const logoutResults: AuthTestResult[] = [];

    testLogger.info('Starting logout tests', { suite: 'AuthTestSuite' });

    // Test 1: Successful logout
    try {
      const startTime = Date.now();
      await this.scenarios.successfulLogout(page, this.config.testUsers.user);
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'successful_logout',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      logoutResults.push(result);
      testLogger.info('Logout test passed', {
        test: 'successful_logout',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'successful_logout',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      logoutResults.push(result);
      testLogger.error('Logout test failed', error as Error, 'AuthTestSuite');
    }

    // Test 2: Logout with confirmation dialog
    try {
      const startTime = Date.now();
      await this.scenarios.logoutWithConfirmation(
        page,
        this.config.testUsers.user
      );
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'logout_with_confirmation',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      logoutResults.push(result);
      testLogger.info('Logout with confirmation test passed', {
        test: 'logout_with_confirmation',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'logout_with_confirmation',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      logoutResults.push(result);
      testLogger.error(
        'Logout with confirmation test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    this.results.push(...logoutResults);
    return logoutResults;
  }

  async runRoleBasedAccessTests(page: Page): Promise<AuthTestResult[]> {
    const roleResults: AuthTestResult[] = [];

    testLogger.info('Starting role-based access tests', {
      suite: 'AuthTestSuite',
    });

    // Test 1: Admin access to admin pages
    try {
      const startTime = Date.now();
      await this.scenarios.adminAccessToAdminPages(
        page,
        this.config.testUsers.admin
      );
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'admin_access_admin_pages',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      roleResults.push(result);
      testLogger.info('Admin access test passed', {
        test: 'admin_access_admin_pages',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'admin_access_admin_pages',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      roleResults.push(result);
      testLogger.error(
        'Admin access test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    // Test 2: User denied access to admin pages
    try {
      const startTime = Date.now();
      await this.scenarios.userDeniedAccessToAdminPages(
        page,
        this.config.testUsers.user
      );
      const duration = Date.now() - startTime;

      const result: AuthTestResult = {
        testName: 'user_denied_admin_pages',
        status: 'passed',
        duration,
        metrics: await this.metrics.collectMetrics(page),
      };

      roleResults.push(result);
      testLogger.info('User access denial test passed', {
        test: 'user_denied_admin_pages',
        duration,
      });
    } catch (error) {
      const result: AuthTestResult = {
        testName: 'user_denied_admin_pages',
        status: 'failed',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      roleResults.push(result);
      testLogger.error(
        'User access denial test failed',
        error as Error,
        'AuthTestSuite'
      );
    }

    this.results.push(...roleResults);
    return roleResults;
  }

  async runAllTests(page: Page): Promise<AuthTestResult[]> {
    testLogger.info('Starting all authentication tests', {
      suite: 'AuthTestSuite',
    });

    const allResults: AuthTestResult[] = [];

    // Run all test categories
    const loginResults = await this.runLoginTests(page);
    const signupResults = await this.runSignupTests(page);
    const logoutResults = await this.runLogoutTests(page);
    const roleResults = await this.runRoleBasedAccessTests(page);

    allResults.push(
      ...loginResults,
      ...signupResults,
      ...logoutResults,
      ...roleResults
    );

    // Generate comprehensive report
    await this.reporter.generateReport(allResults);

    testLogger.info('All authentication tests completed', {
      suite: 'AuthTestSuite',
      totalTests: allResults.length,
      passed: allResults.filter((r) => r.status === 'passed').length,
      failed: allResults.filter((r) => r.status === 'failed').length,
      skipped: allResults.filter((r) => r.status === 'skipped').length,
    });

    return allResults;
  }

  async validateTestEnvironment(page: Page): Promise<boolean> {
    try {
      // Check if login page is accessible
      await page.goto(`${this.config.baseUrl}/login`);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Check if signup page is accessible
      await page.goto(`${this.config.baseUrl}/signup`);
      await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();

      // Check if dashboard is accessible (should redirect to login)
      await page.goto(`${this.config.baseUrl}/dashboard`);
      await expect(page).toHaveURL(/\/login/);

      testLogger.info('Test environment validation passed', {
        suite: 'AuthTestSuite',
      });
      return true;
    } catch (error) {
      testLogger.error(
        'Test environment validation failed',
        error as Error,
        'AuthTestSuite'
      );
      return false;
    }
  }

  getResults(): AuthTestResult[] {
    return this.results;
  }

  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    averageDuration: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const averageDuration =
      total > 0
        ? this.results.reduce((sum, r) => sum + r.duration, 0) / total
        : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate,
      averageDuration,
    };
  }
}
