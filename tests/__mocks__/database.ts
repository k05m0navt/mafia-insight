import { vi } from 'vitest';

// Mock implementation of database operations for testing
export const database = {
  // Mock Prisma client
  prisma: {
    // Mock user operations
    user: {
      create: vi.fn().mockImplementation(async (data: any) => {
        return {
          id: 'mock-user-id',
          email: data.data.email,
          name: data.data.name,
          role: data.data.role || 'user',
          isActive: data.data.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findUnique: vi.fn().mockImplementation(async (query: any) => {
        if (query.where.email === 'test@example.com') {
          return {
            id: 'mock-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      }),

      findMany: vi.fn().mockImplementation(async () => {
        return [
          {
            id: 'mock-user-1',
            email: 'user1@example.com',
            name: 'User 1',
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-user-2',
            email: 'user2@example.com',
            name: 'User 2',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      update: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          email: query.data.email || 'test@example.com',
          name: query.data.name || 'Test User',
          role: query.data.role || 'user',
          isActive: query.data.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      delete: vi.fn().mockImplementation(async (_query: unknown) => {
        return {
          id: 'deleted-id',
          email: 'deleted@example.com',
          name: 'Deleted User',
          role: 'user',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },

    // Mock game operations
    game: {
      create: vi.fn().mockImplementation(async (data: any) => {
        return {
          id: 'mock-game-id',
          name: data.data.name,
          status: data.data.status || 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findUnique: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: 'Mock Game',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findMany: vi.fn().mockImplementation(async () => {
        return [
          {
            id: 'mock-game-1',
            name: 'Game 1',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-game-2',
            name: 'Game 2',
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      update: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: query.data.name || 'Updated Game',
          status: query.data.status || 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      delete: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: 'Deleted Game',
          status: 'cancelled',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },

    // Mock player operations
    player: {
      create: vi.fn().mockImplementation(async (data: any) => {
        return {
          id: 'mock-player-id',
          name: data.data.name,
          gameId: data.data.gameId,
          userId: data.data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findUnique: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: 'Mock Player',
          gameId: 'mock-game-id',
          userId: 'mock-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findMany: vi.fn().mockImplementation(async () => {
        return [
          {
            id: 'mock-player-1',
            name: 'Player 1',
            gameId: 'mock-game-1',
            userId: 'mock-user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-player-2',
            name: 'Player 2',
            gameId: 'mock-game-1',
            userId: 'mock-user-2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      update: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: query.data.name || 'Updated Player',
          gameId: query.data.gameId || 'mock-game-id',
          userId: query.data.userId || 'mock-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      delete: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          name: 'Deleted Player',
          gameId: 'mock-game-id',
          userId: 'mock-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },

    // Mock sync log operations
    syncLog: {
      create: vi.fn().mockImplementation(async (data: any) => {
        return {
          id: 'mock-sync-log-id',
          operation: data.data.operation || 'sync',
          status: data.data.status || 'pending',
          recordsProcessed: data.data.recordsProcessed || 0,
          errors: data.data.errors || [],
          startedAt: data.data.startedAt || new Date(),
          completedAt: data.data.completedAt || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findUnique: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          operation: 'sync',
          status: 'completed',
          recordsProcessed: 100,
          errors: [],
          startedAt: new Date(),
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findMany: vi.fn().mockImplementation(async () => {
        return [
          {
            id: 'mock-sync-log-1',
            operation: 'sync',
            status: 'completed',
            recordsProcessed: 50,
            errors: [],
            startedAt: new Date(),
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-sync-log-2',
            operation: 'sync',
            status: 'failed',
            recordsProcessed: 25,
            errors: ['Error 1', 'Error 2'],
            startedAt: new Date(),
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      update: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          operation: query.data.operation || 'sync',
          status: query.data.status || 'completed',
          recordsProcessed: query.data.recordsProcessed || 0,
          errors: query.data.errors || [],
          startedAt: query.data.startedAt || new Date(),
          completedAt: query.data.completedAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      delete: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          operation: 'sync',
          status: 'deleted',
          recordsProcessed: 0,
          errors: [],
          startedAt: new Date(),
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },

    // Mock sync status operations
    syncStatus: {
      create: vi.fn().mockImplementation(async (data: any) => {
        return {
          id: 'mock-sync-id',
          lastSyncAt: data.data.lastSyncAt || new Date(),
          status: data.data.status || 'completed',
          recordsProcessed: data.data.recordsProcessed || 0,
          errors: data.data.errors || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findUnique: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          lastSyncAt: new Date(),
          status: 'completed',
          recordsProcessed: 100,
          errors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

      findMany: vi.fn().mockImplementation(async () => {
        return [
          {
            id: 'mock-sync-1',
            lastSyncAt: new Date(),
            status: 'completed',
            recordsProcessed: 50,
            errors: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-sync-2',
            lastSyncAt: new Date(),
            status: 'failed',
            recordsProcessed: 25,
            errors: ['Error 1', 'Error 2'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      update: vi.fn().mockImplementation(async (query: any) => {
        return {
          id: query.where.id,
          lastSyncAt: query.data.lastSyncAt || new Date(),
          status: query.data.status || 'completed',
          recordsProcessed: query.data.recordsProcessed || 0,
          errors: query.data.errors || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },

    // Mock transaction operations
    $transaction: vi.fn().mockImplementation(async (operations: any[]) => {
      const results = [];
      for (const operation of operations) {
        if (typeof operation === 'function') {
          results.push(await operation(database.prisma));
        } else {
          results.push(operation);
        }
      }
      return results;
    }),

    // Mock raw query operations
    $executeRaw: vi.fn().mockImplementation(async (_query: unknown) => {
      return { count: 1 };
    }),

    $queryRaw: vi.fn().mockImplementation(async (_query: unknown) => {
      return [];
    }),

    // Mock connection operations
    $connect: vi.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),

    $disconnect: vi.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),
  },

  // Mock database utilities
  utils: {
    // Mock database health check
    checkHealth: vi.fn().mockImplementation(async () => {
      return {
        connected: true,
        latency: 10,
        timestamp: new Date(),
      };
    }),

    // Mock database cleanup
    cleanup: vi.fn().mockImplementation(async () => {
      return {
        success: true,
        message: 'Database cleaned up successfully',
      };
    }),

    // Mock database seeding
    seed: vi.fn().mockImplementation(async (data: any) => {
      return {
        success: true,
        recordsCreated: data.length || 0,
        message: 'Database seeded successfully',
      };
    }),

    // Mock database migration
    migrate: vi.fn().mockImplementation(async () => {
      return {
        success: true,
        message: 'Database migrated successfully',
      };
    }),
  },

  // Reset all mocks
  resetMocks: () => {
    Object.values(database.prisma).forEach((model) => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach((fn) => {
          if (typeof fn === 'function' && 'mockReset' in fn) {
            fn.mockReset();
          }
        });
      }
    });

    Object.values(database.utils).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        fn.mockReset();
      }
    });
  },
};

export default database;
