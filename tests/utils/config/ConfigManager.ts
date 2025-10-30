export interface TestConfig {
  environment: string;
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  retries: number;
  captureScreenshots: boolean;
  captureVideos: boolean;
  captureLogs: boolean;
  headless: boolean;
  slowMo: number;
  viewport: {
    width: number;
    height: number;
  };
  baseUrl: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  performance: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
  };
  coverage: {
    threshold: number;
    include: string[];
    exclude: string[];
  };
  reporting: {
    format: string[];
    outputDir: string;
    includeMetrics: boolean;
    includeScreenshots: boolean;
    includeVideos: boolean;
  };
}

export interface ConfigProfile {
  name: string;
  description: string;
  config: TestConfig;
  isDefault: boolean;
}

export class ConfigManager {
  private profiles: Map<string, ConfigProfile> = new Map();
  private currentProfile: string | null = null;

  constructor() {
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    // Local development profile
    this.addProfile({
      name: 'local',
      description: 'Local development testing configuration',
      isDefault: true,
      config: {
        environment: 'local',
        parallel: false,
        maxConcurrency: 1,
        timeout: 30000,
        retries: 0,
        captureScreenshots: true,
        captureVideos: false,
        captureLogs: true,
        headless: false,
        slowMo: 0,
        viewport: {
          width: 1280,
          height: 720,
        },
        baseUrl: 'http://localhost:3000',
        database: {
          host: 'localhost',
          port: 5432,
          name: 'mafia_insight_test',
          user: 'postgres',
          password: 'password',
        },
        performance: {
          maxResponseTime: 2000,
          maxMemoryUsage: 100,
          maxCpuUsage: 80,
        },
        coverage: {
          threshold: 80,
          include: ['src/**/*.{js,ts,jsx,tsx}'],
          exclude: [
            'src/**/*.test.{js,ts,jsx,tsx}',
            'src/**/*.spec.{js,ts,jsx,tsx}',
          ],
        },
        reporting: {
          format: ['json', 'html'],
          outputDir: 'test-results',
          includeMetrics: true,
          includeScreenshots: true,
          includeVideos: false,
        },
      },
    });

    // CI/CD profile
    this.addProfile({
      name: 'ci',
      description: 'CI/CD pipeline testing configuration',
      isDefault: false,
      config: {
        environment: 'staging',
        parallel: true,
        maxConcurrency: 4,
        timeout: 60000,
        retries: 2,
        captureScreenshots: true,
        captureVideos: true,
        captureLogs: true,
        headless: true,
        slowMo: 0,
        viewport: {
          width: 1920,
          height: 1080,
        },
        baseUrl: 'https://staging.mafia-insight.com',
        database: {
          host: 'staging-db.mafia-insight.com',
          port: 5432,
          name: 'mafia_insight_staging',
          user: 'staging_user',
          password: process.env.STAGING_DB_PASSWORD || '',
        },
        performance: {
          maxResponseTime: 3000,
          maxMemoryUsage: 200,
          maxCpuUsage: 85,
        },
        coverage: {
          threshold: 85,
          include: ['src/**/*.{js,ts,jsx,tsx}'],
          exclude: [
            'src/**/*.test.{js,ts,jsx,tsx}',
            'src/**/*.spec.{js,ts,jsx,tsx}',
          ],
        },
        reporting: {
          format: ['json', 'html', 'junit'],
          outputDir: 'test-results',
          includeMetrics: true,
          includeScreenshots: true,
          includeVideos: true,
        },
      },
    });

    // Performance testing profile
    this.addProfile({
      name: 'performance',
      description: 'Performance testing configuration',
      isDefault: false,
      config: {
        environment: 'staging',
        parallel: true,
        maxConcurrency: 10,
        timeout: 120000,
        retries: 1,
        captureScreenshots: false,
        captureVideos: false,
        captureLogs: true,
        headless: true,
        slowMo: 0,
        viewport: {
          width: 1920,
          height: 1080,
        },
        baseUrl: 'https://staging.mafia-insight.com',
        database: {
          host: 'staging-db.mafia-insight.com',
          port: 5432,
          name: 'mafia_insight_staging',
          user: 'staging_user',
          password: process.env.STAGING_DB_PASSWORD || '',
        },
        performance: {
          maxResponseTime: 5000,
          maxMemoryUsage: 500,
          maxCpuUsage: 90,
        },
        coverage: {
          threshold: 70,
          include: ['src/**/*.{js,ts,jsx,tsx}'],
          exclude: [
            'src/**/*.test.{js,ts,jsx,tsx}',
            'src/**/*.spec.{js,ts,jsx,tsx}',
          ],
        },
        reporting: {
          format: ['json', 'html'],
          outputDir: 'test-results/performance',
          includeMetrics: true,
          includeScreenshots: false,
          includeVideos: false,
        },
      },
    });

    // Security testing profile
    this.addProfile({
      name: 'security',
      description: 'Security testing configuration',
      isDefault: false,
      config: {
        environment: 'staging',
        parallel: false,
        maxConcurrency: 1,
        timeout: 180000,
        retries: 0,
        captureScreenshots: true,
        captureVideos: true,
        captureLogs: true,
        headless: true,
        slowMo: 0,
        viewport: {
          width: 1920,
          height: 1080,
        },
        baseUrl: 'https://staging.mafia-insight.com',
        database: {
          host: 'staging-db.mafia-insight.com',
          port: 5432,
          name: 'mafia_insight_staging',
          user: 'staging_user',
          password: process.env.STAGING_DB_PASSWORD || '',
        },
        performance: {
          maxResponseTime: 10000,
          maxMemoryUsage: 1000,
          maxCpuUsage: 95,
        },
        coverage: {
          threshold: 60,
          include: ['src/**/*.{js,ts,jsx,tsx}'],
          exclude: [
            'src/**/*.test.{js,ts,jsx,tsx}',
            'src/**/*.spec.{js,ts,jsx,tsx}',
          ],
        },
        reporting: {
          format: ['json', 'html'],
          outputDir: 'test-results/security',
          includeMetrics: true,
          includeScreenshots: true,
          includeVideos: true,
        },
      },
    });
  }

