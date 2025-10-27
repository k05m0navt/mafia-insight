import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImportPage from '@/app/(dashboard)/import/page';
import '@testing-library/jest-dom';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('Import Page', () => {
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

  it('should render import management page with all components', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      syncLogId: null,
      summary: {
        players: 0,
        clubs: 0,
        games: 0,
        tournaments: 0,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(<ImportPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Import Management')).toBeInTheDocument();
    });

    // Should have progress card
    expect(screen.getByText('Import Status')).toBeInTheDocument();

    // Should have controls
    expect(screen.getByText('Start Import')).toBeInTheDocument();

    // Should have summary
    expect(screen.getByText('Import Summary')).toBeInTheDocument();
  });

  it('should display progress when import is running', async () => {
    const mockStatus = {
      isRunning: true,
      progress: 45,
      currentOperation: 'Importing players: batch 15/50',
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      syncLogId: 'log-123',
      summary: {
        players: 500,
        clubs: 25,
        games: 2500,
        tournaments: 10,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockStatus,
    });

    render(<ImportPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Importing players: batch 15/50')
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel Import')).toBeInTheDocument();
  });

  it('should trigger import when start button is clicked', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastSyncTime: null,
      lastSyncType: null,
      lastError: null,
      syncLogId: null,
      summary: {
        players: 0,
        clubs: 0,
        games: 0,
        tournaments: 0,
      },
    };

    const mockTriggerResponse = {
      success: true,
      message: 'Import started successfully',
      syncLogId: 'log-456',
      estimatedDuration: '3-4 hours',
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => mockTriggerResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStatus, isRunning: true }),
      });

    render(<ImportPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Start Import')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start Import'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/gomafia-sync/import',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should display import summary with record counts', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastSyncTime: '2024-01-01T12:00:00.000Z',
      lastSyncType: 'FULL',
      lastError: null,
      syncLogId: null,
      summary: {
        players: 1234,
        clubs: 56,
        games: 5678,
        tournaments: 78,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockStatus,
    });

    render(<ImportPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.getByText('5,678')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('should display error message when import fails', async () => {
    const mockStatus = {
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastSyncTime: null,
      lastSyncType: null,
      lastError: 'Database connection failed',
      syncLogId: null,
      summary: {
        players: 0,
        clubs: 0,
        games: 0,
        tournaments: 0,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockStatus,
    });

    render(<ImportPage />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(/Database connection failed/)
      ).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<ImportPage />, { wrapper });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
