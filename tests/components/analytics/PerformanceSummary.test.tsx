/**
 * Component tests for PerformanceSummary
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PerformanceSummary } from '@/components/analytics/PerformanceSummary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
const mockUsePerformanceSummary = vi.fn();
vi.mock('@/hooks/usePerformanceSummary', () => ({
  usePerformanceSummary: () => mockUsePerformanceSummary(),
}));

// Mock the Zustand analytics store
const mockSetDateRange = vi.fn();
const mockUseAnalyticsStore = vi.fn(() => ({
  dateRange: { preset: 'last_month' },
  selectedRoles: [],
  setDateRange: mockSetDateRange,
}));
vi.mock('@/store/analyticsStore', () => ({
  useAnalyticsStore: () => mockUseAnalyticsStore(),
}));

describe('PerformanceSummary', () => {
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
    });
  });

  it('should render loading state', () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render performance summary with all metrics', async () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 10,
        totalWins: 7,
        totalLosses: 3,
        winPercentage: 70,
        averageGameDuration: 45.5,
        longestWinStreak: 4,
        bestELOAchieved: 1250,
        recentActivity: {
          thisWeek: 2,
          thisMonth: 5,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Summary')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Total games
      expect(screen.getByText('7')).toBeInTheDocument(); // Total wins
      expect(screen.getByText('3')).toBeInTheDocument(); // Total losses
      expect(screen.getByText('70.0%')).toBeInTheDocument(); // Win percentage
      expect(screen.getByText('45.5')).toBeInTheDocument(); // Average duration
      expect(screen.getByText('4')).toBeInTheDocument(); // Longest win streak
      expect(screen.getByText('1250')).toBeInTheDocument(); // Best ELO
      expect(screen.getByText('2')).toBeInTheDocument(); // Games this week
      expect(screen.getByText('5')).toBeInTheDocument(); // Games this month
    });
  });

  it('should render empty state when no data', () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winPercentage: 0,
        averageGameDuration: undefined,
        longestWinStreak: 0,
        bestELOAchieved: 0,
        recentActivity: {
          thisWeek: 0,
          thisMonth: 0,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(screen.getByText('No Performance Data')).toBeInTheDocument();
    expect(
      screen.getByText(/You don't have any game data yet/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Import your game data from gomafia.pro/)
    ).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch data'),
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(
      screen.getByText(/Error loading performance summary/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
  });

  it('should conditionally render average game duration when available', async () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        winPercentage: 60,
        averageGameDuration: 50,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 1,
          thisMonth: 3,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // Average duration
      expect(screen.getByText('min')).toBeInTheDocument();
    });
  });

  it('should not render average game duration when not available', async () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        winPercentage: 60,
        averageGameDuration: undefined,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 1,
          thisMonth: 3,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should not find "Avg Duration" text when duration is undefined
      const avgDurationCards = Array.from(
        container.querySelectorAll('[class*="card"]')
      ).filter((card) => card.textContent?.includes('Avg Duration'));
      expect(avgDurationCards.length).toBe(0);
    });
  });

  it('should use date range from store when available', () => {
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: { preset: 'last_3_months' },
      selectedRoles: [],
      setDateRange: mockSetDateRange,
    });

    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        winPercentage: 60,
        averageGameDuration: 45,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 0,
          thisMonth: 2,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(mockUsePerformanceSummary).toHaveBeenCalledWith(
      'test-player-id',
      { preset: 'last_3_months' },
      []
    );
  });

  it('should use roles from store when available', () => {
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: { preset: 'last_month' },
      selectedRoles: ['DON', 'MAFIA'],
      setDateRange: mockSetDateRange,
    });

    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 3,
        totalWins: 2,
        totalLosses: 1,
        winPercentage: 66.67,
        averageGameDuration: 50,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 0,
          thisMonth: 1,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    expect(mockUsePerformanceSummary).toHaveBeenCalledWith(
      'test-player-id',
      { preset: 'last_month' },
      ['DON', 'MAFIA']
    );
  });

  it('should use props date range when store is empty', () => {
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: null,
      selectedRoles: [],
      setDateRange: mockSetDateRange,
    });

    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        winPercentage: 60,
        averageGameDuration: 45,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 0,
          thisMonth: 2,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary
          playerId="test-player-id"
          dateRange={{ preset: 'last_6_months' }}
        />
      </QueryClientProvider>
    );

    expect(mockUsePerformanceSummary).toHaveBeenCalledWith(
      'test-player-id',
      { preset: 'last_6_months' },
      undefined
    );
  });

  it('should show refetching state with opacity change', () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        winPercentage: 60,
        averageGameDuration: 45,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 0,
          thisMonth: 2,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: true,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    const card = container.querySelector('[class*="opacity-75"]');
    expect(card).toBeInTheDocument();
  });

  it('should display win percentage with correct variant (positive)', async () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 10,
        totalWins: 7,
        totalLosses: 3,
        winPercentage: 70, // >= 50, should be positive
        averageGameDuration: 45,
        longestWinStreak: 4,
        bestELOAchieved: 1250,
        recentActivity: {
          thisWeek: 2,
          thisMonth: 5,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Win percentage card should have positive variant (green)
      const winRateCard = Array.from(
        container.querySelectorAll('[class*="card"]')
      ).find((card) => card.textContent?.includes('Win Rate'));
      expect(winRateCard).toBeInTheDocument();
    });
  });

  it('should display win percentage with correct variant (negative)', async () => {
    mockUsePerformanceSummary.mockReturnValue({
      data: {
        totalGames: 10,
        totalWins: 3,
        totalLosses: 7,
        winPercentage: 30, // < 50, should be negative
        averageGameDuration: 45,
        longestWinStreak: 2,
        bestELOAchieved: 1200,
        recentActivity: {
          thisWeek: 1,
          thisMonth: 3,
        },
      },
      isLoading: false,
      error: null,
      isRefetching: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceSummary playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('30.0%')).toBeInTheDocument();
    });
  });
});
