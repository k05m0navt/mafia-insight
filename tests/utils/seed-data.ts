import { PrismaClient } from '@prisma/client';
import testData from '../fixtures/test-data.json';

// Test data seeding utilities
export class TestDataSeeder {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Seed all test data
  async seedAll(): Promise<void> {
    try {
      await this.seedUsers();
      await this.seedGames();
      await this.seedPlayers();
      await this.seedSyncStatus();
      
      console.log('✅ All test data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  // Seed users
  async seedUsers(): Promise<void> {
    try {
      for (const user of testData.users) {
        await this.prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        });
      }
      console.log(`✅ Seeded ${testData.users.length} users`);
    } catch (error) {
      console.error('❌ Failed to seed users:', error);
      throw error;
    }
  }

  // Seed games
  async seedGames(): Promise<void> {
    try {
      for (const game of testData.games) {
        await this.prisma.game.upsert({
          where: { id: game.id },
          update: game,
          create: game,
        });
      }
      console.log(`✅ Seeded ${testData.games.length} games`);
    } catch (error) {
      console.error('❌ Failed to seed games:', error);
      throw error;
    }
  }

  // Seed players
  async seedPlayers(): Promise<void> {
    try {
      for (const player of testData.players) {
        await this.prisma.player.upsert({
          where: { id: player.id },
          update: player,
          create: player,
        });
      }
      console.log(`✅ Seeded ${testData.players.length} players`);
    } catch (error) {
      console.error('❌ Failed to seed players:', error);
      throw error;
    }
  }

  // Seed sync status
  async seedSyncStatus(): Promise<void> {
    try {
      for (const sync of testData.syncStatus) {
        await this.prisma.syncStatus.upsert({
          where: { id: sync.id },
          update: sync,
          create: sync,
        });
      }
      console.log(`✅ Seeded ${testData.syncStatus.length} sync status records`);
    } catch (error) {
      console.error('❌ Failed to seed sync status:', error);
      throw error;
    }
  }

  // Seed specific test scenario
  async seedScenario(scenario: 'auth' | 'games' | 'players' | 'sync'): Promise<void> {
    try {
      switch (scenario) {
        case 'auth':
          await this.seedUsers();
          break;
        case 'games':
          await this.seedUsers();
          await this.seedGames();
          break;
        case 'players':
          await this.seedUsers();
          await this.seedGames();
          await this.seedPlayers();
          break;
        case 'sync':
          await this.seedSyncStatus();
          break;
        default:
          throw new Error(`Unknown scenario: ${scenario}`);
      }
      console.log(`✅ Seeded scenario: ${scenario}`);
    } catch (error) {
      console.error(`❌ Failed to seed scenario '${scenario}':`, error);
      throw error;
    }
  }

  // Create test user with specific data
  async createTestUser(userData: {
    id?: string;
    email: string;
    name: string;
    role?: 'admin' | 'user' | 'moderator';
    isActive?: boolean;
  }) {
    try {
      const user = await this.prisma.user.create({
        data: {
          id: userData.id || `test-user-${Date.now()}`,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'user',
          isActive: userData.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created test user: ${user.email}`);
      return user;
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }
  }

  // Create test game with specific data
  async createTestGame(gameData: {
    id?: string;
    name: string;
    status?: 'active' | 'completed' | 'cancelled';
  }) {
    try {
      const game = await this.prisma.game.create({
        data: {
          id: gameData.id || `test-game-${Date.now()}`,
          name: gameData.name,
          status: gameData.status || 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created test game: ${game.name}`);
      return game;
    } catch (error) {
      console.error('❌ Failed to create test game:', error);
      throw error;
    }
  }

  // Create test player with specific data
  async createTestPlayer(playerData: {
    id?: string;
    name: string;
    gameId: string;
    userId?: string;
  }) {
    try {
      const player = await this.prisma.player.create({
        data: {
          id: playerData.id || `test-player-${Date.now()}`,
          name: playerData.name,
          gameId: playerData.gameId,
          userId: playerData.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created test player: ${player.name}`);
      return player;
    } catch (error) {
      console.error('❌ Failed to create test player:', error);
      throw error;
    }
  }

  // Create test sync status with specific data
  async createTestSyncStatus(syncData: {
    id?: string;
    status: 'completed' | 'failed' | 'in_progress';
    recordsProcessed?: number;
    errors?: string[];
  }) {
    try {
      const sync = await this.prisma.syncStatus.create({
        data: {
          id: syncData.id || `test-sync-${Date.now()}`,
          lastSyncAt: new Date(),
          status: syncData.status,
          recordsProcessed: syncData.recordsProcessed || 0,
          errors: syncData.errors || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created test sync status: ${sync.id}`);
      return sync;
    } catch (error) {
      console.error('❌ Failed to create test sync status:', error);
      throw error;
    }
  }

  // Get test data by type
  getTestData(type: 'users' | 'games' | 'players' | 'syncStatus') {
    return testData[type];
  }

  // Get auth credentials for testing
  getAuthCredentials(type: 'valid' | 'invalid' | 'admin' | 'moderator') {
    return testData.authCredentials[type];
  }

  // Get error scenarios for testing
  getErrorScenarios(type: 'databaseConnection' | 'authentication' | 'validation' | 'network') {
    return testData.errorScenarios[type];
  }

  // Get test configuration
  getTestConfig() {
    return testData.testConfig;
  }
}

// Utility functions for common seeding operations
export const seedUtils = {
  // Seed data for authentication tests
  seedForAuth: async (prisma: PrismaClient) => {
    const seeder = new TestDataSeeder(prisma);
    await seeder.seedScenario('auth');
  },

  // Seed data for game tests
  seedForGames: async (prisma: PrismaClient) => {
    const seeder = new TestDataSeeder(prisma);
    await seeder.seedScenario('games');
  },

  // Seed data for player tests
  seedForPlayers: async (prisma: PrismaClient) => {
    const seeder = new TestDataSeeder(prisma);
    await seeder.seedScenario('players');
  },

  // Seed data for sync tests
  seedForSync: async (prisma: PrismaClient) => {
    const seeder = new TestDataSeeder(prisma);
    await seeder.seedScenario('sync');
  },

  // Seed minimal data for quick tests
  seedMinimal: async (prisma: PrismaClient) => {
    const seeder = new TestDataSeeder(prisma);
    await seeder.createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });
  },
};

export default TestDataSeeder;
