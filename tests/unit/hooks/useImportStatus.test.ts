import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useImportStatus } from '@/hooks/useImportStatus';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('useImportStatus', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch import status successfully', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastSyncTime: '2024-01-01T00:00:00.000Z',
      lastSyncType: 'FULL',
      lastError: null,
      validation: {
        validationRate: 99.5,
        totalRecordsProcessed: 6070,
        validRecords: 6040,
        invalidRecords: 30,
      },
      summary: {
        players: 1000,
        clubs: 50,
        games: 5000,
        tournaments: 20,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockStatus);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/gomafia-sync/import');
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('should poll every 2 seconds when import is running', async () => {
    const mockRunningStatus = {
      isRunning: true,
      progress: 50,
      currentOperation: 'Importing players',
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      validation: {
        validationRate: null,
        totalRecordsProcessed: null,
        validRecords: null,
        invalidRecords: null,
      },
      summary: { players: 500, clubs: 25, games: 2500, tournaments: 10 },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockRunningStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.isRunning).toBe(true);

    // Advance time and check if refetch happens
    const initialFetchCount = (global.fetch as any).mock.calls.length;

    // Wait for polling interval (2 seconds)
    await waitFor(
      () => {
        expect((global.fetch as any).mock.calls.length).toBeGreaterThan(
          initialFetchCount
        );
      },
      { timeout: 3000 }
    );
  });

  it('should disable polling when import is not running', async () => {
    const mockIdleStatus = {
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastSyncTime: '2024-01-01T00:00:00.000Z',
      lastSyncType: 'FULL',
      lastError: null,
      validation: {
        validationRate: 99.5,
        totalRecordsProcessed: 6070,
        validRecords: 6040,
        invalidRecords: 30,
      },
      summary: { players: 1000, clubs: 50, games: 5000, tournaments: 20 },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockIdleStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.isRunning).toBe(false);

    const fetchCountAfterFirstLoad = (global.fetch as any).mock.calls.length;

    // Wait 3 seconds and verify no additional fetches
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect((global.fetch as any).mock.calls.length).toBe(
      fetchCountAfterFirstLoad
    );
  });

  it('should return progress percentage', async () => {
    const mockStatus = {
      isRunning: true,
      progress: 75,
      currentOperation: 'Importing games',
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      validation: {
        validationRate: null,
        totalRecordsProcessed: null,
        validRecords: null,
        invalidRecords: null,
      },
      summary: { players: 750, clubs: 37, games: 3750, tournaments: 15 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.progress).toBe(75);
    });
  });

  it('should return current operation description', async () => {
    const mockStatus = {
      isRunning: true,
      progress: 60,
      currentOperation: 'Importing tournaments: batch 3/10',
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      validation: {
        validationRate: null,
        totalRecordsProcessed: null,
        validRecords: null,
        invalidRecords: null,
      },
      summary: { players: 600, clubs: 30, games: 3000, tournaments: 12 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.currentOperation).toBe(
        'Importing tournaments: batch 3/10'
      );
    });
  });

  it('should return import summary with record counts', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastSyncTime: '2024-01-01T00:00:00.000Z',
      lastSyncType: 'FULL',
      lastError: null,
      validation: {
        validationRate: 99.5,
        totalRecordsProcessed: 7046,
        validRecords: 7011,
        invalidRecords: 35,
      },
      summary: { players: 1234, clubs: 56, games: 5678, tournaments: 78 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    const { result } = renderHook(() => useImportStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.summary).toEqual({
        players: 1234,
        clubs: 56,
        games: 5678,
        tournaments: 78,
      });
    });
  });
});
