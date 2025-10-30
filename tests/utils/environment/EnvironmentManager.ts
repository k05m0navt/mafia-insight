import {
  TestEnvironment,
  TestEnvironmentManager,
} from '../models/TestEnvironment';
import { getTestEnvironment as _getTestEnvironment } from '../../config/environment';

export class EnvironmentManager {
  private manager: TestEnvironmentManager;
  private currentEnvironment: TestEnvironment | null = null;

  constructor() {
    this.manager = new TestEnvironmentManager();
    this.initializeDefaultEnvironments();
  }

  private initializeDefaultEnvironments(): void {
    // Create local environment
    const _localEnv = this.manager.createEnvironment({
      name: 'Local Development',
      type: 'local',
      description: 'Local development environment for testing',
      baseUrl: 'http://localhost:3000',
      database: {
        host: 'localhost',
        port: 5432,
        name: 'mafia_insight_test',
        user: 'postgres',
        password: 'password',
        ssl: false,
        maxConnections: 10,
        connectionTimeout: 30000,
      },
      externalServices: [
        {
          name: 'GoMafia API',
          baseUrl: 'https://gomafia.pro',
          timeout: 30000,
          retries: 3,
          rateLimit: {
            requests: 100,
            window: 60000, // 1 minute
          },
        },
      ],
      browserConfig: {
        headless: false,
        slowMo: 0,
        timeout: 30000,
        viewport: {
          width: 1280,
          height: 720,
        },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        locale: 'en-US',
        timezone: 'UTC',
      },
      deviceConfig: {
        name: 'Desktop Chrome',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
      networkConfig: {
        offline: false,
        latency: 0,
        downloadThroughput: 1000000, // 1 Mbps
        uploadThroughput: 1000000, // 1 Mbps
        connectionType: 'wifi',
      },
      securityConfig: {
        enableCSP: true,
        enableCORS: true,
        allowedOrigins: ['http://localhost:3000'],
        enableCSRF: true,
        sessionTimeout: 3600000, // 1 hour
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      },
      performanceConfig: {
        maxResponseTime: 2000,
        maxMemoryUsage: 100, // MB
        maxCpuUsage: 80, // percentage
        enableProfiling: true,
        enableTracing: true,
        sampleRate: 0.1,
      },
      isActive: true,
    });

    // Create staging environment
    const _stagingEnv = this.manager.createEnvironment({
      name: 'Staging Environment',
      type: 'staging',
      description: 'Staging environment for pre-production testing',
      baseUrl: 'https://staging.mafia-insight.com',
      database: {
        host: 'staging-db.mafia-insight.com',
        port: 5432,
        name: 'mafia_insight_staging',
        user: 'staging_user',
        password: process.env.STAGING_DB_PASSWORD || '',
        ssl: true,
        maxConnections: 20,
        connectionTimeout: 60000,
      },
      externalServices: [
        {
          name: 'GoMafia API',
          baseUrl: 'https://gomafia.pro',
          apiKey: process.env.GOMAFIA_API_KEY,
          timeout: 30000,
          retries: 3,
          rateLimit: {
            requests: 100,
            window: 60000,
          },
        },
      ],
      browserConfig: {
        headless: true,
        slowMo: 0,
        timeout: 60000,
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        locale: 'en-US',
        timezone: 'UTC',
      },
      deviceConfig: {
        name: 'Desktop Chrome',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        viewport: {
          width: 1920,
          height: 1080,
        },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
      networkConfig: {
        offline: false,
        latency: 50,
        downloadThroughput: 10000000, // 10 Mbps
        uploadThroughput: 10000000, // 10 Mbps
        connectionType: 'wifi',
      },
      securityConfig: {
        enableCSP: true,
        enableCORS: true,
        allowedOrigins: ['https://staging.mafia-insight.com'],
        enableCSRF: true,
        sessionTimeout: 1800000, // 30 minutes
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      },
      performanceConfig: {
        maxResponseTime: 3000,
        maxMemoryUsage: 200, // MB
        maxCpuUsage: 85, // percentage
        enableProfiling: true,
        enableTracing: true,
        sampleRate: 0.05,
      },
      isActive: false,
    });

    // Create production environment (read-only for testing)
    const _productionEnv = this.manager.createEnvironment({
      name: 'Production Environment',
      type: 'production',
      description: 'Production environment for monitoring and smoke tests',
      baseUrl: 'https://mafia-insight.com',
      database: {
        host: 'prod-db.mafia-insight.com',
        port: 5432,
        name: 'mafia_insight_prod',
        user: 'readonly_user',
        password: process.env.PROD_DB_PASSWORD || '',
        ssl: true,
        maxConnections: 5,
        connectionTimeout: 120000,
      },
      externalServices: [
        {
          name: 'GoMafia API',
          baseUrl: 'https://gomafia.pro',
          apiKey: process.env.GOMAFIA_API_KEY,
          timeout: 30000,
          retries: 2,
          rateLimit: {
            requests: 50,
            window: 60000,
          },
        },
      ],
      browserConfig: {
        headless: true,
        slowMo: 0,
        timeout: 120000,
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        locale: 'en-US',
        timezone: 'UTC',
      },
      deviceConfig: {
        name: 'Desktop Chrome',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        viewport: {
          width: 1920,
          height: 1080,
        },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
      networkConfig: {
        offline: false,
        latency: 100,
        downloadThroughput: 50000000, // 50 Mbps
        uploadThroughput: 50000000, // 50 Mbps
        connectionType: 'wifi',
      },
      securityConfig: {
        enableCSP: true,
        enableCORS: true,
        allowedOrigins: ['https://mafia-insight.com'],
        enableCSRF: true,
        sessionTimeout: 900000, // 15 minutes
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      },
      performanceConfig: {
        maxResponseTime: 5000,
        maxMemoryUsage: 500, // MB
        maxCpuUsage: 90, // percentage
        enableProfiling: false,
        enableTracing: false,
        sampleRate: 0.01,
      },
      isActive: false,
    });
  }

  getEnvironment(name: string): TestEnvironment | undefined {
    return this.manager.getEnvironmentByName(name);
  }

  getAllEnvironments(): TestEnvironment[] {
    return this.manager.getAllEnvironments();
  }

  getActiveEnvironments(): TestEnvironment[] {
    return this.manager.getActiveEnvironments();
  }

  setCurrentEnvironment(name: string): boolean {
    const environment = this.getEnvironment(name);
    if (!environment) {
      return false;
    }

    this.currentEnvironment = environment;
    return true;
  }

  getCurrentEnvironment(): TestEnvironment | null {
    return this.currentEnvironment;
  }

  activateEnvironment(name: string): boolean {
    const environment = this.getEnvironment(name);
    if (!environment) {
      return false;
    }

    return this.manager.activateEnvironment(environment.id);
  }

  deactivateEnvironment(name: string): boolean {
    const environment = this.getEnvironment(name);
    if (!environment) {
      return false;
    }

    return this.manager.deactivateEnvironment(environment.id);
  }

  createCustomEnvironment(
    envData: Omit<TestEnvironment, 'id' | 'createdAt' | 'updatedAt'>
  ): TestEnvironment {
    return this.manager.createEnvironment(envData);
  }

  updateEnvironment(
    name: string,
    updates: Partial<Omit<TestEnvironment, 'id' | 'createdAt'>>
  ): boolean {
    const environment = this.getEnvironment(name);
    if (!environment) {
      return false;
    }

    return this.manager.updateEnvironment(environment.id, updates) !== null;
  }

  deleteEnvironment(name: string): boolean {
    const environment = this.getEnvironment(name);
    if (!environment) {
      return false;
    }

    return this.manager.deleteEnvironment(environment.id);
  }

  addExternalService(envName: string, service: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.addExternalService(environment.id, service);
  }

  updateExternalService(
    envName: string,
    serviceName: string,
    updates: unknown
  ): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateExternalService(
      environment.id,
      serviceName,
      updates
    );
  }

  removeExternalService(envName: string, serviceName: string): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.removeExternalService(environment.id, serviceName);
  }

  updateDatabaseConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateDatabaseConfig(environment.id, config);
  }

  updateBrowserConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateBrowserConfig(environment.id, config);
  }

  updateDeviceConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateDeviceConfig(environment.id, config);
  }

  updateNetworkConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateNetworkConfig(environment.id, config);
  }

  updateSecurityConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updateSecurityConfig(environment.id, config);
  }

  updatePerformanceConfig(envName: string, config: unknown): boolean {
    const environment = this.getEnvironment(envName);
    if (!environment) {
      return false;
    }

    return this.manager.updatePerformanceConfig(environment.id, config);
  }

  getEnvironmentStats(): unknown {
    return this.manager.getEnvironmentStats();
  }

  // Helper methods for common operations
  isEnvironmentActive(name: string): boolean {
    const environment = this.getEnvironment(name);
    return environment ? environment.isActive : false;
  }

  getEnvironmentByType(type: TestEnvironment['type']): TestEnvironment[] {
    return this.manager.getEnvironmentsByType(type);
  }

  getEnvironmentBaseUrl(name: string): string | undefined {
    const environment = this.getEnvironment(name);
    return environment ? environment.baseUrl : undefined;
  }

  getEnvironmentDatabaseConfig(name: string): unknown {
    const environment = this.getEnvironment(name);
    return environment ? environment.database : undefined;
  }

  getEnvironmentBrowserConfig(name: string): unknown {
    const environment = this.getEnvironment(name);
    return environment ? environment.browserConfig : undefined;
  }

  getEnvironmentPerformanceConfig(name: string): unknown {
    const environment = this.getEnvironment(name);
    return environment ? environment.performanceConfig : undefined;
  }

  // Validation methods
  validateEnvironment(environment: TestEnvironment): string[] {
    const errors: string[] = [];

    if (!environment.name) {
      errors.push('Environment name is required');
    }

    if (!environment.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!environment.database.host) {
      errors.push('Database host is required');
    }

    if (!environment.database.port || environment.database.port <= 0) {
      errors.push('Valid database port is required');
    }

    if (!environment.database.name) {
      errors.push('Database name is required');
    }

    if (environment.performanceConfig.maxResponseTime <= 0) {
      errors.push('Max response time must be positive');
    }

    if (environment.performanceConfig.maxMemoryUsage <= 0) {
      errors.push('Max memory usage must be positive');
    }

    if (
      environment.performanceConfig.maxCpuUsage <= 0 ||
      environment.performanceConfig.maxCpuUsage > 100
    ) {
      errors.push('Max CPU usage must be between 1 and 100');
    }

    return errors;
  }

  validateEnvironmentName(name: string): boolean {
    const environment = this.getEnvironment(name);
    return environment !== undefined;
  }
}
