import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useManualSync } from '@/hooks/useManualSync';

// Mock fetch
global.fetch = vi.fn();

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useManualSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('Sync Status Query', () => {
    it('should fetch sync status successfully', async () => {
      const mockStatus = {
        isRunning: false,
        progress: 0,
        currentOperation: null,
        lastSyncTime: '2024-01-01T00:00:00Z',
        lastSyncType: 'INCREMENTAL',
        lastError: null,
        syncLogId: 'log-123',
        syncLogStatus: 'COMPLETED',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-01T01:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      expect(result.current.syncStatus).toEqual(mockStatus);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(0);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      expect(result.current.statusError).toBeDefined();
      expect(result.current.syncStatus).toBeUndefined();
    });
  });

  describe('Sync Mutation', () => {
    it('should trigger sync successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Sync started',
        summary: {
          gamesImported: 5,
          gamesUpdated: 3,
          errors: 0,
        },
      };

      // Mock status fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isRunning: false,
          progress: 0,
          currentOperation: null,
          lastSyncTime: null,
          lastSyncType: null,
          lastError: null,
          syncLogId: null,
          syncLogStatus: null,
          startTime: null,
          endTime: null,
        }),
      });

      // Mock sync trigger
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      // Trigger sync
      result.current.triggerSync();

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.syncData).toEqual(mockResponse);
    });

    it('should handle sync trigger errors', async () => {
      // Mock status fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isRunning: false,
          progress: 0,
          currentOperation: null,
          lastSyncTime: null,
          lastSyncType: null,
          lastError: null,
          syncLogId: null,
          syncLogStatus: null,
          startTime: null,
          endTime: null,
        }),
      });

      // Mock sync trigger error
      (global.fetch as any).mockRejectedValueOnce(new Error('Sync failed'));

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      result.current.triggerSync();

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.syncError).toBeDefined();
    });

    it('should handle 409 Conflict response (concurrent sync)', async () => {
      // Mock status fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isRunning: false,
          progress: 0,
          currentOperation: null,
          lastSyncTime: null,
          lastSyncType: null,
          lastError: null,
          syncLogId: null,
          syncLogStatus: null,
          startTime: null,
          endTime: null,
        }),
      });

      // Mock 409 response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'Sync already in progress',
          message: 'Sync already in progress. Please wait.',
        }),
      });

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      result.current.triggerSync();

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.syncError?.message).toContain(
        'already in progress'
      );
    });
  });

  describe('Helper Properties', () => {
    it('should correctly compute isRunning from status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isRunning: true,
          progress: 50,
          currentOperation: 'Processing...',
          lastSyncTime: null,
          lastSyncType: null,
          lastError: null,
          syncLogId: null,
          syncLogStatus: null,
          startTime: null,
          endTime: null,
        }),
      });

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.progress).toBe(50);
      expect(result.current.currentOperation).toBe('Processing...');
    });

    it('should return null for lastError when no error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isRunning: false,
          progress: 100,
          currentOperation: null,
          lastSyncTime: '2024-01-01T00:00:00Z',
          lastSyncType: 'INCREMENTAL',
          lastError: null,
          syncLogId: null,
          syncLogStatus: null,
          startTime: null,
          endTime: null,
        }),
      });

      const { result } = renderHook(() => useManualSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      expect(result.current.lastError).toBeNull();
    });
  });
});