  addProfile(profile: ConfigProfile): void {
    this.profiles.set(profile.name, profile);

    if (profile.isDefault) {
      this.currentProfile = profile.name;
    }
  }

  getProfile(name: string): ConfigProfile | undefined {
    return this.profiles.get(name);
  }

  getAllProfiles(): ConfigProfile[] {
    return Array.from(this.profiles.values());
  }

  getDefaultProfile(): ConfigProfile | undefined {
    return this.getAllProfiles().find((profile) => profile.isDefault);
  }

  setCurrentProfile(name: string): boolean {
    if (!this.profiles.has(name)) {
      return false;
    }

    this.currentProfile = name;
    return true;
  }

  getCurrentProfile(): ConfigProfile | undefined {
    if (!this.currentProfile) {
      return this.getDefaultProfile();
    }

    return this.profiles.get(this.currentProfile);
  }

  getCurrentConfig(): TestConfig | undefined {
    const profile = this.getCurrentProfile();
    return profile ? profile.config : undefined;
  }

  updateProfile(name: string, updates: Partial<ConfigProfile>): boolean {
    const profile = this.profiles.get(name);
    if (!profile) {
      return false;
    }

    const updatedProfile: ConfigProfile = {
      ...profile,
      ...updates,
    };

    this.profiles.set(name, updatedProfile);
    return true;
  }

  updateConfig(name: string, configUpdates: Partial<TestConfig>): boolean {
    const profile = this.profiles.get(name);
    if (!profile) {
      return false;
    }

    const updatedConfig: TestConfig = {
      ...profile.config,
      ...configUpdates,
    };

    profile.config = updatedConfig;
    this.profiles.set(name, profile);
    return true;
  }

  deleteProfile(name: string): boolean {
    if (this.profiles.size <= 1) {
      return false; // Don't delete the last profile
    }

    const deleted = this.profiles.delete(name);

    if (this.currentProfile === name) {
      this.currentProfile = this.getAllProfiles()[0]?.name || null;
    }

    return deleted;
  }

  exportProfile(name: string): string | undefined {
    const profile = this.profiles.get(name);
    return profile ? JSON.stringify(profile, null, 2) : undefined;
  }

  importProfile(profileJson: string): boolean {
    try {
      const profile: ConfigProfile = JSON.parse(profileJson);

      if (!profile.name || !profile.config) {
        return false;
      }

      this.addProfile(profile);
      return true;
    } catch {
      return false;
    }
  }

  exportAllProfiles(): string {
    const profiles = Array.from(this.profiles.values());
    return JSON.stringify(profiles, null, 2);
  }

  importAllProfiles(profilesJson: string): boolean {
    try {
      const profiles: ConfigProfile[] = JSON.parse(profilesJson);

      if (!Array.isArray(profiles)) {
        return false;
      }

      for (const profile of profiles) {
        if (!profile.name || !profile.config) {
          return false;
        }
        this.addProfile(profile);
      }

      return true;
    } catch {
      return false;
    }
  }

  validateConfig(config: TestConfig): string[] {
    const errors: string[] = [];

    if (!config.environment) {
      errors.push('Environment is required');
    }

    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (config.maxConcurrency <= 0) {
      errors.push('Max concurrency must be positive');
    }

    if (config.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    if (config.retries < 0) {
      errors.push('Retries must be non-negative');
    }

    if (config.viewport.width <= 0 || config.viewport.height <= 0) {
      errors.push('Viewport dimensions must be positive');
    }

    if (!config.database.host) {
      errors.push('Database host is required');
    }

    if (!config.database.port || config.database.port <= 0) {
      errors.push('Valid database port is required');
    }

    if (!config.database.name) {
      errors.push('Database name is required');
    }

    if (config.performance.maxResponseTime <= 0) {
      errors.push('Max response time must be positive');
    }

    if (config.performance.maxMemoryUsage <= 0) {
      errors.push('Max memory usage must be positive');
    }

    if (
      config.performance.maxCpuUsage <= 0 ||
      config.performance.maxCpuUsage > 100
    ) {
      errors.push('Max CPU usage must be between 1 and 100');
    }

    if (config.coverage.threshold < 0 || config.coverage.threshold > 100) {
      errors.push('Coverage threshold must be between 0 and 100');
    }

    if (!config.reporting.outputDir) {
      errors.push('Reporting output directory is required');
    }

    if (!config.reporting.format || config.reporting.format.length === 0) {
      errors.push('At least one reporting format is required');
    }

    return errors;
  }

  getConfigStats(): {
    totalProfiles: number;
    defaultProfile: string | null;
    currentProfile: string | null;
    environments: string[];
  } {
    const profiles = this.getAllProfiles();
    const environments = [
      ...new Set(profiles.map((p) => p.config.environment)),
    ];

    return {
      totalProfiles: profiles.length,
      defaultProfile: this.getDefaultProfile()?.name || null,
      currentProfile: this.currentProfile,
      environments,
    };
  }
}
