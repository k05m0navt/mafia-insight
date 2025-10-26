import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useImportTrigger } from '@/hooks/useImportTrigger';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('useImportTrigger', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
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

  it('should trigger import successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Initial import started successfully',
      syncLogId: 'log-123',
      estimatedDuration: '3-4 hours',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    expect(result.current.isPending).toBe(false);

    await act(async () => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('/api/gomafia-sync/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  });

  it('should handle import already running error', async () => {
    const mockError = {
      error: 'Import operation already in progress',
      code: 'IMPORT_RUNNING',
      details: {
        progress: 50,
        currentOperation: 'Importing players',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => mockError,
    });

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    await act(async () => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    await act(async () => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle server error', async () => {
    const mockError = {
      error: 'Failed to trigger import',
      code: 'INTERNAL_ERROR',
      details: { message: 'Database connection failed' },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => mockError,
    });

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    await act(async () => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.isError).toBe(true);
  });

  it('should set isPending to true while mutation is in progress', async () => {
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as any).mockReturnValueOnce(mockPromise);

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      status: 202,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should support force restart option', async () => {
    const mockResponse = {
      success: true,
      message: 'Import restarted',
      syncLogId: 'log-456',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    await act(async () => {
      result.current.trigger({ forceRestart: true });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/gomafia-sync/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceRestart: true }),
    });
  });

  it('should allow resetting mutation state', async () => {
    const mockResponse = {
      success: true,
      message: 'Import started',
      syncLogId: 'log-789',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportTrigger(), { wrapper });

    await act(async () => {
      result.current.trigger();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
  });
});
