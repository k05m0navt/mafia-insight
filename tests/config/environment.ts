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
  externalServices: {
    gomafia: {
      baseUrl: string;
      apiKey?: string;
    };
  };
  browser: {
    headless: boolean;
    slowMo: number;
    timeout: number;
  };
  performance: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
  };
}

export const testEnvironments: Record<string, TestEnvironment> = {
  local: {
    name: 'Local Development',
    baseUrl: 'http://localhost:3000',
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      name: process.env.DATABASE_NAME || 'mafia_insight_test',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    externalServices: {
      gomafia: {
        baseUrl: process.env.GOMAFIA_BASE_URL || 'https://gomafia.pro',
        apiKey: process.env.GOMAFIA_API_KEY,
      },
    },
    browser: {
      headless: process.env.HEADLESS !== 'false',
      slowMo: parseInt(process.env.SLOW_MO || '0'),
      timeout: parseInt(process.env.TIMEOUT || '30000'),
    },
    performance: {
      maxResponseTime: 2000,
      maxMemoryUsage: 100, // MB
      maxCpuUsage: 80, // percentage
    },
  },
  staging: {
    name: 'Staging Environment',
    baseUrl: process.env.STAGING_URL || 'https://staging.mafia-insight.com',
    database: {
      host: process.env.STAGING_DATABASE_HOST || 'staging-db.mafia-insight.com',
      port: parseInt(process.env.STAGING_DATABASE_PORT || '5432'),
      name: process.env.STAGING_DATABASE_NAME || 'mafia_insight_staging',
      user: process.env.STAGING_DATABASE_USER || 'staging_user',
      password: process.env.STAGING_DATABASE_PASSWORD || '',
    },
    redis: {
      host: process.env.STAGING_REDIS_HOST || 'staging-redis.mafia-insight.com',
      port: parseInt(process.env.STAGING_REDIS_PORT || '6379'),
      password: process.env.STAGING_REDIS_PASSWORD,
    },
    externalServices: {
      gomafia: {
        baseUrl: process.env.GOMAFIA_BASE_URL || 'https://gomafia.pro',
        apiKey: process.env.GOMAFIA_API_KEY,
      },
    },
    browser: {
      headless: true,
      slowMo: 0,
      timeout: 60000,
    },
    performance: {
      maxResponseTime: 3000,
      maxMemoryUsage: 200, // MB
      maxCpuUsage: 85, // percentage
    },
  },
  production: {
    name: 'Production Environment',
    baseUrl: process.env.PRODUCTION_URL || 'https://mafia-insight.com',
    database: {
      host: process.env.PRODUCTION_DATABASE_HOST || 'prod-db.mafia-insight.com',
      port: parseInt(process.env.PRODUCTION_DATABASE_PORT || '5432'),
      name: process.env.PRODUCTION_DATABASE_NAME || 'mafia_insight_prod',
      user: process.env.PRODUCTION_DATABASE_USER || 'prod_user',
      password: process.env.PRODUCTION_DATABASE_PASSWORD || '',
    },
    redis: {
      host: process.env.PRODUCTION_REDIS_HOST || 'prod-redis.mafia-insight.com',
      port: parseInt(process.env.PRODUCTION_REDIS_PORT || '6379'),
      password: process.env.PRODUCTION_REDIS_PASSWORD,
    },
    externalServices: {
      gomafia: {
        baseUrl: process.env.GOMAFIA_BASE_URL || 'https://gomafia.pro',
        apiKey: process.env.GOMAFIA_API_KEY,
      },
    },
    browser: {
      headless: true,
      slowMo: 0,
      timeout: 120000,
    },
    performance: {
      maxResponseTime: 5000,
      maxMemoryUsage: 500, // MB
      maxCpuUsage: 90, // percentage
    },
  },
};

export function getTestEnvironment(env: string = 'local'): TestEnvironment {
  const environment = testEnvironments[env];
  if (!environment) {
    throw new Error(`Unknown test environment: ${env}`);
  }
  return environment;
}

export function getAllTestEnvironments(): TestEnvironment[] {
  return Object.values(testEnvironments);
}
