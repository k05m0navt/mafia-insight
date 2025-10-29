import {
  Page as _Page,
  BrowserContext as _BrowserContext,
} from '@playwright/test';
import { getTestEnvironment } from '../../config/environment';
import {
  initializeTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
  seedTestDatabase,
} from '../../config/database';

export interface TestSetupOptions {
  environment?: string;
  resetDatabase?: boolean;
  seedDatabase?: boolean;
  headless?: boolean;
  slowMo?: number;
}

export class TestSetup {
  private environment: string;
  private databaseInitialized: boolean = false;

  constructor(options: TestSetupOptions = {}) {
    this.environment = options.environment || 'local';
  }

  async setup(): Promise<void> {
    console.log(`Setting up test environment: ${this.environment}`);

    // Initialize database
    await this.initializeDatabase();

    console.log('Test setup completed successfully');
  }

  async teardown(): Promise<void> {
    console.log('Tearing down test environment');

    // Cleanup database
    await this.cleanupDatabase();

    console.log('Test teardown completed successfully');
  }

  async initializeDatabase(): Promise<void> {
    if (this.databaseInitialized) {
      return;
    }

    try {
      await initializeTestDatabase(this.environment);
      this.databaseInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.databaseInitialized) {
      return;
    }

    try {
      await cleanupTestDatabase();
      this.databaseInitialized = false;
      console.log('Database cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup database:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.databaseInitialized) {
      await this.initializeDatabase();
    }

    try {
      await resetTestDatabase();
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }

  async seedDatabase(): Promise<void> {
    if (!this.databaseInitialized) {
      await this.initializeDatabase();
    }

    try {
      await seedTestDatabase();
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
  }

  getEnvironment() {
    return getTestEnvironment(this.environment);
  }

  isDatabaseInitialized(): boolean {
    return this.databaseInitialized;
  }
}

export async function setupTest(
  options: TestSetupOptions = {}
): Promise<TestSetup> {
  const testSetup = new TestSetup(options);
  await testSetup.setup();
  return testSetup;
}

export async function teardownTest(testSetup: TestSetup): Promise<void> {
  await testSetup.teardown();
}
