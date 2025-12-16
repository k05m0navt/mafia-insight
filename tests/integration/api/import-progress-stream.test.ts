import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/import/progress/stream/route';

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

describe('Import Progress SSE Stream API', () => {
  let db: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const dbModule = await import('@/lib/db');
    db = dbModule.db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should create SSE stream with correct headers', async () => {
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress/stream'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe(
      'no-cache, no-transform'
    );
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should send initial progress update immediately', async () => {
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
      'http://localhost:3000/api/gomafia-sync/import/progress/stream'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(decoder.decode(value));
        }
        // Read only first chunk for this test
        if (chunks.length > 0) break;
      }
      reader.releaseLock();
    }

    const firstChunk = chunks[0];
    expect(firstChunk).toBeDefined();
    expect(firstChunk).toContain('data:');
    const jsonMatch = firstChunk.match(/data: ({.*})/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      expect(data.isRunning).toBe(true);
      expect(data.progress).toBe(50);
      expect(data.currentPhase).toBe('GAMES');
    }
  });

  it('should close stream when import is not running', async () => {
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      totalRecordsProcessed: 0,
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress/stream'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(decoder.decode(value));
        }
        // Read only first chunk
        if (chunks.length > 0) break;
      }
      reader.releaseLock();
    }

    const firstChunk = chunks[0];
    expect(firstChunk).toBeDefined();
    expect(firstChunk).toContain('data:');
    const jsonMatch = firstChunk.match(/data: ({.*})/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      expect(data.isRunning).toBe(false);
    }
  });

  it('should handle database errors in stream', async () => {
    vi.mocked(db.syncStatus.findUnique).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress/stream'
    );
    const response = await GET(request);

    // SSE endpoint sends errors in stream, not as 500 status
    // The error is caught inside sendProgress() and sent as error data in stream
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read the stream to verify error message
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      const { value } = await reader.read();
      const text = decoder.decode(value);
      expect(text).toContain('error');
      expect(text).toContain('Database connection failed');
    }
  });

  it('should send updates every 1 second when import is running', async () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    let callCount = 0;

    vi.mocked(db.syncStatus.findUnique).mockImplementation(async () => {
      callCount++;
      return {
        id: 'current',
        isRunning: callCount < 3, // Stop after 2 updates
        progress: callCount * 25,
        currentOperation: 'Importing',
        totalRecordsProcessed: callCount * 250,
        updatedAt: new Date(),
      };
    });

    vi.mocked(db.syncLog.findFirst).mockResolvedValue({
      id: 'sync-1',
      status: 'RUNNING',
      startTime,
      errors: null,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/import/progress/stream'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);

    // Advance timers to trigger interval updates
    vi.advanceTimersByTime(1000);
    await vi.runAllTimersAsync();

    // Verify multiple updates were sent
    expect(callCount).toBeGreaterThan(1);
  });
});
