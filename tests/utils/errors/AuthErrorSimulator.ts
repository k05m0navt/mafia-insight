import { Page, Route } from '@playwright/test';
import { testLogger } from '../logging/TestLogger';

export interface ErrorSimulationConfig {
  errorType:
    | 'network'
    | 'server'
    | 'validation'
    | 'timeout'
    | 'rateLimit'
    | 'auth'
    | 'permission';
  statusCode?: number;
  delay?: number;
  message?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface NetworkErrorConfig {
  type: 'offline' | 'slow' | 'unstable' | 'timeout';
  delay?: number;
  failureRate?: number;
  timeout?: number;
}

export interface ServerErrorConfig {
  statusCode: number;
  message: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ValidationErrorConfig {
  field: string;
  message: string;
  code: string;
}

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
  remaining: number;
  resetTime: number;
}

export class AuthErrorSimulator {
  private page: Page;
  private activeMocks: Map<string, Route> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Simulates a network error for authentication endpoints
   */
  public async simulateNetworkError(config: NetworkErrorConfig): Promise<void> {
    testLogger.info('Simulating network error', { config });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      // Add delay if specified
      if (config.delay) {
        await new Promise((resolve) => setTimeout(resolve, config.delay));
      }

      switch (config.type) {
        case 'offline':
          await route.abort('failed');
          break;
        case 'slow':
          await new Promise((resolve) =>
            setTimeout(resolve, config.delay || 5000)
          );
          await route.continue();
          break;
        case 'unstable':
          if (Math.random() < (config.failureRate || 0.5)) {
            await route.abort('failed');
          } else {
            await route.continue();
          }
          break;
        case 'timeout':
          await route.abort('timedout');
          break;
        default:
          await route.continue();
      }
    });

