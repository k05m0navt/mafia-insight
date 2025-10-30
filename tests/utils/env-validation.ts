// Test environment validation utilities
export class TestEnvironmentValidator {
  // Validate required environment variables
  static validateRequiredEnvVars(): { isValid: boolean; missing: string[] } {
    const requiredVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const missing: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  // Validate test environment configuration
  static validateTestEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check NODE_ENV
    if (process.env.NODE_ENV !== 'test') {
      errors.push('NODE_ENV should be set to "test" for testing');
    }

    // Check database URL format
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
      errors.push('DATABASE_URL should use file: protocol for testing');
    }

    // Check test timeout
    const testTimeout = parseInt(process.env.TEST_TIMEOUT || '0');
    if (testTimeout < 10000) {
      errors.push('TEST_TIMEOUT should be at least 10000ms for reliable testing');
    }

    // Check Supabase URLs are test URLs
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL should be a test URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate database connection
  static async validateDatabaseConnection(prisma: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      await prisma.$connect();
      await prisma.$disconnect();
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  // Validate test configuration
  static validateTestConfig(): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check coverage thresholds
    const coverageThreshold = parseInt(process.env.COVERAGE_THRESHOLD || '0');
    if (coverageThreshold < 80) {
      warnings.push('Coverage threshold should be at least 80%');
    }

    // Check rate limiting for tests
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '0');
    if (rateLimitMax < 1000) {
      warnings.push('Rate limit should be relaxed for testing (at least 1000)');
    }

    // Check sync batch size for tests
    const syncBatchSize = parseInt(process.env.SYNC_BATCH_SIZE || '0');
    if (syncBatchSize > 50) {
      warnings.push('Sync batch size should be small for testing (50 or less)');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  // Get environment summary
  static getEnvironmentSummary(): {
    nodeEnv: string;
    databaseUrl: string;
    supabaseUrl: string;
    testTimeout: number;
    coverageThreshold: number;
    rateLimitMax: number;
    syncBatchSize: number;
  } {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL || 'not set',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      testTimeout: parseInt(process.env.TEST_TIMEOUT || '0'),
      coverageThreshold: parseInt(process.env.COVERAGE_THRESHOLD || '0'),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '0'),
      syncBatchSize: parseInt(process.env.SYNC_BATCH_SIZE || '0'),
    };
  }

  // Validate all test environment aspects
  static async validateAll(prisma?: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary: any;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required environment variables
    const envValidation = this.validateRequiredEnvVars();
    if (!envValidation.isValid) {
      errors.push(`Missing required environment variables: ${envValidation.missing.join(', ')}`);
    }

    // Validate test environment configuration
    const testEnvValidation = this.validateTestEnvironment();
    errors.push(...testEnvValidation.errors);

    // Validate test configuration
    const testConfigValidation = this.validateTestConfig();
    warnings.push(...testConfigValidation.warnings);

    // Validate database connection if prisma is provided
    if (prisma) {
      const dbValidation = await this.validateDatabaseConnection(prisma);
      if (!dbValidation.isValid) {
        errors.push(`Database connection failed: ${dbValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: this.getEnvironmentSummary(),
    };
  }
}

// Utility functions for environment validation
export const envUtils = {
  // Quick environment check
  quickCheck: () => {
    const validation = TestEnvironmentValidator.validateRequiredEnvVars();
    if (!validation.isValid) {
      console.error('❌ Missing required environment variables:', validation.missing);
      return false;
    }
    console.log('✅ All required environment variables are set');
    return true;
  },

  // Full environment validation
  fullValidation: async (prisma?: any) => {
    const validation = await TestEnvironmentValidator.validateAll(prisma);
    
    if (validation.errors.length > 0) {
      console.error('❌ Environment validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Environment validation warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (validation.isValid) {
      console.log('✅ Environment validation passed');
    }
    
    return validation;
  },

  // Print environment summary
  printSummary: () => {
    const summary = TestEnvironmentValidator.getEnvironmentSummary();
    console.log('📊 Environment Summary:');
    console.log(`  NODE_ENV: ${summary.nodeEnv}`);
    console.log(`  DATABASE_URL: ${summary.databaseUrl.substring(0, 20)}...`);
    console.log(`  SUPABASE_URL: ${summary.supabaseUrl}`);
    console.log(`  TEST_TIMEOUT: ${summary.testTimeout}ms`);
    console.log(`  COVERAGE_THRESHOLD: ${summary.coverageThreshold}%`);
    console.log(`  RATE_LIMIT_MAX: ${summary.rateLimitMax}`);
    console.log(`  SYNC_BATCH_SIZE: ${summary.syncBatchSize}`);
  },
};

export default TestEnvironmentValidator;
