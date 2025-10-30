// Test-specific Prisma client for SQLite testing
import { PrismaClient } from '@prisma/client';

// Create a test Prisma client that works with SQLite
export const createTestPrismaClient = () => {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./test.db';
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
  });
};

// Global test database instance
let testPrisma: PrismaClient;

// Initialize test database
export const initializeTestPrisma = async () => {
  if (!testPrisma) {
    testPrisma = createTestPrismaClient();
  }
  
  try {
    // Test database connection
    await testPrisma.$connect();
    console.log('✅ Test Prisma client connected successfully');
    return testPrisma;
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
};

// Clean up test database
export const cleanupTestPrisma = async () => {
  if (testPrisma) {
    try {
      // Clean up test data
      await testPrisma.syncStatus.deleteMany();
      await testPrisma.player.deleteMany();
      await testPrisma.game.deleteMany();
      await testPrisma.user.deleteMany();
      
      await testPrisma.$disconnect();
      console.log('✅ Test Prisma client cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      throw error;
    }
  }
};

// Get test Prisma instance
export const getTestPrisma = () => {
  if (!testPrisma) {
    throw new Error('Test Prisma client not initialized. Call initializeTestPrisma() first.');
  }
  return testPrisma;
};

export { testPrisma };
export default testPrisma;
