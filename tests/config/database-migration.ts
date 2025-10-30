import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

export class TestDatabaseMigration {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Run the test database schema migration
   */
  async migrate(): Promise<void> {
    try {
      console.log('Starting test database migration...');

      // Read the SQL schema file
      const schemaPath = join(__dirname, 'database-schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');

      // Split the schema into individual statements
      const statements = schema
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await this.prisma.$executeRawUnsafe(statement);
            console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
          } catch (error) {
            console.warn(`⚠ Warning executing statement: ${error}`);
            // Continue with other statements
          }
        }
      }

      console.log('✓ Test database migration completed successfully');
    } catch (error) {
      console.error('✗ Test database migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the test database schema
   */
  async rollback(): Promise<void> {
    try {
      console.log('Starting test database rollback...');

      // Drop tables in reverse order to handle foreign key constraints
      const dropStatements = [
        'DROP VIEW IF EXISTS test_execution_summary',
        'DROP VIEW IF EXISTS test_suite_summary',
        'DROP TABLE IF EXISTS test_results_summary',
        'DROP TABLE IF EXISTS test_execution_queue',
        'DROP TABLE IF EXISTS test_suite_dependencies',
        'DROP TABLE IF EXISTS test_case_tags',
        'DROP TABLE IF EXISTS test_tags',
        'DROP TABLE IF EXISTS test_configurations',
        'DROP TABLE IF EXISTS test_alerts',
        'DROP TABLE IF EXISTS test_logs',
        'DROP TABLE IF EXISTS test_recommendations',
        'DROP TABLE IF EXISTS test_artifacts',
        'DROP TABLE IF EXISTS test_metrics',
        'DROP TABLE IF EXISTS test_execution_data_usage',
        'DROP TABLE IF EXISTS test_case_data_usage',
        'DROP TABLE IF EXISTS test_reports',
        'DROP TABLE IF EXISTS test_environments',
        'DROP TABLE IF EXISTS test_data',
        'DROP TABLE IF EXISTS test_executions',
        'DROP TABLE IF EXISTS test_cases',
        'DROP TABLE IF EXISTS test_suites',
      ];

      for (const statement of dropStatements) {
        try {
          await this.prisma.$executeRawUnsafe(statement);
          console.log(`✓ Dropped: ${statement}`);
        } catch (error) {
          console.warn(`⚠ Warning dropping table: ${error}`);
        }
      }

      console.log('✓ Test database rollback completed successfully');
    } catch (error) {
      console.error('✗ Test database rollback failed:', error);
      throw error;
    }
  }

  /**
   * Check if the test database schema exists
   */
  async checkSchema(): Promise<boolean> {
    try {
      const result = (await this.prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'test_suites'
      `) as Array<{ count: number }>;

      return result[0]?.count > 0;
    } catch (error) {
      console.warn('Could not check schema:', error);
      return false;
    }
  }

  /**
   * Get database schema version
   */
  async getSchemaVersion(): Promise<string> {
    try {
      const result = (await this.prisma.$queryRaw`
        SELECT version 
        FROM test_configurations 
        WHERE config_type = 'schema_version' 
        ORDER BY created_at DESC 
        LIMIT 1
      `) as Array<{ version: string }>;

      return result[0]?.version || 'unknown';
    } catch (_error) {
      return 'unknown';
    }
  }

  /**
   * Set database schema version
   */
  async setSchemaVersion(version: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO test_configurations (id, name, description, config_type, config_data, version, is_active)
        VALUES (
          CONCAT('schema-', NOW()),
          'Database Schema Version',
          'Current schema version for test database',
          'schema_version',
          JSON_OBJECT('version', ${version}),
          ${version},
          true
        )
      `;
    } catch (error) {
      console.warn('Could not set schema version:', error);
    }
  }

  /**
   * Reset the test database (drop and recreate)
   */
  async reset(): Promise<void> {
    try {
      console.log('Resetting test database...');
      await this.rollback();
      await this.migrate();
      await this.setSchemaVersion('1.0.0');
      console.log('✓ Test database reset completed successfully');
    } catch (error) {
      console.error('✗ Test database reset failed:', error);
      throw error;
    }
  }

  /**
   * Seed the test database with initial data
   */
  async seed(): Promise<void> {
    try {
      console.log('Seeding test database...');

      // Create default test environment
      await this.prisma.$executeRaw`
        INSERT INTO test_environments (
          id, name, type, description, base_url, 
          database_config, external_services, browser_config, 
          device_config, network_config, security_config, 
          performance_config, is_active
        ) VALUES (
          'env-local-001',
          'Local Test Environment',
          'local',
          'Local development test environment',
          'http://localhost:3000',
          JSON_OBJECT(
            'host', 'localhost',
            'port', 5432,
            'name', 'mafia_insight_test',
            'user', 'test',
            'password', 'test'
          ),
          JSON_ARRAY(),
          JSON_OBJECT(
            'headless', false,
            'slowMo', 0,
            'timeout', 30000,
            'viewport', JSON_OBJECT('width', 1280, 'height', 720)
          ),
          JSON_OBJECT(
            'name', 'Desktop Chrome',
            'userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'viewport', JSON_OBJECT('width', 1280, 'height', 720),
            'deviceScaleFactor', 1,
            'isMobile', false,
            'hasTouch', false
          ),
          JSON_OBJECT(
            'offline', false,
            'latency', 0,
            'downloadThroughput', 0,
            'uploadThroughput', 0,
            'connectionType', 'wifi'
          ),
          JSON_OBJECT(
            'enableCSP', true,
            'enableCORS', true,
            'allowedOrigins', JSON_ARRAY('http://localhost:3000'),
            'enableCSRF', true,
            'sessionTimeout', 3600,
            'passwordPolicy', JSON_OBJECT(
              'minLength', 8,
              'requireUppercase', true,
              'requireLowercase', true,
              'requireNumbers', true,
              'requireSpecialChars', true
            )
          ),
          JSON_OBJECT(
            'maxResponseTime', 2000,
            'maxMemoryUsage', 512,
            'maxCpuUsage', 80,
            'enableProfiling', true,
            'enableTracing', true,
            'sampleRate', 0.1
          ),
          true
        )
      `;

      // Create default test tags
      const defaultTags = [
        {
          id: 'tag-smoke',
          name: 'smoke',
          description: 'Smoke tests',
          color: '#22c55e',
        },
        {
          id: 'tag-regression',
          name: 'regression',
          description: 'Regression tests',
          color: '#ef4444',
        },
        {
          id: 'tag-performance',
          name: 'performance',
          description: 'Performance tests',
          color: '#f59e0b',
        },
        {
          id: 'tag-security',
          name: 'security',
          description: 'Security tests',
          color: '#8b5cf6',
        },
        {
          id: 'tag-api',
          name: 'api',
          description: 'API tests',
          color: '#06b6d4',
        },
        { id: 'tag-ui', name: 'ui', description: 'UI tests', color: '#84cc16' },
        {
          id: 'tag-integration',
          name: 'integration',
          description: 'Integration tests',
          color: '#f97316',
        },
        {
          id: 'tag-unit',
          name: 'unit',
          description: 'Unit tests',
          color: '#6366f1',
        },
      ];

      for (const tag of defaultTags) {
        await this.prisma.$executeRaw`
          INSERT INTO test_tags (id, name, description, color)
          VALUES (${tag.id}, ${tag.name}, ${tag.description}, ${tag.color})
        `;
      }

      console.log('✓ Test database seeded successfully');
    } catch (error) {
      console.error('✗ Test database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const migration = new TestDatabaseMigration();
  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      migration
        .migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'rollback':
      migration
        .rollback()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'reset':
      migration
        .reset()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'seed':
      migration
        .seed()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'check':
      migration
        .checkSchema()
        .then((exists) => {
          console.log(`Schema exists: ${exists}`);
          process.exit(exists ? 0 : 1);
        })
        .catch(() => process.exit(1));
      break;
    default:
      console.log(
        'Usage: node database-migration.ts [migrate|rollback|reset|seed|check]'
      );
      process.exit(1);
  }
}
