import { vi } from 'vitest';

// Mock implementation of gomafiaParser for testing
export const gomafiaParser = {
  // Mock parseGame function
  parseGame: vi.fn().mockImplementation((gameData: any) => {
    return {
      id: gameData.id || 'mock-game-id',
      name: gameData.name || 'Mock Game',
      status: gameData.status || 'active',
      players: gameData.players || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  // Mock parsePlayer function
  parsePlayer: vi.fn().mockImplementation((playerData: any) => {
    return {
      id: playerData.id || 'mock-player-id',
      name: playerData.name || 'Mock Player',
      gameId: playerData.gameId || 'mock-game-id',
      userId: playerData.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  // Mock parseSyncStatus function
  parseSyncStatus: vi.fn().mockImplementation((statusData: any) => {
    return {
      id: statusData.id || 'mock-sync-id',
      lastSyncAt: statusData.lastSyncAt || new Date(),
      status: statusData.status || 'completed',
      recordsProcessed: statusData.recordsProcessed || 0,
      errors: statusData.errors || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  // Mock validateGameData function
  validateGameData: vi.fn().mockImplementation((gameData: any) => {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }),

  // Mock validatePlayerData function
  validatePlayerData: vi.fn().mockImplementation((playerData: any) => {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }),

  // Mock transformGameData function
  transformGameData: vi.fn().mockImplementation((gameData: any) => {
    return {
      ...gameData,
      transformed: true,
      transformedAt: new Date(),
    };
  }),

  // Mock transformPlayerData function
  transformPlayerData: vi.fn().mockImplementation((playerData: any) => {
    return {
      ...playerData,
      transformed: true,
      transformedAt: new Date(),
    };
  }),

  // Mock error handling
  handleParseError: vi.fn().mockImplementation((error: Error) => {
    return {
      error: error.message,
      timestamp: new Date(),
      recoverable: true,
    };
  }),

  // Mock batch processing
  processBatch: vi.fn().mockImplementation(async (items: any[]) => {
    return {
      processed: items.length,
      successful: items.length,
      failed: 0,
      errors: [],
    };
  }),

  // Mock data fetching
  fetchGameData: vi.fn().mockImplementation(async (gameId: string) => {
    return {
      id: gameId,
      name: `Mock Game ${gameId}`,
      status: 'active',
      players: [],
    };
  }),

  fetchPlayerData: vi.fn().mockImplementation(async (playerId: string) => {
    return {
      id: playerId,
      name: `Mock Player ${playerId}`,
      gameId: 'mock-game-id',
    };
  }),

  // Mock configuration
  config: {
    batchSize: 100,
    maxRetries: 3,
    timeout: 30000,
    enableLogging: true,
  },

  // Mock cleanup function
  cleanup: vi.fn().mockImplementation(async () => {
    // Mock cleanup implementation
    return Promise.resolve();
  }),

  // Reset all mocks
  resetMocks: () => {
    Object.values(gomafiaParser).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        fn.mockReset();
      }
    });
  },
};

export default gomafiaParser;
