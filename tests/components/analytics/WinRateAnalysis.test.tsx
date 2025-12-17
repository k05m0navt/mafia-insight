/**
 * Component tests for WinRateAnalysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WinRateAnalysis } from '@/components/analytics/WinRateAnalysis';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
const mockUseWinRateAnalysis = vi.fn();
vi.mock('@/hooks/useWinRateAnalysis', () => ({
  useWinRateAnalysis: () => mockUseWinRateAnalysis(),
}));

// Mock the Zustand analytics store
const mockSetDateRange = vi.fn();
const mockSetSelectedRoles = vi.fn();
const mockUseAnalyticsStore = vi.fn(() => ({
  dateRange: { preset: 'last_month' },
  selectedRoles: [],
  setDateRange: mockSetDateRange,
  setSelectedRoles: mockSetSelectedRoles,
}));
vi.mock('@/store/analyticsStore', () => ({
  useAnalyticsStore: () => mockUseAnalyticsStore(),
}));

// Mock the lazy-loaded chart components
vi.mock('@/components/analytics/WinRateBarChartContent', () => ({
  ChartContent: ({ data }: { data: Record<string, number> }) => (
    <div data-testid="bar-chart">
      Bar Chart: {Object.keys(data).length} roles
    </div>
  ),
}));

vi.mock('@/components/analytics/WinLossPieChartContent', () => ({
  ChartContent: ({ wins, losses }: { wins: number; losses: number }) => (
    <div data-testid="pie-chart">
      Pie Chart: {wins} wins, {losses} losses
    </div>
  ),
}));

// Mock TimeRangeSelector
vi.mock('@/components/analytics/TimeRangeSelector', () => ({
  TimeRangeSelector: ({ value, onChange }: any) => (
    <div data-testid="time-range-selector">
      Time Range: {value?.preset || 'custom'}
    </div>
  ),
}));

describe('WinRateAnalysis', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: { preset: 'last_month' },
      selectedRoles: [],
      setDateRange: mockSetDateRange,
      setSelectedRoles: mockSetSelectedRoles,
    });
  });

  it('should render loading state', () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render win rate analysis with data', async () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: {
        overall: 66.67,
        byRole: {
          DON: 50,
          MAFIA: 100,
          SHERIFF: 0,
          CITIZEN: 0,
        },
        byScenario: {
          tournament: 100,
          casual: 50,
        },
        comparisonToAverage: 10,
        winLossCounts: {
          overall: {
            wins: 2,
            losses: 1,
            total: 3,
          },
          byRole: {
            DON: { wins: 1, losses: 1, total: 2 },
            MAFIA: { wins: 1, losses: 0, total: 1 },
            SHERIFF: { wins: 0, losses: 0, total: 0 },
            CITIZEN: { wins: 0, losses: 0, total: 0 },
          },
        },
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Win Rate Analysis')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // Overall win rate
      expect(screen.getByText('DON')).toBeInTheDocument();
      expect(screen.getByText('MAFIA')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: {
        overall: 0,
        byRole: { DON: 0, MAFIA: 0, SHERIFF: 0, CITIZEN: 0 },
        winLossCounts: {
          overall: { wins: 0, losses: 0, total: 0 },
          byRole: {},
        },
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(screen.getByText('No win rate data available')).toBeInTheDocument();
    expect(
      screen.getByText(/Import game data or select a different time range/)
    ).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch data'),
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(
      screen.getByText(/Failed to load win rate analysis/)
    ).toBeInTheDocument();
  });

  it('should display scenario-based win rates when available', async () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: {
        overall: 75,
        byRole: { DON: 75, MAFIA: 75, SHERIFF: 0, CITIZEN: 0 },
        byScenario: {
          tournament: 100,
          casual: 50,
        },
        winLossCounts: {
          overall: { wins: 3, losses: 1, total: 4 },
          byRole: {},
        },
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Win Rate by Scenario')).toBeInTheDocument();
      expect(screen.getByText('tournament')).toBeInTheDocument();
      expect(screen.getByText('casual')).toBeInTheDocument();
    });
  });

  it('should not display scenario section when not available', async () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: {
        overall: 75,
        byRole: { DON: 75, MAFIA: 75, SHERIFF: 0, CITIZEN: 0 },
        byScenario: undefined,
        winLossCounts: {
          overall: { wins: 3, losses: 1, total: 4 },
          byRole: {},
        },
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Win Rate by Scenario')
      ).not.toBeInTheDocument();
    });
  });

  it('should display comparison to average when available', async () => {
    mockUseWinRateAnalysis.mockReturnValue({
      data: {
        overall: 60,
        byRole: { DON: 60, MAFIA: 60, SHERIFF: 0, CITIZEN: 0 },
        comparisonToAverage: 10,
        winLossCounts: {
          overall: { wins: 6, losses: 4, total: 10 },
          byRole: {},
        },
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WinRateAnalysis playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/\+10.0% vs average/)).toBeInTheDocument();
    });
  });
});
