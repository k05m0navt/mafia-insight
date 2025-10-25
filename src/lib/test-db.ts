// Mock database for E2E tests
export const mockPlayers = [
  {
    id: 'player-1',
    gomafiaId: 'gm-001',
    name: 'John Doe',
    eloRating: 1500,
    totalGames: 100,
    wins: 60,
    losses: 40,
    userId: 'user-1',
    clubId: 'club-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    club: {
      id: 'club-1',
      name: 'Test Club',
      description: 'A test club',
    },
    roleStats: [
      {
        id: 'role-stat-1',
        playerId: 'player-1',
        role: 'DON',
        gamesPlayed: 10,
        wins: 7,
        losses: 3,
        winRate: 0.7,
        averagePerformance: 80.5,
        lastPlayed: new Date(),
      },
    ],
  },
  {
    id: 'player-2',
    gomafiaId: 'gm-002',
    name: 'Jane Smith',
    eloRating: 1400,
    totalGames: 80,
    wins: 45,
    losses: 35,
    userId: 'user-2',
    clubId: 'club-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-2',
      name: 'Admin User',
      email: 'admin@example.com',
    },
    club: {
      id: 'club-1',
      name: 'Test Club',
      description: 'A test club',
    },
    roleStats: [
      {
        id: 'role-stat-2',
        playerId: 'player-2',
        role: 'MAFIA',
        gamesPlayed: 8,
        wins: 5,
        losses: 3,
        winRate: 0.625,
        averagePerformance: 75.0,
        lastPlayed: new Date(),
      },
    ],
  },
];

export const mockPlayerAnalytics = {
  player: mockPlayers[0],
  totalGames: 100,
  winRate: 0.6,
  averagePerformance: 75.5,
  rolePerformance: {
    DON: { gamesPlayed: 10, winRate: 0.7, averagePerformance: 80.5 },
    MAFIA: { gamesPlayed: 15, winRate: 0.6, averagePerformance: 75.0 },
    SHERIFF: { gamesPlayed: 5, winRate: 0.4, averagePerformance: 70.0 },
    CITIZEN: { gamesPlayed: 70, winRate: 0.6, averagePerformance: 75.0 },
  },
  recentGames: [
    {
      id: 'game-1',
      date: new Date(),
      role: 'DON',
      team: 'BLACK',
      isWinner: true,
      performanceScore: 85,
    },
  ],
  performanceTrend: [
    { date: '2024-01-01', performance: 70 },
    { date: '2024-01-02', performance: 75 },
    { date: '2024-01-03', performance: 80 },
  ],
};

export const mockLeaderboard = [
  { rank: 1, player: mockPlayers[0], eloRating: 1500, winRate: 0.6 },
  { rank: 2, player: mockPlayers[1], eloRating: 1400, winRate: 0.56 },
];

// Mock database functions
export const mockDb = {
  player: {
    findMany: async (params: Record<string, unknown>) => {
      console.log('Mock DB: findMany players', params);
      return mockPlayers;
    },
    findUnique: async (params: Record<string, unknown>) => {
      console.log('Mock DB: findUnique player', params);
      return mockPlayers[0];
    },
    create: async (params: Record<string, unknown>) => {
      console.log('Mock DB: create player', params);
      return { ...mockPlayers[0], ...params.data };
    },
    update: async (params: Record<string, unknown>) => {
      console.log('Mock DB: update player', params);
      return { ...mockPlayers[0], ...params.data };
    },
    delete: async (params: Record<string, unknown>) => {
      console.log('Mock DB: delete player', params);
      return mockPlayers[0];
    },
    count: async (params: Record<string, unknown>) => {
      console.log('Mock DB: count players', params);
      return mockPlayers.length;
    },
  },
};
