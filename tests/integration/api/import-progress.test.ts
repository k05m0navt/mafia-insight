import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/import/progress/route';

// Mock database
vi.mock('@/lib/db', () => {
  const mockDb = {
    syncStatus: {
      findUnique: vi.fn(),
    },
    syncLog: {
      findFirst: vi.fn(),
    },
  };
  return {
    db: mockDb,
  };
});

describe('Import Progress API', () => {
  let db: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbModule = await import('@/lib/db');
    db = dbModule.db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty progress when no import is running', async () => {
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRunning).toBe(false);
    expect(data.progress).toBe(0);
    expect(data.processedCount).toBe(0);
    expect(data.totalCount).toBe(0);
    expect(data.currentPhase).toBeNull();
    expect(data.currentEntity).toBeNull();
  });

  it('should return progress when import is running', async () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    const updatedAt = new Date('2024-01-01T10:05:00Z');

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 50,
      currentOperation: 'Importing games',
      totalRecordsProcessed: 500,
      updatedAt,
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue({
      id: 'sync-1',
      status: 'RUNNING',
      startTime,
      errors: {
        progressMetrics: {
          currentPhase: 'GAMES',
          phaseProgress: {
            processed: 500,
            total: 1000,
          },
          currentEntity: {
            id: 'game-123',
            name: 'Game 123',
          },
          processingRate: 10,
          elapsedSeconds: 300,
          estimatedSecondsRemaining: 50,
          overallProgress: 50,
          startTime: startTime.toISOString(),
          lastUpdated: updatedAt.toISOString(),
        },
      },
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRunning).toBe(true);
    expect(data.progress).toBe(50);
    expect(data.currentPhase).toBe('GAMES');
    expect(data.processedCount).toBe(500);
    expect(data.totalCount).toBe(1000);
    expect(data.currentEntity).toEqual({
      id: 'game-123',
      name: 'Game 123',
    });
    expect(data.processingRate).toBe(10);
    expect(data.estimatedSecondsRemaining).toBe(50);
    expect(data.startTime).toBe(startTime.toISOString());
  });

  it('should calculate progress from syncStatus when detailed metrics not available', async () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    const updatedAt = new Date('2024-01-01T10:05:00Z');

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 50,
      currentOperation: 'Importing games',
      totalRecordsProcessed: 500,
      updatedAt,
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue({
      id: 'sync-1',
      status: 'RUNNING',
      startTime,
      errors: null,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRunning).toBe(true);
    expect(data.progress).toBe(50);
    expect(data.processedCount).toBe(500);
    expect(data.totalCount).toBe(0); // Not available in syncStatus
    expect(data.elapsedSeconds).toBeGreaterThan(0);
    expect(data.processingRate).toBeGreaterThanOrEqual(0);
  });

  it('should handle missing syncLog gracefully', async () => {
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 25,
      currentOperation: 'Importing',
      totalRecordsProcessed: 250,
      updatedAt: new Date(),
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRunning).toBe(true);
    expect(data.progress).toBe(25);
    expect(data.processedCount).toBe(250);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(db.syncStatus.findUnique).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch import progress');
    expect(data.message).toBe('Database connection failed');
  });

  it('should handle progress with pageNumber entity', async () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    const updatedAt = new Date('2024-01-01T10:05:00Z');

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 30,
      currentOperation: 'Importing players',
      totalRecordsProcessed: 300,
      updatedAt,
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue({
      id: 'sync-1',
      status: 'RUNNING',
      startTime,
      errors: {
        progressMetrics: {
          currentPhase: 'PLAYERS',
          phaseProgress: {
            processed: 300,
            total: 1000,
          },
          currentEntity: {
            pageNumber: 5,
          },
          processingRate: 5,
          elapsedSeconds: 60,
          estimatedSecondsRemaining: 140,
          overallProgress: 30,
          startTime: startTime.toISOString(),
          lastUpdated: updatedAt.toISOString(),
        },
      },
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentPhase).toBe('PLAYERS');
    expect(data.currentEntity).toEqual({
      pageNumber: 5,
    });
  });

  it('should calculate elapsed time correctly', async () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    const now = new Date('2024-01-01T10:05:30Z'); // 5 minutes 30 seconds later
    vi.useFakeTimers();
    vi.setSystemTime(now);

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 50,
      currentOperation: 'Importing',
      totalRecordsProcessed: 500,
      updatedAt: now,
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue({
      id: 'sync-1',
      status: 'RUNNING',
      startTime,
      errors: null,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.elapsedSeconds).toBeCloseTo(330, 0); // 5 minutes 30 seconds

    vi.useRealTimers();
  });
});
