import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/import/status/route';

/**
 * Integration tests for import status API endpoint edge cases.
 * Verifies that the API handles edge cases correctly.
 *
 * Task 7: "Test: Verify API returns correct status data"
 * Task 7: "Test: Verify API handles missing jobs correctly"
 */
describe('Import Status API Endpoint - Edge Cases', () => {
  let mockDb: any;
  let mockUser: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      syncLog: {
        findUnique: vi.fn(),
      },
      syncStatus: {
        findUnique: vi.fn(),
      },
      importCheckpoint: {
        findUnique: vi.fn(),
      },
    };

    // Mock user authentication
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    // Mock authenticateRequest
    vi.mock('@/lib/apiAuth', () => ({
      authenticateRequest: vi.fn().mockResolvedValue({
        user: mockUser,
      }),
    }));

    // Mock database module
    vi.mock('@/lib/db', () => ({
      prisma: mockDb,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Missing Job ID', () => {
    it('should return 400 when jobId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('jobId query parameter is required');
      expect(data.code).toBe('MISSING_JOB_ID');
    });

    it('should return 400 when jobId is empty string', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status?jobId='
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('jobId query parameter is required');
      expect(data.code).toBe('MISSING_JOB_ID');
    });
  });

  describe('Job Not Found', () => {
    it('should return 404 when sync log does not exist', async () => {
      mockDb.syncLog.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status?jobId=non-existent-job'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Import job not found');
      expect(data.code).toBe('JOB_NOT_FOUND');
    });

    it('should return 404 when sync status does not exist', async () => {
      mockDb.syncLog.findUnique.mockResolvedValue({
        id: 'job-123',
        status: 'RUNNING',
        startTime: new Date(),
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status?jobId=job-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Import status not found');
      expect(data.code).toBe('STATUS_NOT_FOUND');
    });
  });

  describe('Status Data Accuracy', () => {
    it('should return correct status data for running import', async () => {
      const jobId = 'job-123';
      const startTime = new Date('2024-01-01T00:00:00Z');

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime,
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 0,
        currentOperation: 'Initializing import...',
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 500,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue({
        id: 'user-user-123',
        currentPhase: 'GAMES',
        currentBatch: 5,
        lastProcessedId: 'game-500',
        processedIds: Array.from({ length: 500 }, (_, i) => `game-${i}`),
        progress: 50,
        isPaused: false,
        lastUpdated: new Date(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(data.percentageComplete).toBe(50); // 500 / 1000 * 100
      expect(data.currentGameNumber).toBe(500);
      expect(data.totalGames).toBe(1000);
      expect(data.estimatedTimeRemaining).toBeGreaterThan(0);
      expect(data.currentPhase).toBe('GAMES');
      expect(data.status).toBe('running');
      expect(data.currentOperation).toBe('Initializing import...');
      expect(data.lastError).toBeNull();
      expect(data.startTime).toBe(startTime.toISOString());
      expect(data.endTime).toBeNull();
    });

    it('should return correct status data for completed import', async () => {
      const jobId = 'job-123';
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T01:00:00Z');

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'COMPLETED',
        startTime,
        endTime,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: false,
        progress: 100,
        currentOperation: null,
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 1000,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue({
        id: 'user-user-123',
        currentPhase: 'STATISTICS',
        currentBatch: 10,
        lastProcessedId: 'game-1000',
        processedIds: Array.from({ length: 1000 }, (_, i) => `game-${i}`),
        progress: 100,
        isPaused: false,
        lastUpdated: new Date(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.percentageComplete).toBe(100);
      expect(data.currentGameNumber).toBe(1000);
      expect(data.totalGames).toBe(1000);
      expect(data.estimatedTimeRemaining).toBeNull(); // Completed, no time remaining
      expect(data.status).toBe('completed');
      expect(data.endTime).toBe(endTime.toISOString());
    });

    it('should return correct status data for failed import', async () => {
      const jobId = 'job-123';
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T00:30:00Z');

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'FAILED',
        startTime,
        endTime,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: false,
        progress: 50,
        currentOperation: null,
        lastError: 'Network timeout during import',
        totalRecordsProcessed: 1000,
        validRecords: 500,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue({
        id: 'user-user-123',
        currentPhase: 'GAMES',
        currentBatch: 5,
        lastProcessedId: 'game-500',
        processedIds: Array.from({ length: 500 }, (_, i) => `game-${i}`),
        progress: 50,
        isPaused: false,
        lastUpdated: new Date(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.percentageComplete).toBe(50);
      expect(data.status).toBe('failed');
      expect(data.lastError).toBe('Network timeout during import');
      expect(data.endTime).toBe(endTime.toISOString());
    });

    it('should return correct status data for paused import', async () => {
      const jobId = 'job-123';
      const startTime = new Date('2024-01-01T00:00:00Z');

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime,
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 50,
        currentOperation: 'Import paused',
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 500,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue({
        id: 'user-user-123',
        currentPhase: 'GAMES',
        currentBatch: 5,
        lastProcessedId: 'game-500',
        processedIds: Array.from({ length: 500 }, (_, i) => `game-${i}`),
        progress: 50,
        isPaused: true, // Paused
        lastUpdated: new Date(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('paused');
      expect(data.percentageComplete).toBe(50);
    });
  });

  describe('Percentage Calculation Edge Cases', () => {
    it('should handle zero total games', async () => {
      const jobId = 'job-123';

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime: new Date(),
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 0,
        currentOperation: 'Initializing...',
        lastError: null,
        totalRecordsProcessed: 0,
        validRecords: 0,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.percentageComplete).toBe(0);
      expect(data.totalGames).toBe(0);
    });

    it('should handle processed games greater than total (should not happen, but handle gracefully)', async () => {
      const jobId = 'job-123';

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime: new Date(),
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 0,
        currentOperation: 'Processing...',
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 1100, // More than total (data inconsistency)
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should cap at 100% or handle gracefully
      expect(data.percentageComplete).toBeGreaterThanOrEqual(0);
      expect(data.percentageComplete).toBeLessThanOrEqual(100);
    });
  });

  describe('Estimated Time Remaining', () => {
    it('should return null for estimated time when import is completed', async () => {
      const jobId = 'job-123';

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'COMPLETED',
        startTime: new Date(),
        endTime: new Date(),
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: false,
        progress: 100,
        currentOperation: null,
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 1000,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedTimeRemaining).toBeNull();
    });

    it('should calculate estimated time when import is running', async () => {
      const jobId = 'job-123';

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime: new Date(),
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 50,
        currentOperation: 'Processing games...',
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 500,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedTimeRemaining).toBeGreaterThan(0);
      // 500 remaining games * 2 seconds = 1000 seconds
      expect(data.estimatedTimeRemaining).toBe(1000);
    });
  });

  describe('Response Headers', () => {
    it('should set no-cache headers to prevent caching', async () => {
      const jobId = 'job-123';

      mockDb.syncLog.findUnique.mockResolvedValue({
        id: jobId,
        status: 'RUNNING',
        startTime: new Date(),
        endTime: null,
      });

      mockDb.syncStatus.findUnique.mockResolvedValue({
        id: 'user-user-123',
        isRunning: true,
        progress: 50,
        currentOperation: 'Processing...',
        lastError: null,
        totalRecordsProcessed: 1000,
        validRecords: 500,
        updatedAt: new Date(),
      });

      mockDb.importCheckpoint.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/gomafia-sync/import/status?jobId=${jobId}`
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when authentication fails', async () => {
      // Mock authentication failure
      vi.doMock('@/lib/apiAuth', () => ({
        authenticateRequest: vi
          .fn()
          .mockRejectedValue(new Error('Authentication required')),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status?jobId=job-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.syncLog.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/import/status?jobId=job-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch import status');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(data.details).toBeDefined();
    });
  });
});
