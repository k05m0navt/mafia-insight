import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/sync/logs/route';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    syncLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Sync Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return sync logs successfully', async () => {
    const { db } = await import('@/lib/db');

    const mockLogs = [
      {
        id: 'log-1',
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 1000,
        errors: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      },
      {
        id: 'log-2',
        type: 'INCREMENTAL',
        status: 'FAILED',
        startTime: new Date('2024-01-02T00:00:00Z'),
        endTime: new Date('2024-01-02T00:30:00Z'),
        recordsProcessed: 50,
        errors: ['Network timeout', 'Invalid data format'],
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:30:00Z'),
      },
    ];

    vi.mocked(db.syncLog.findMany).mockResolvedValue(mockLogs);
    vi.mocked(db.syncLog.count).mockResolvedValue(2);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.logs[0].id).toBe('log-1');
    expect(data.logs[0].status).toBe('COMPLETED');
    expect(data.logs[1].status).toBe('FAILED');
    expect(data.logs[1].errors).toContain('Network timeout');
  });

  it('should handle pagination parameters', async () => {
    const { db } = await import('@/lib/db');

    const mockLogs = [
      {
        id: 'log-1',
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 1000,
        errors: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      },
    ];

    vi.mocked(db.syncLog.findMany).mockResolvedValue(mockLogs);
    vi.mocked(db.syncLog.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?page=1&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBe(1);
    expect(db.syncLog.findMany).toHaveBeenCalledWith({
      orderBy: { startTime: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should handle status filter', async () => {
    const { db } = await import('@/lib/db');

    const mockLogs = [
      {
        id: 'log-1',
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 1000,
        errors: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      },
    ];

    vi.mocked(db.syncLog.findMany).mockResolvedValue(mockLogs);
    vi.mocked(db.syncLog.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?status=COMPLETED'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].status).toBe('COMPLETED');
    expect(db.syncLog.findMany).toHaveBeenCalledWith({
      where: { status: 'COMPLETED' },
      orderBy: { startTime: 'desc' },
      skip: 0,
      take: 20,
    });
  });

  it('should handle type filter', async () => {
    const { db } = await import('@/lib/db');

    const mockLogs = [
      {
        id: 'log-1',
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 1000,
        errors: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      },
    ];

    vi.mocked(db.syncLog.findMany).mockResolvedValue(mockLogs);
    vi.mocked(db.syncLog.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?type=FULL'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].type).toBe('FULL');
    expect(db.syncLog.findMany).toHaveBeenCalledWith({
      where: { type: 'FULL' },
      orderBy: { startTime: 'desc' },
      skip: 0,
      take: 20,
    });
  });

  it('should handle date range filter', async () => {
    const { db } = await import('@/lib/db');

    const mockLogs = [
      {
        id: 'log-1',
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 1000,
        errors: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      },
    ];

    vi.mocked(db.syncLog.findMany).mockResolvedValue(mockLogs);
    vi.mocked(db.syncLog.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?startDate=2024-01-01&endDate=2024-01-02'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(db.syncLog.findMany).toHaveBeenCalledWith({
      where: {
        startTime: {
          gte: new Date('2024-01-01T00:00:00Z'),
          lte: new Date('2024-01-02T23:59:59Z'),
        },
      },
      orderBy: { startTime: 'desc' },
      skip: 0,
      take: 20,
    });
  });

  it('should handle empty results', async () => {
    const { db } = await import('@/lib/db');

    vi.mocked(db.syncLog.findMany).mockResolvedValue([]);
    vi.mocked(db.syncLog.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
  });

  it('should handle database errors', async () => {
    const { db } = await import('@/lib/db');

    vi.mocked(db.syncLog.findMany).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Database connection failed');
  });

  it('should handle invalid pagination parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?page=-1&limit=0'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid pagination parameters');
  });

  it('should handle invalid date format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/logs?startDate=invalid-date'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid date format');
  });
});
