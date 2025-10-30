import { Page, BrowserContext, Browser } from '@playwright/test';
import { testLogger } from '../logging/TestLogger';
import {
  UserDataGenerator,
  UserData,
  TestUserCredentials,
} from '../data/auth/UserDataGenerator';
import { AuthErrorSimulator } from '../errors/AuthErrorSimulator';

export interface TestEnvironment {
  name: string;
  baseUrl: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  email: {
    provider: string;
    apiKey: string;
    fromEmail: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  features: {
    registration: boolean;
    passwordReset: boolean;
    emailVerification: boolean;
    twoFactor: boolean;
    socialLogin: boolean;
    rateLimiting: boolean;
  };
  limits: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    passwordMaxLength: number;
    sessionTimeout: number;
  };
}

export interface TestUser {
  id: string;
  credentials: TestUserCredentials;
  data: UserData;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface TestSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export class AuthTestSetup {
  private page: Page;
  private context: BrowserContext;
  private browser: Browser;
  private environment: TestEnvironment;
  private userGenerator: UserDataGenerator;
  private errorSimulator: AuthErrorSimulator;
  private testUsers: Map<string, TestUser> = new Map();
  private testSessions: Map<string, TestSession> = new Map();

  constructor(
    page: Page,
    context: BrowserContext,
    browser: Browser,
    environment: TestEnvironment
  ) {
    this.page = page;
    this.context = context;
    this.browser = browser;
    this.environment = environment;
    this.userGenerator = UserDataGenerator.getInstance();
    this.errorSimulator = new AuthErrorSimulator(page);
  }

  /**
   * Sets up the test environment for authentication tests
   */
  public async setupEnvironment(): Promise<void> {
    testLogger.info('Setting up authentication test environment', {
      environment: this.environment.name,
    });

    try {
      // Clear browser storage
      await this.clearBrowserStorage();

      // Set up test environment variables
      await this.setEnvironmentVariables();

      // Set up test database
      await this.setupTestDatabase();

      // Set up test Redis
      await this.setupTestRedis();

      // Set up test email service
      await this.setupTestEmailService();

      // Set up test JWT configuration
      await this.setupTestJWT();

      // Set up test features
      await this.setupTestFeatures();

      // Set up test limits
      await this.setupTestLimits();

      testLogger.info('Authentication test environment setup completed', {
        environment: this.environment.name,
      });
    } catch (error) {
      testLogger.error('Failed to setup authentication test environment', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cleans up the test environment after tests
   */
  public async cleanupEnvironment(): Promise<void> {
    testLogger.info('Cleaning up authentication test environment', {
      environment: this.environment.name,
    });

    try {
      // Clear test users
      await this.clearTestUsers();

      // Clear test sessions
      await this.clearTestSessions();

      // Clear browser storage
      await this.clearBrowserStorage();

      // Clear error simulations
      await this.errorSimulator.clearAllSimulations();

      // Clear test database
      await this.clearTestDatabase();

      // Clear test Redis
      await this.clearTestRedis();

      testLogger.info('Authentication test environment cleanup completed', {
        environment: this.environment.name,
      });
    } catch (error) {
      testLogger.error('Failed to cleanup authentication test environment', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Creates a test user with specified role
   */
  public async createTestUser(
    role: 'admin' | 'user' | 'guest' = 'user',
    overrides: Partial<UserData> = {}
  ): Promise<TestUser> {
    testLogger.info('Creating test user', { role });

    try {
      const credentials = this.userGenerator.generateTestCredentials(role);
      const userData = this.userGenerator.generateUserData({
        ...overrides,
        role,
      });

      const testUser: TestUser = {
        id: userData.id,
        credentials,
        data: userData,
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: undefined,
      };

      // Store in test database
      await this.storeTestUser(testUser);

      // Store in memory
      this.testUsers.set(testUser.id, testUser);

      testLogger.info('Test user created successfully', {
        id: testUser.id,
        email: testUser.credentials.email,
        role,
      });
      return testUser;
    } catch (error) {
      testLogger.error('Failed to create test user', {
        error: error.message,
        role,
      });
      throw error;
    }
  }

  /**
   * Creates multiple test users
   */
  public async createTestUsers(
    count: number,
    role: 'admin' | 'user' | 'guest' = 'user'
  ): Promise<TestUser[]> {
    testLogger.info('Creating multiple test users', { count, role });

    const users: TestUser[] = [];

    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser(role);
      users.push(user);
    }

    testLogger.info('Multiple test users created successfully', {
      count,
      role,
    });
    return users;
  }

  /**
   * Creates a test session for a user
   */
  public async createTestSession(userId: string): Promise<TestSession> {
    testLogger.info('Creating test session', { userId });

    try {
      const user = this.testUsers.get(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const session: TestSession = {
        id: this.userGenerator.generateUserData().id,
        userId,
        token: this.generateJWTToken(user.data),
        refreshToken: this.generateRefreshToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        isActive: true,
      };

      // Store in test database
      await this.storeTestSession(session);

      // Store in memory
      this.testSessions.set(session.id, session);

      // Update user last login
      user.lastLoginAt = new Date();
      this.testUsers.set(userId, user);

      testLogger.info('Test session created successfully', {
        sessionId: session.id,
        userId,
      });
      return session;
    } catch (error) {
      testLogger.error('Failed to create test session', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Logs in a test user
   */
  public async loginTestUser(
    credentials: TestUserCredentials
  ): Promise<TestSession> {
    testLogger.info('Logging in test user', { email: credentials.email });

    try {
      // Find user by credentials
      const user = Array.from(this.testUsers.values()).find(
        (u) =>
          u.credentials.email === credentials.email &&
          u.credentials.password === credentials.password
      );

      if (!user) {
        throw new Error(
          `User with email ${credentials.email} not found or invalid credentials`
        );
      }

      if (!user.isActive) {
        throw new Error(`User with email ${credentials.email} is not active`);
      }

      // Create session
      const session = await this.createTestSession(user.id);

      // Set session in browser
      await this.setSessionInBrowser(session);

      testLogger.info('Test user logged in successfully', {
        email: credentials.email,
        sessionId: session.id,
      });
      return session;
    } catch (error) {
      testLogger.error('Failed to login test user', {
        error: error.message,
        email: credentials.email,
      });
      throw error;
    }
  }

  /**
   * Logs out a test user
   */
  public async logoutTestUser(sessionId: string): Promise<void> {
    testLogger.info('Logging out test user', { sessionId });

    try {
      const session = this.testSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      // Deactivate session
      session.isActive = false;
      this.testSessions.set(sessionId, session);

      // Remove session from browser
      await this.removeSessionFromBrowser();

      testLogger.info('Test user logged out successfully', { sessionId });
    } catch (error) {
      testLogger.error('Failed to logout test user', {
        error: error.message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Sets up error simulation for testing
   */
  public async setupErrorSimulation(
    errorType: string,
    config: Record<string, unknown>
  ): Promise<void> {
    testLogger.info('Setting up error simulation', { errorType, config });

    try {
      switch (errorType) {
        case 'network':
          await this.errorSimulator.simulateNetworkError(config);
          break;
        case 'server':
          await this.errorSimulator.simulateServerError(config);
          break;
        case 'validation':
          await this.errorSimulator.simulateValidationError(config);
          break;
        case 'rateLimit':
          await this.errorSimulator.simulateRateLimit(config);
          break;
        case 'auth':
          await this.errorSimulator.simulateAuthError(config);
          break;
        case 'permission':
          await this.errorSimulator.simulatePermissionError(
            config.resource,
            config.action
          );
          break;
        case 'timeout':
          await this.errorSimulator.simulateTimeout(config.timeout);
          break;
        case 'database':
          await this.errorSimulator.simulateDatabaseError();
          break;
        case 'email':
          await this.errorSimulator.simulateEmailServiceError();
          break;
        case 'session':
          await this.errorSimulator.simulateSessionExpiration();
          break;
        case 'csrf':
          await this.errorSimulator.simulateCSRFError();
          break;
        case 'captcha':
          await this.errorSimulator.simulateCAPTCHAError();
          break;
        case 'lockout':
          await this.errorSimulator.simulateAccountLockout(config.attempts);
          break;
        case 'password':
          await this.errorSimulator.simulatePasswordPolicyError();
          break;
        case 'verification':
          await this.errorSimulator.simulateEmailVerificationError();
          break;
        case 'reset':
          await this.errorSimulator.simulatePasswordResetError();
          break;
        case 'oauth':
          await this.errorSimulator.simulateOAuthError(config.provider);
          break;
        case 'jwt':
          await this.errorSimulator.simulateJWTError(config.errorType);
          break;
        case 'concurrent':
          await this.errorSimulator.simulateConcurrentLogin();
          break;
        default:
          throw new Error(`Unknown error type: ${errorType}`);
      }

      testLogger.info('Error simulation setup completed', { errorType });
    } catch (error) {
      testLogger.error('Failed to setup error simulation', {
        error: error.message,
        errorType,
      });
      throw error;
    }
  }

  /**
   * Clears error simulations
   */
  public async clearErrorSimulations(): Promise<void> {
    testLogger.info('Clearing error simulations');

    try {
      await this.errorSimulator.clearAllSimulations();
      testLogger.info('Error simulations cleared successfully');
    } catch (error) {
      testLogger.error('Failed to clear error simulations', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sets up test data for specific scenarios
   */
  public async setupTestScenario(scenario: string): Promise<void> {
    testLogger.info('Setting up test scenario', { scenario });

    try {
      switch (scenario) {
        case 'login_success':
          await this.createTestUser('user');
          break;
        case 'login_failure':
          // No user created, will test with invalid credentials
          break;
        case 'signup_success':
          // No user created, will test signup flow
          break;
        case 'signup_failure':
          // No user created, will test signup validation
          break;
        case 'admin_access':
          await this.createTestUser('admin');
          break;
        case 'user_access':
          await this.createTestUser('user');
          break;
        case 'guest_access':
          await this.createTestUser('guest');
          break;
        case 'role_based_access':
          await this.createTestUser('admin');
          await this.createTestUser('user');
          await this.createTestUser('guest');
          break;
        case 'session_management': {
          const user = await this.createTestUser('user');
          await this.createTestSession(user.id);
          break;
        }
        case 'password_reset':
          await this.createTestUser('user');
          break;
        case 'email_verification':
          await this.createTestUser('user', { emailVerified: false });
          break;
        case 'account_lockout':
          await this.createTestUser('user');
          break;
        case 'rate_limiting':
          await this.createTestUser('user');
          break;
        case 'network_errors':
          await this.createTestUser('user');
          break;
        case 'server_errors':
          await this.createTestUser('user');
          break;
        case 'validation_errors':
          // No user created, will test validation
          break;
        case 'permission_errors':
          await this.createTestUser('user');
          break;
        case 'timeout_errors':
          await this.createTestUser('user');
          break;
        case 'database_errors':
          await this.createTestUser('user');
          break;
        case 'email_errors':
          await this.createTestUser('user');
          break;
        case 'session_errors':
          await this.createTestUser('user');
          break;
        case 'csrf_errors':
          await this.createTestUser('user');
          break;
        case 'captcha_errors':
          await this.createTestUser('user');
          break;
        case 'oauth_errors':
          await this.createTestUser('user');
          break;
        case 'jwt_errors':
          await this.createTestUser('user');
          break;
        case 'concurrent_errors':
          await this.createTestUser('user');
          break;
        default:
          throw new Error(`Unknown test scenario: ${scenario}`);
      }

      testLogger.info('Test scenario setup completed', { scenario });
    } catch (error) {
      testLogger.error('Failed to setup test scenario', {
        error: error.message,
        scenario,
      });
      throw error;
    }
  }

  /**
   * Gets test user by ID
   */
  public getTestUser(userId: string): TestUser | undefined {
    return this.testUsers.get(userId);
  }

  /**
   * Gets test user by email
   */
  public getTestUserByEmail(email: string): TestUser | undefined {
    return Array.from(this.testUsers.values()).find(
      (user) => user.credentials.email === email
    );
  }

  /**
   * Gets test session by ID
   */
  public getTestSession(sessionId: string): TestSession | undefined {
    return this.testSessions.get(sessionId);
  }

  /**
   * Gets all test users
   */
  public getAllTestUsers(): TestUser[] {
    return Array.from(this.testUsers.values());
  }

  /**
   * Gets all test sessions
   */
  public getAllTestSessions(): TestSession[] {
    return Array.from(this.testSessions.values());
  }

  /**
   * Clears browser storage
   */
  private async clearBrowserStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
  }

  /**
   * Sets environment variables
   */
  private async setEnvironmentVariables(): Promise<void> {
    await this.page.addInitScript((env) => {
      window.testEnvironment = env;
    }, this.environment);
  }

  /**
   * Sets up test database
   */
  private async setupTestDatabase(): Promise<void> {
    // Mock database setup
    testLogger.info('Setting up test database', {
      host: this.environment.database.host,
      port: this.environment.database.port,
      name: this.environment.database.name,
    });
  }

  /**
   * Sets up test Redis
   */
  private async setupTestRedis(): Promise<void> {
    // Mock Redis setup
    testLogger.info('Setting up test Redis', {
      host: this.environment.redis.host,
      port: this.environment.redis.port,
    });
  }

  /**
   * Sets up test email service
   */
  private async setupTestEmailService(): Promise<void> {
    // Mock email service setup
    testLogger.info('Setting up test email service', {
      provider: this.environment.email.provider,
      fromEmail: this.environment.email.fromEmail,
    });
  }

  /**
   * Sets up test JWT configuration
   */
  private async setupTestJWT(): Promise<void> {
    // Mock JWT setup
    testLogger.info('Setting up test JWT configuration', {
      expiresIn: this.environment.jwt.expiresIn,
      refreshExpiresIn: this.environment.jwt.refreshExpiresIn,
    });
  }

  /**
   * Sets up test features
   */
  private async setupTestFeatures(): Promise<void> {
    // Mock features setup
    testLogger.info('Setting up test features', {
      features: this.environment.features,
    });
  }

  /**
   * Sets up test limits
   */
  private async setupTestLimits(): Promise<void> {
    // Mock limits setup
    testLogger.info('Setting up test limits', {
      limits: this.environment.limits,
    });
  }

  /**
   * Stores test user in database
   */
  private async storeTestUser(user: TestUser): Promise<void> {
    // Mock database storage
    testLogger.info('Storing test user in database', {
      userId: user.id,
      email: user.credentials.email,
    });
  }

  /**
   * Stores test session in database
   */
  private async storeTestSession(session: TestSession): Promise<void> {
    // Mock database storage
    testLogger.info('Storing test session in database', {
      sessionId: session.id,
      userId: session.userId,
    });
  }

  /**
   * Sets session in browser
   */
  private async setSessionInBrowser(session: TestSession): Promise<void> {
    await this.page.evaluate((sessionData) => {
      localStorage.setItem('authToken', sessionData.token);
      localStorage.setItem('refreshToken', sessionData.refreshToken);
      localStorage.setItem('sessionId', sessionData.id);
      localStorage.setItem('userId', sessionData.userId);
    }, session);
  }

  /**
   * Removes session from browser
   */
  private async removeSessionFromBrowser(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userId');
    });
  }

  /**
   * Generates JWT token
   */
  private generateJWTToken(userData: UserData): string {
    // Mock JWT token generation
    return `jwt.${userData.id}.${Date.now()}`;
  }

  /**
   * Generates refresh token
   */
  private generateRefreshToken(): string {
    // Mock refresh token generation
    return `refresh.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clears test users
   */
  private async clearTestUsers(): Promise<void> {
    this.testUsers.clear();
    testLogger.info('Test users cleared');
  }

  /**
   * Clears test sessions
   */
  private async clearTestSessions(): Promise<void> {
    this.testSessions.clear();
    testLogger.info('Test sessions cleared');
  }

  /**
   * Clears test database
   */
  private async clearTestDatabase(): Promise<void> {
    // Mock database cleanup
    testLogger.info('Test database cleared');
  }

  /**
   * Clears test Redis
   */
  private async clearTestRedis(): Promise<void> {
    // Mock Redis cleanup
    testLogger.info('Test Redis cleared');
  }
}
