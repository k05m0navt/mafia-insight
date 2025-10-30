import { PrismaClient } from '@prisma/client';

// Test database configuration with environment-specific settings
const createTestPrismaClient = () => {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./test.db';
  
  // For SQLite testing, we need to use a different approach
  if (databaseUrl.startsWith('file:')) {
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
    });
  }
  
  // For PostgreSQL
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
let prisma: PrismaClient;

// Initialize test database
export const initializeTestDatabase = async () => {
  if (!prisma) {
    prisma = createTestPrismaClient();
  }
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Test database connected successfully');
    return prisma;
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
};

// Clean up test database
export const cleanupTestDatabase = async () => {
  if (prisma) {
    try {
      // Clean up test data
      await prisma.$executeRaw`DELETE FROM "SyncStatus" WHERE 1=1`;
      await prisma.$executeRaw`DELETE FROM "Game" WHERE 1=1`;
      await prisma.$executeRaw`DELETE FROM "Player" WHERE 1=1`;
      await prisma.$executeRaw`DELETE FROM "User" WHERE 1=1`;
      
      await prisma.$disconnect();
      console.log('✅ Test database cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      throw error;
    }
  }
};

// Get test database instance
export const getTestDatabase = () => {
  if (!prisma) {
    throw new Error('Test database not initialized. Call initializeTestDatabase() first.');
  }
  return prisma;
};

// Test database utilities
export const testDbUtils = {
  // Create test user
  createTestUser: async (userData: {
    id?: string;
    email: string;
    name: string;
    role?: 'admin' | 'user' | 'moderator';
  }) => {
    const db = getTestDatabase();
    return await db.user.create({
      data: {
        id: userData.id || `test-user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
        isActive: true,
      },
    });
  },

  // Create test game
  createTestGame: async (gameData: {
    id?: string;
    name: string;
    status?: 'active' | 'completed' | 'cancelled';
  }) => {
    const db = getTestDatabase();
    return await db.game.create({
      data: {
        id: gameData.id || `test-game-${Date.now()}`,
        name: gameData.name,
        status: gameData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },

  // Create test player
  createTestPlayer: async (playerData: {
    id?: string;
    name: string;
    gameId: string;
    userId?: string;
  }) => {
    const db = getTestDatabase();
    return await db.player.create({
      data: {
        id: playerData.id || `test-player-${Date.now()}`,
        name: playerData.name,
        gameId: playerData.gameId,
        userId: playerData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },

  // Reset all test data
  resetTestData: async () => {
    const db = getTestDatabase();
    await db.$executeRaw`DELETE FROM "SyncStatus" WHERE 1=1`;
    await db.$executeRaw`DELETE FROM "Game" WHERE 1=1`;
    await db.$executeRaw`DELETE FROM "Player" WHERE 1=1`;
    await db.$executeRaw`DELETE FROM "User" WHERE 1=1`;
  },
};

export { prisma as testPrisma };
export default prisma;