    testLogger.info('Network error simulation activated', { config });
  }

  /**
   * Simulates server errors for authentication endpoints
   */
  public async simulateServerError(config: ServerErrorConfig): Promise<void> {
    testLogger.info('Simulating server error', { config });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      // Add delay if specified
      if (config.delay) {
        await new Promise((resolve) => setTimeout(resolve, config.delay));
      }

      await route.fulfill({
        status: config.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          success: false,
          error: config.message,
          ...config.body,
        }),
      });
    });

    testLogger.info('Server error simulation activated', { config });
  }

  /**
   * Simulates validation errors for authentication forms
   */
  public async simulateValidationError(
    config: ValidationErrorConfig
  ): Promise<void> {
    testLogger.info('Simulating validation error', { config });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: {
            [config.field]: [config.message],
          },
          code: config.code,
        }),
      });
    });

    testLogger.info('Validation error simulation activated', { config });
  }

  /**
   * Simulates rate limiting for authentication endpoints
   */
  public async simulateRateLimit(config: RateLimitConfig): Promise<void> {
    testLogger.info('Simulating rate limit', { config });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': config.remaining.toString(),
          'X-RateLimit-Reset': config.resetTime.toString(),
        },
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: config.window,
        }),
      });
    });

    testLogger.info('Rate limit simulation activated', { config });
  }

  /**
   * Simulates authentication errors (invalid credentials, expired tokens, etc.)
   */
  public async simulateAuthError(
    errorType:
      | 'invalid_credentials'
      | 'expired_token'
      | 'invalid_token'
      | 'account_locked'
      | 'email_not_verified'
  ): Promise<void> {
    testLogger.info('Simulating auth error', { errorType });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      let statusCode = 401;
      let message = 'Authentication failed';

      switch (errorType) {
        case 'invalid_credentials':
          statusCode = 401;
          message = 'Invalid email or password';
          break;
        case 'expired_token':
          statusCode = 401;
          message = 'Token has expired';
          break;
        case 'invalid_token':
          statusCode = 401;
          message = 'Invalid token';
          break;
        case 'account_locked':
          statusCode = 423;
          message = 'Account is locked';
          break;
        case 'email_not_verified':
          statusCode = 403;
          message = 'Email not verified';
          break;
      }

      await route.fulfill({
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: message,
          code: errorType,
        }),
      });
    });

    testLogger.info('Auth error simulation activated', { errorType });
  }

  /**
   * Simulates permission errors for role-based access
   */
  public async simulatePermissionError(
    resource: string,
    action: string
  ): Promise<void> {
    testLogger.info('Simulating permission error', { resource, action });

    const routePattern = '**/api/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();
      const url = new URL(request.url());

      // Only apply to specific resource
      if (url.pathname.includes(resource)) {
        await route.fulfill({
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: false,
            error: 'Access denied',
            details: `You don't have permission to ${action} ${resource}`,
          }),
        });
      } else {
        await route.continue();
      }
    });

    testLogger.info('Permission error simulation activated', {
      resource,
      action,
    });
  }

  /**
   * Simulates timeout errors for authentication endpoints
   */
  public async simulateTimeout(timeout: number = 30000): Promise<void> {
    testLogger.info('Simulating timeout', { timeout });

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      // Simulate timeout by not responding
      setTimeout(async () => {
        try {
          await route.abort('timedout');
        } catch (_error) {
          // Route might already be handled
        }
      }, timeout);
    });

    testLogger.info('Timeout simulation activated', { timeout });
  }

  /**
   * Simulates database connection errors
   */
  public async simulateDatabaseError(): Promise<void> {
    testLogger.info('Simulating database error');

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
        }),
      });
    });

    testLogger.info('Database error simulation activated');
  }

  /**
   * Simulates email service errors
   */
  public async simulateEmailServiceError(): Promise<void> {
    testLogger.info('Simulating email service error');

    const routePattern = '**/api/auth/send-verification**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Email service unavailable',
          code: 'EMAIL_SERVICE_ERROR',
        }),
      });
    });

    testLogger.info('Email service error simulation activated');
  }

  /**
   * Simulates session expiration
   */
  public async simulateSessionExpiration(): Promise<void> {
    testLogger.info('Simulating session expiration');

    const routePattern = '**/api/auth/verify-session**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        }),
      });
    });

    testLogger.info('Session expiration simulation activated');
  }

  /**
   * Simulates CSRF token errors
   */
  public async simulateCSRFError(): Promise<void> {
    testLogger.info('Simulating CSRF error');

    const routePattern = '**/api/auth/**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid CSRF token',
          code: 'CSRF_ERROR',
        }),
      });
    });

    testLogger.info('CSRF error simulation activated');
  }

  /**
   * Simulates CAPTCHA errors
   */
  public async simulateCAPTCHAError(): Promise<void> {
    testLogger.info('Simulating CAPTCHA error');

    const routePattern = '**/api/auth/login**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'CAPTCHA verification failed',
          code: 'CAPTCHA_ERROR',
        }),
      });
    });

    testLogger.info('CAPTCHA error simulation activated');
  }

  /**
   * Simulates account lockout after multiple failed attempts
   */
  public async simulateAccountLockout(attempts: number = 5): Promise<void> {
    testLogger.info('Simulating account lockout', { attempts });

    let attemptCount = 0;
    const routePattern = '**/api/auth/login**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();
      attemptCount++;

      if (attemptCount >= attempts) {
        await route.fulfill({
          status: 423,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: false,
            error: 'Account locked due to multiple failed attempts',
            code: 'ACCOUNT_LOCKED',
            lockoutDuration: 300, // 5 minutes
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
            remainingAttempts: attempts - attemptCount,
          }),
        });
      }
    });

    testLogger.info('Account lockout simulation activated', { attempts });
  }

  /**
   * Simulates password policy violations
   */
  public async simulatePasswordPolicyError(): Promise<void> {
    testLogger.info('Simulating password policy error');

    const routePattern = '**/api/auth/register**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Password does not meet policy requirements',
          code: 'PASSWORD_POLICY_ERROR',
          details: {
            password: [
              'Password must be at least 8 characters long',
              'Password must contain at least one uppercase letter',
              'Password must contain at least one lowercase letter',
              'Password must contain at least one number',
              'Password must contain at least one special character',
            ],
          },
        }),
      });
    });

    testLogger.info('Password policy error simulation activated');
  }

  /**
   * Simulates email verification errors
   */
  public async simulateEmailVerificationError(): Promise<void> {
    testLogger.info('Simulating email verification error');

    const routePattern = '**/api/auth/verify-email**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid or expired verification token',
          code: 'INVALID_VERIFICATION_TOKEN',
        }),
      });
    });

    testLogger.info('Email verification error simulation activated');
  }

  /**
   * Simulates password reset errors
   */
  public async simulatePasswordResetError(): Promise<void> {
    testLogger.info('Simulating password reset error');

    const routePattern = '**/api/auth/reset-password**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN',
        }),
      });
    });

    testLogger.info('Password reset error simulation activated');
  }

  /**
   * Simulates OAuth provider errors
   */
  public async simulateOAuthError(
    provider: 'google' | 'github' | 'facebook'
  ): Promise<void> {
    testLogger.info('Simulating OAuth error', { provider });

    const routePattern = `**/api/auth/${provider}/callback**`;

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      await route.fulfill({
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: `OAuth ${provider} authentication failed`,
          code: `OAUTH_${provider.toUpperCase()}_ERROR`,
        }),
      });
    });

    testLogger.info('OAuth error simulation activated', { provider });
  }

  /**
   * Simulates JWT token errors
   */
  public async simulateJWTError(
    errorType: 'malformed' | 'expired' | 'invalid_signature' | 'missing'
  ): Promise<void> {
    testLogger.info('Simulating JWT error', { errorType });

    const routePattern = '**/api/auth/verify-token**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      const statusCode = 401;
      let message = 'JWT token error';

      switch (errorType) {
        case 'malformed':
          message = 'Malformed JWT token';
          break;
        case 'expired':
          message = 'JWT token has expired';
          break;
        case 'invalid_signature':
          message = 'Invalid JWT signature';
          break;
        case 'missing':
          message = 'JWT token is missing';
          break;
      }

      await route.fulfill({
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: message,
          code: `JWT_${errorType.toUpperCase()}_ERROR`,
        }),
      });
    });

    testLogger.info('JWT error simulation activated', { errorType });
  }

  /**
   * Simulates concurrent login attempts
   */
  public async simulateConcurrentLogin(): Promise<void> {
    testLogger.info('Simulating concurrent login');

    const routePattern = '**/api/auth/login**';

    await this.page.route(routePattern, async (route) => {
      const _request = route.request();

      // Simulate delay to test concurrent requests
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: 'test@example.com' },
          token: 'jwt-token',
        }),
      });
    });

    testLogger.info('Concurrent login simulation activated');
  }

  /**
   * Clears all active error simulations
   */
  public async clearAllSimulations(): Promise<void> {
    testLogger.info('Clearing all error simulations');

    for (const [_pattern, route] of this.activeMocks) {
      try {
        await route.abort();
      } catch (_error) {
        // Route might already be handled
      }
    }

    this.activeMocks.clear();

    // Unroute all patterns
    await this.page.unroute('**/api/auth/**');
    await this.page.unroute('**/api/**');

    testLogger.info('All error simulations cleared');
  }

  /**
   * Clears specific error simulation
   */
  public async clearSimulation(pattern: string): Promise<void> {
    testLogger.info('Clearing error simulation', { pattern });

    const route = this.activeMocks.get(pattern);
    if (route) {
      try {
        await route.abort();
      } catch (_error) {
        // Route might already be handled
      }
      this.activeMocks.delete(pattern);
    }

    await this.page.unroute(pattern);

    testLogger.info('Error simulation cleared', { pattern });
  }

  /**
   * Gets list of active simulations
   */
  public getActiveSimulations(): string[] {
    return Array.from(this.activeMocks.keys());
  }

  /**
   * Checks if a simulation is active
   */
  public isSimulationActive(pattern: string): boolean {
    return this.activeMocks.has(pattern);
  }
}
