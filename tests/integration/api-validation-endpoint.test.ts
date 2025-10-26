import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockDb = {
  syncStatus: {
    findUnique: vi.fn(),
  },
  syncLog: {
    findFirst: vi.fn(),
  },
  gameParticipation: {
    findMany: vi.fn(),
  },
  player: {
    findMany: vi.fn(),
  },
  tournament: {
    findMany: vi.fn(),
  },
  game: {
    findMany: vi.fn(),
  },
  playerTournament: {
    findMany: vi.fn(),
  },
};

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockDb),
}));

describe('GET /api/gomafia-sync/import/validation', () => {
  let GET: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import after mocks are set up
    const module = await import(
      '@/app/api/gomafia-sync/import/validation/route'
    );
    GET = module.GET;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return validation metrics and integrity status', async () => {
    const mockSyncStatus = {
      id: 'current',
      validationRate: 99.5,
      totalRecordsProcessed: 1000,
      validRecords: 995,
      invalidRecords: 5,
    };

    const mockSyncLog = {
      id: 'sync-123',
      endTime: new Date('2024-01-01T00:00:00.000Z'),
      recordsProcessed: 995,
      errors: null,
    };

    mockDb.syncStatus.findUnique.mockResolvedValue(mockSyncStatus);
    mockDb.syncLog.findFirst.mockResolvedValue(mockSyncLog);

    // Mock integrity checks to return empty arrays (all passing)
    mockDb.gameParticipation.findMany.mockResolvedValue([]);
    mockDb.player.findMany.mockResolvedValue([]);
    mockDb.tournament.findMany.mockResolvedValue([]);
    mockDb.game.findMany.mockResolvedValue([]);
    mockDb.playerTournament.findMany.mockResolvedValue([]);

    const request = new Request(
      'http://localhost:3000/api/gomafia-sync/import/validation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.validation).toBeDefined();
    expect(data.validation.validationRate).toBe(99.5);
    expect(data.validation.totalRecordsProcessed).toBe(1000);
    expect(data.validation.validRecords).toBe(995);
    expect(data.validation.invalidRecords).toBe(5);
    expect(data.validation.meetsThreshold).toBe(true); // 99.5% >= 98%

    expect(data.integrity).toBeDefined();
    expect(data.integrity.status).toBe('PASS');
    expect(data.integrity.totalChecks).toBeGreaterThan(0);
    expect(data.integrity.passedChecks).toBe(data.integrity.totalChecks);
    expect(data.integrity.failedChecks).toBe(0);
    expect(data.integrity.issues).toEqual([]);

    expect(data.lastSync).toBeDefined();
    expect(data.lastSync.id).toBe('sync-123');
    expect(data.lastSync.endTime).toBe('2024-01-01T00:00:00.000Z');
    expect(data.lastSync.recordsProcessed).toBe(995);
  });

  it('should indicate validation threshold not met when rate < 98%', async () => {
    const mockSyncStatus = {
      id: 'current',
      validationRate: 95.0,
      totalRecordsProcessed: 1000,
      validRecords: 950,
      invalidRecords: 50,
    };

    mockDb.syncStatus.findUnique.mockResolvedValue(mockSyncStatus);
    mockDb.syncLog.findFirst.mockResolvedValue(null);

    // Mock integrity checks
    mockDb.gameParticipation.findMany.mockResolvedValue([]);
    mockDb.player.findMany.mockResolvedValue([]);
    mockDb.tournament.findMany.mockResolvedValue([]);
    mockDb.game.findMany.mockResolvedValue([]);
    mockDb.playerTournament.findMany.mockResolvedValue([]);

    const request = new Request(
      'http://localhost:3000/api/gomafia-sync/import/validation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.validation.validationRate).toBe(95.0);
    expect(data.validation.meetsThreshold).toBe(false); // 95% < 98%
  });

  it('should detect integrity failures', async () => {
    const mockSyncStatus = {
      id: 'current',
      validationRate: 99.5,
      totalRecordsProcessed: 1000,
      validRecords: 995,
      invalidRecords: 5,
    };

    mockDb.syncStatus.findUnique.mockResolvedValue(mockSyncStatus);
    mockDb.syncLog.findFirst.mockResolvedValue(null);

    // Mock integrity check to find orphaned participation
    mockDb.gameParticipation.findMany.mockResolvedValue([
      { id: '1', playerId: 'invalid-player', gameId: 'game-1' },
    ]);
    mockDb.player.findMany.mockResolvedValue([]); // No players exist
    mockDb.tournament.findMany.mockResolvedValue([]);
    mockDb.game.findMany.mockResolvedValue([
      { id: 'game-1', tournamentId: 'tournament-1' },
    ]);
    mockDb.playerTournament.findMany.mockResolvedValue([]);

    const request = new Request(
      'http://localhost:3000/api/gomafia-sync/import/validation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.integrity.status).toBe('FAIL');
    expect(data.integrity.failedChecks).toBeGreaterThan(0);
    expect(data.integrity.issues).toBeDefined();
    expect(data.integrity.issues.length).toBeGreaterThan(0);
  });

  it('should return null values when no sync status exists', async () => {
    mockDb.syncStatus.findUnique.mockResolvedValue(null);
    mockDb.syncLog.findFirst.mockResolvedValue(null);

    // Mock integrity checks
    mockDb.gameParticipation.findMany.mockResolvedValue([]);
    mockDb.player.findMany.mockResolvedValue([]);
    mockDb.tournament.findMany.mockResolvedValue([]);
    mockDb.game.findMany.mockResolvedValue([]);
    mockDb.playerTournament.findMany.mockResolvedValue([]);

    const request = new Request(
      'http://localhost:3000/api/gomafia-sync/import/validation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.validation.validationRate).toBeNull();
    expect(data.validation.totalRecordsProcessed).toBeNull();
    expect(data.validation.validRecords).toBeNull();
    expect(data.validation.invalidRecords).toBeNull();
    expect(data.validation.meetsThreshold).toBe(false);
    expect(data.lastSync).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    mockDb.syncStatus.findUnique.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request(
      'http://localhost:3000/api/gomafia-sync/import/validation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch validation metrics');
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});
