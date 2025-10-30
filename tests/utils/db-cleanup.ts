import { PrismaClient } from '@prisma/client';

// Database cleanup utilities for testing
export class DatabaseCleanup {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Clean up all test data
  async cleanupAll(): Promise<void> {
    try {
      // Delete in reverse order of dependencies
      await this.cleanupSyncStatus();
      await this.cleanupPlayers();
      await this.cleanupGames();
      await this.cleanupUsers();
      
      console.log('✅ Database cleanup completed successfully');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
      throw error;
    }
  }

  // Clean up users
  async cleanupUsers(): Promise<void> {
    try {
      await this.prisma.user.deleteMany({
        where: {
          email: {
            contains: 'test',
          },
        },
      });
      console.log('✅ Users cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup users:', error);
      throw error;
    }
  }

  // Clean up games
  async cleanupGames(): Promise<void> {
    try {
      await this.prisma.game.deleteMany({
        where: {
          name: {
            contains: 'test',
          },
        },
      });
      console.log('✅ Games cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup games:', error);
      throw error;
    }
  }

  // Clean up players
  async cleanupPlayers(): Promise<void> {
    try {
      await this.prisma.player.deleteMany({
        where: {
          name: {
            contains: 'test',
          },
        },
      });
      console.log('✅ Players cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup players:', error);
      throw error;
    }
  }

  // Clean up sync status
  async cleanupSyncStatus(): Promise<void> {
    try {
      await this.prisma.syncStatus.deleteMany({
        where: {
          id: {
            contains: 'test',
          },
        },
      });
      console.log('✅ Sync status cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup sync status:', error);
      throw error;
    }
  }

  // Clean up specific test data by prefix
  async cleanupByPrefix(prefix: string): Promise<void> {
    try {
      await this.prisma.syncStatus.deleteMany({
        where: {
          id: {
            startsWith: prefix,
          },
        },
      });

      await this.prisma.player.deleteMany({
        where: {
          id: {
            startsWith: prefix,
          },
        },
      });

      await this.prisma.game.deleteMany({
        where: {
          id: {
            startsWith: prefix,
          },
        },
      });

      await this.prisma.user.deleteMany({
        where: {
          id: {
            startsWith: prefix,
          },
        },
      });

      console.log(`✅ Data with prefix '${prefix}' cleaned up`);
    } catch (error) {
      console.error(`❌ Failed to cleanup data with prefix '${prefix}':`, error);
      throw error;
    }
  }

  // Reset database to initial state
  async resetDatabase(): Promise<void> {
    try {
      await this.cleanupAll();
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  // Get database statistics
  async getStats(): Promise<{
    users: number;
    games: number;
    players: number;
    syncStatus: number;
  }> {
    try {
      const [users, games, players, syncStatus] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.game.count(),
        this.prisma.player.count(),
        this.prisma.syncStatus.count(),
      ]);

      return {
        users,
        games,
        players,
        syncStatus,
      };
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      throw error;
    }
  }

  // Check if database is clean
  async isClean(): Promise<boolean> {
    try {
      const stats = await this.getStats();
      return stats.users === 0 && stats.games === 0 && stats.players === 0 && stats.syncStatus === 0;
    } catch (error) {
      console.error('❌ Failed to check if database is clean:', error);
      return false;
    }
  }
}

// Utility functions for common cleanup operations
export const cleanupUtils = {
  // Clean up after each test
  afterEach: async (prisma: PrismaClient) => {
    const cleanup = new DatabaseCleanup(prisma);
    await cleanup.cleanupAll();
  },

  // Clean up before each test
  beforeEach: async (prisma: PrismaClient) => {
    const cleanup = new DatabaseCleanup(prisma);
    await cleanup.cleanupAll();
  },

  // Clean up specific test data
  cleanupTestData: async (prisma: PrismaClient, testId: string) => {
    const cleanup = new DatabaseCleanup(prisma);
    await cleanup.cleanupByPrefix(testId);
  },

  // Reset database for integration tests
  resetForIntegration: async (prisma: PrismaClient) => {
    const cleanup = new DatabaseCleanup(prisma);
    await cleanup.resetDatabase();
  },
};

export default DatabaseCleanup;
