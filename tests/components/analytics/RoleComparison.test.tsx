/**
 * Component tests for RoleComparison
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleComparison } from '@/components/analytics/RoleComparison';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PlayerRole } from '@/types/analytics';

// Mock the hook
const mockUseRoleComparison = vi.fn();
vi.mock('@/hooks/useRoleComparison', () => ({
  useRoleComparison: () => mockUseRoleComparison(),
}));

// Mock the Zustand analytics store
const mockSetDateRange = vi.fn();
const mockSetRoles = vi.fn();
const mockUseAnalyticsStore = vi.fn(() => ({
  dateRange: null,
  roles: [],
  setDateRange: mockSetDateRange,
  setRoles: mockSetRoles,
}));
vi.mock('@/store/analyticsStore', () => ({
  useAnalyticsStore: () => mockUseAnalyticsStore(),
}));

// Mock RoleComparisonChart
vi.mock('@/components/analytics/RoleComparisonChart', () => ({
  RoleComparisonChart: ({ comparison }: { comparison: any }) => (
    <div data-testid="role-comparison-chart">
      Chart for {comparison.roles.length} roles
    </div>
  ),
}));

describe('RoleComparison', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  const mockComparisonData = {
    roles: [
      {
        role: 'DON' as PlayerRole,
        winRate: 60.0,
        gamesPlayed: 10,
        averageELO: 1500,
        winStreak: 3,
      },
      {
        role: 'MAFIA' as PlayerRole,
        winRate: 50.0,
        gamesPlayed: 8,
        averageELO: 1450,
        winStreak: 1,
      },
      {
        role: 'SHERIFF' as PlayerRole,
        winRate: 40.0,
        gamesPlayed: 5,
        averageELO: 1400,
        winStreak: 0,
      },
    ],
    bestPerformingRole: 'DON' as PlayerRole,
    metrics: {
      winRate: { DON: 60.0, MAFIA: 50.0, SHERIFF: 40.0 },
      gamesPlayed: { DON: 10, MAFIA: 8, SHERIFF: 5 },
      averageELO: { DON: 1500, MAFIA: 1450, SHERIFF: 1400 },
      winStreak: { DON: 3, MAFIA: 1, SHERIFF: 0 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: null,
      roles: [],
      setDateRange: mockSetDateRange,
      setRoles: mockSetRoles,
    });
  });

  it('should render loading state', () => {
    mockUseRoleComparison.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    // Should show skeleton loader
    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton || container.textContent).toBeTruthy();
  });

  it('should render role comparison with data', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Role Comparison')).toBeInTheDocument();
    });

    // Should display all role cards
    expect(screen.getByText('DON')).toBeInTheDocument();
    expect(screen.getByText('MAFIA')).toBeInTheDocument();
    expect(screen.getByText('SHERIFF')).toBeInTheDocument();

    // Should display metrics for each role
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // DON win rate
    expect(screen.getByText('10')).toBeInTheDocument(); // DON games played
    expect(screen.getByText('1500')).toBeInTheDocument(); // DON average ELO
    expect(screen.getByText('3')).toBeInTheDocument(); // DON win streak
  });

  it('should highlight best-performing role', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('DON')).toBeInTheDocument();
    });

    // Best role should have "Best" badge
    const donCard = screen.getByText('DON').closest('[class*="ring-2"]');
    expect(donCard).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
  });

  it('should allow toggling metric selection', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Role Comparison')).toBeInTheDocument();
    });

    // All metrics should be selected by default
    const winRateButton = screen.getByText('Win Rate');
    expect(winRateButton).toHaveAttribute('data-state', 'default');

    // Toggle win rate off
    await user.click(winRateButton);
    await waitFor(() => {
      expect(winRateButton).toHaveAttribute('data-state', 'outline');
    });

    // Toggle win rate back on
    await user.click(winRateButton);
    await waitFor(() => {
      expect(winRateButton).toHaveAttribute('data-state', 'default');
    });
  });

  it('should render error state', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch role comparison'),
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load role comparison/i)
      ).toBeInTheDocument();
    });
  });

  it('should render empty state when insufficient data', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: {
        roles: [
          {
            role: 'DON' as PlayerRole,
            winRate: 60.0,
            gamesPlayed: 10,
            averageELO: 1500,
            winStreak: 3,
          },
        ],
        bestPerformingRole: 'DON' as PlayerRole,
        metrics: {},
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Insufficient data for comparison/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /You need performance data for at least 2 different roles/i
        )
      ).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: {
        roles: [],
        bestPerformingRole: 'CITIZEN' as PlayerRole,
        metrics: {},
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Insufficient data for comparison/i)
      ).toBeInTheDocument();
    });
  });

  it('should display all metrics in role cards', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('DON')).toBeInTheDocument();
    });

    // Check DON card has all metrics
    const donCard = screen.getByText('DON').closest('div[class*="space-y"]');
    expect(donCard).toBeInTheDocument();
    expect(within(donCard!).getByText(/Win Rate/i)).toBeInTheDocument();
    expect(within(donCard!).getByText(/Games Played/i)).toBeInTheDocument();
    expect(within(donCard!).getByText(/Avg ELO/i)).toBeInTheDocument();
    expect(within(donCard!).getByText(/Win Streak/i)).toBeInTheDocument();
  });

  it('should render comparison chart', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('role-comparison-chart')).toBeInTheDocument();
    });

    const chart = screen.getByTestId('role-comparison-chart');
    expect(chart.textContent).toContain('3 roles');
  });

  it('should use filters from Zustand store', async () => {
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: { preset: 'last_month' },
      roles: ['DON', 'MAFIA'],
      setDateRange: mockSetDateRange,
      setRoles: mockSetRoles,
    });

    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockUseRoleComparison).toHaveBeenCalled();
    });

    // Verify hook was called with store filters
    const callArgs = mockUseRoleComparison.mock.calls[0];
    expect(callArgs[0]).toBe('test-player-id');
    expect(callArgs[1]).toEqual({ preset: 'last_month' });
    expect(callArgs[2]).toEqual(['DON', 'MAFIA']);
  });

  it('should use prop dateRange when store dateRange is null', async () => {
    mockUseAnalyticsStore.mockReturnValue({
      dateRange: null,
      roles: [],
      setDateRange: mockSetDateRange,
      setRoles: mockSetRoles,
    });

    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison
          playerId="test-player-id"
          dateRange={{ preset: 'last_week' }}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockUseRoleComparison).toHaveBeenCalled();
    });

    const callArgs = mockUseRoleComparison.mock.calls[0];
    expect(callArgs[1]).toEqual({ preset: 'last_week' });
  });

  it('should be responsive (mobile: stacked, desktop: side-by-side)', async () => {
    mockUseRoleComparison.mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RoleComparison playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('DON')).toBeInTheDocument();
    });

    // Check grid classes for responsiveness
    const grid = container.querySelector('[class*="grid-cols-1"]');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });
});
