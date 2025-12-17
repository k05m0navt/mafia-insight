/**
 * Component tests for ELOTrendsChart
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ELOTrendsChart } from '@/components/analytics/ELOTrendsChart';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
const mockUseELOTrends = vi.fn();
vi.mock('@/hooks/useELOTrends', () => ({
  useELOTrends: () => mockUseELOTrends(),
}));

// Mock the Zustand analytics store
const mockSetDateRange = vi.fn();
const mockUseAnalyticsStore = vi.fn(() => ({
  dateRange: { preset: 'last_month' },
  setDateRange: mockSetDateRange,
}));
vi.mock('@/store/analyticsStore', () => ({
  useAnalyticsStore: () => mockUseAnalyticsStore(),
}));

// Mock the lazy-loaded chart content
vi.mock('@/components/analytics/ELOTrendsChartContent', () => ({
  ChartContent: ({
    trends,
  }: {
    trends: Array<{ elo: number; date: string }>;
  }) => <div data-testid="chart-content">{trends.length} data points</div>,
}));

describe('ELOTrendsChart', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock to default state
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: { preset: 'last_month' },
      setDateRange: mockSetDateRange,
    });
  });

  it('should render loading state', () => {
    mockUseELOTrends.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    // Should show skeleton loader (check for skeleton elements with animate-pulse class)
    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render ELO trends chart with data', async () => {
    mockUseELOTrends.mockReturnValue({
      data: {
        trends: [
          { date: '2024-01-01', elo: 1485, gameId: 'game-1' },
          { date: '2024-01-02', elo: 1500, gameId: 'game-2' },
          { date: '2024-01-03', elo: 1520, gameId: 'game-3' },
        ],
        currentELO: 1520,
        historicalHigh: 1520,
        historicalLow: 1485,
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ELO Rating Trends')).toBeInTheDocument();
      // Current ELO should be displayed (large text)
      const currentELO = screen
        .getAllByText('1520')
        .find((el) => el.className.includes('text-4xl'));
      expect(currentELO).toBeInTheDocument();
      // Historical values should be displayed
      expect(screen.getByText('1485')).toBeInTheDocument(); // Historical Low
    });

    // Chart should be rendered (wait for lazy-loaded component)
    await waitFor(() => {
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });
  });

  it('should render error state', async () => {
    mockUseELOTrends.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch ELO trends'),
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load ELO trends/i)
      ).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    mockUseELOTrends.mockReturnValue({
      data: {
        trends: [],
        currentELO: 1500,
        historicalHigh: 1500,
        historicalLow: 1500,
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No ELO data available/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Import game data or select a different time range/i)
      ).toBeInTheDocument();
    });
  });

  it('should display ELO change indicator when available', async () => {
    mockUseELOTrends.mockReturnValue({
      data: {
        trends: [
          { date: '2024-01-01', elo: 1500, gameId: 'game-1' },
          { date: '2024-01-02', elo: 1520, gameId: 'game-2' },
        ],
        currentELO: 1520,
        historicalHigh: 1520,
        historicalLow: 1500,
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should show current ELO prominently (large text)
      const currentELO = screen
        .getAllByText('1520')
        .find((el) => el.className.includes('text-4xl'));
      expect(currentELO).toBeInTheDocument();
    });
  });

  it('should include time range selector', async () => {
    mockUseELOTrends.mockReturnValue({
      data: {
        trends: [{ date: '2024-01-01', elo: 1500, gameId: 'game-1' }],
        currentELO: 1500,
        historicalHigh: 1500,
        historicalLow: 1500,
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ELOTrendsChart playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Time range selector should be present
      expect(screen.getByText(/Last Month/i)).toBeInTheDocument();
    });
  });
});
