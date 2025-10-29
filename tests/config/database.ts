import { PrismaClient } from '@prisma/client';
import { getTestEnvironment } from './environment';

export interface DatabaseConfig {
  prisma: PrismaClient;
  environment: string;
  isConnected: boolean;
}

let databaseConfig: DatabaseConfig | null = null;

export async function initializeTestDatabase(
  environment: string = 'local'
): Promise<DatabaseConfig> {
  if (databaseConfig && databaseConfig.environment === environment) {
    return databaseConfig;
  }

  const env = getTestEnvironment(environment);

  // Create Prisma client with test database configuration
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${env.database.user}:${env.database.password}@${env.database.host}:${env.database.port}/${env.database.name}?schema=public`,
      },
    },
    log:
      process.env.NODE_ENV === 'test'
        ? ['error']
        : ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test database connection
    await prisma.$connect();

    databaseConfig = {
      prisma,
      environment,
      isConnected: true,
    };

    return databaseConfig;
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  if (databaseConfig?.prisma) {
    await databaseConfig.prisma.$disconnect();
    databaseConfig = null;
  }
}

export async function resetTestDatabase(): Promise<void> {
  if (!databaseConfig?.prisma) {
    throw new Error('Database not initialized');
  }

  // Reset database by truncating all tables
  const tablenames = await databaseConfig.prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await databaseConfig.prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tables} CASCADE;`
    );
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
}

export async function seedTestDatabase(): Promise<void> {
  if (!databaseConfig?.prisma) {
    throw new Error('Database not initialized');
  }

  // Seed test data
  // This would be implemented based on your specific test data needs
  console.log('Seeding test database...');

  // Example: Create test users
  await databaseConfig.prisma.user.createMany({
    data: [
      {
        id: 'test-user-1',
        email: 'test1@example.com',
        name: 'Test User 1',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-user-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Test database seeded successfully');
}

export function getTestDatabase(): PrismaClient {
  if (!databaseConfig?.prisma) {
    throw new Error(
      'Database not initialized. Call initializeTestDatabase() first.'
    );
  }
  return databaseConfig.prisma;
}

export function isDatabaseConnected(): boolean {
  return databaseConfig?.isConnected ?? false;
}
