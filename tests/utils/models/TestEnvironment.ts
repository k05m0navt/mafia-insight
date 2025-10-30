export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface ExternalServiceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  timeout: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  locale?: string;
  timezone?: string;
}

export interface DeviceConfig {
  name: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface NetworkConfig {
  offline: boolean;
  latency?: number;
  downloadThroughput?: number;
  uploadThroughput?: number;
  connectionType?: 'slow3g' | 'fast3g' | '4g' | 'wifi';
}

export interface SecurityConfig {
  enableCSP: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  enableCSRF: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface PerformanceConfig {
  maxResponseTime: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  enableProfiling: boolean;
  enableTracing: boolean;
  sampleRate: number;
}

export interface TestEnvironment {
  id: string;
  name: string;
  type: 'local' | 'staging' | 'production' | 'custom';
  description: string;
  baseUrl: string;
  database: DatabaseConfig;
  externalServices: ExternalServiceConfig[];
  browserConfig: BrowserConfig;
  deviceConfig: DeviceConfig;
  networkConfig: NetworkConfig;
  securityConfig: SecurityConfig;
  performanceConfig: PerformanceConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TestEnvironmentManager {
  private environments: Map<string, TestEnvironment> = new Map();

  createEnvironment(
    envData: Omit<TestEnvironment, 'id' | 'createdAt' | 'updatedAt'>
  ): TestEnvironment {
    const environment: TestEnvironment = {
      ...envData,
      id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.environments.set(environment.id, environment);
    return environment;
  }

  getEnvironment(id: string): TestEnvironment | undefined {
    return this.environments.get(id);
  }

  getEnvironmentByName(name: string): TestEnvironment | undefined {
    return this.getAllEnvironments().find((env) => env.name === name);
  }

  getAllEnvironments(): TestEnvironment[] {
    return Array.from(this.environments.values());
  }

  getActiveEnvironments(): TestEnvironment[] {
    return this.getAllEnvironments().filter((env) => env.isActive);
  }

  getEnvironmentsByType(type: TestEnvironment['type']): TestEnvironment[] {
    return this.getAllEnvironments().filter((env) => env.type === type);
  }

  updateEnvironment(
    id: string,
    updates: Partial<Omit<TestEnvironment, 'id' | 'createdAt'>>
  ): TestEnvironment | null {
    const environment = this.environments.get(id);
    if (!environment) {
      return null;
    }

    const updatedEnvironment: TestEnvironment = {
      ...environment,
      ...updates,
      updatedAt: new Date(),
    };

    this.environments.set(id, updatedEnvironment);
    return updatedEnvironment;
  }

  deleteEnvironment(id: string): boolean {
    return this.environments.delete(id);
  }

  activateEnvironment(id: string): boolean {
    const environment = this.environments.get(id);
    if (!environment) {
      return false;
    }

    environment.isActive = true;
    environment.updatedAt = new Date();
    this.environments.set(id, environment);
    return true;
  }

  deactivateEnvironment(id: string): boolean {
    const environment = this.environments.get(id);
    if (!environment) {
      return false;
    }

    environment.isActive = false;
    environment.updatedAt = new Date();
    this.environments.set(id, environment);
    return true;
  }

  addExternalService(envId: string, service: ExternalServiceConfig): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    const existingService = environment.externalServices.find(
      (s) => s.name === service.name
    );
    if (existingService) {
      return false; // Service already exists
    }

    environment.externalServices.push(service);
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updateExternalService(
    envId: string,
    serviceName: string,
    updates: Partial<ExternalServiceConfig>
  ): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    const serviceIndex = environment.externalServices.findIndex(
      (s) => s.name === serviceName
    );
    if (serviceIndex === -1) {
      return false;
    }

    environment.externalServices[serviceIndex] = {
      ...environment.externalServices[serviceIndex],
      ...updates,
    };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  removeExternalService(envId: string, serviceName: string): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    const initialLength = environment.externalServices.length;
    environment.externalServices = environment.externalServices.filter(
      (s) => s.name !== serviceName
    );

    if (environment.externalServices.length < initialLength) {
      environment.updatedAt = new Date();
      this.environments.set(envId, environment);
      return true;
    }

    return false;
  }

  updateDatabaseConfig(
    envId: string,
    config: Partial<DatabaseConfig>
  ): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.database = { ...environment.database, ...config };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updateBrowserConfig(envId: string, config: Partial<BrowserConfig>): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.browserConfig = { ...environment.browserConfig, ...config };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updateDeviceConfig(envId: string, config: Partial<DeviceConfig>): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.deviceConfig = { ...environment.deviceConfig, ...config };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updateNetworkConfig(envId: string, config: Partial<NetworkConfig>): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.networkConfig = { ...environment.networkConfig, ...config };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updateSecurityConfig(
    envId: string,
    config: Partial<SecurityConfig>
  ): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.securityConfig = { ...environment.securityConfig, ...config };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  updatePerformanceConfig(
    envId: string,
    config: Partial<PerformanceConfig>
  ): boolean {
    const environment = this.environments.get(envId);
    if (!environment) {
      return false;
    }

    environment.performanceConfig = {
      ...environment.performanceConfig,
      ...config,
    };
    environment.updatedAt = new Date();
    this.environments.set(envId, environment);
    return true;
  }

  getEnvironmentStats(): {
    total: number;
    active: number;
    byType: Record<string, number>;
    averageServices: number;
  } {
    const environments = this.getAllEnvironments();
    const total = environments.length;
    const active = environments.filter((env) => env.isActive).length;

    const byType = environments.reduce(
      (acc, env) => {
        acc[env.type] = (acc[env.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageServices =
      total > 0
        ? environments.reduce(
            (sum, env) => sum + env.externalServices.length,
            0
          ) / total
        : 0;

    return {
      total,
      active,
      byType,
      averageServices,
    };
  }
}
