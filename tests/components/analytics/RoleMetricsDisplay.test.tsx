/**
 * Component tests for RoleMetricsDisplay
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleMetricsDisplay } from '@/components/analytics/RoleMetricsDisplay';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
vi.mock('@/hooks/useRoleBasedAnalytics', () => ({
  useRoleBasedAnalytics: vi.fn(),
}));

describe('RoleMetricsDisplay', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  it('should render loading state', () => {
    const { useRoleBasedAnalytics } = require('@/hooks/useRoleBasedAnalytics');
    useRoleBasedAnalytics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleMetricsDisplay playerId="test-player-id" />
      </QueryClientProvider>
    );

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton|loading/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render role metrics cards', async () => {
    const { useRoleBasedAnalytics } = require('@/hooks/useRoleBasedAnalytics');
    useRoleBasedAnalytics.mockReturnValue({
      data: {
        roleMetrics: [
          {
            role: 'DON',
            winRate: 70,
            gamesPlayed: 10,
            wins: 7,
            losses: 3,
            averageELO: 1250,
            performanceLevel: 'excellent',
          },
          {
            role: 'MAFIA',
            winRate: 50,
            gamesPlayed: 8,
            wins: 4,
            losses: 4,
            averageELO: 1200,
            performanceLevel: 'good',
          },
          {
            role: 'SHERIFF',
            winRate: 40,
            gamesPlayed: 5,
            wins: 2,
            losses: 3,
            averageELO: 1200,
            performanceLevel: 'needs_improvement',
          },
          {
            role: 'CITIZEN',
            winRate: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            averageELO: 0,
            performanceLevel: 'needs_improvement',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleMetricsDisplay playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('DON')).toBeInTheDocument();
      expect(screen.getByText('MAFIA')).toBeInTheDocument();
      expect(screen.getByText('SHERIFF')).toBeInTheDocument();
      expect(screen.getByText('CITIZEN')).toBeInTheDocument();
    });

    // Check metrics are displayed
    expect(screen.getByText('70.0%')).toBeInTheDocument(); // DON win rate
    expect(screen.getByText('10')).toBeInTheDocument(); // DON games played
  });

  it('should render error state', async () => {
    const { useRoleBasedAnalytics } = require('@/hooks/useRoleBasedAnalytics');
    useRoleBasedAnalytics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch data'),
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleMetricsDisplay playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load role metrics/i)
      ).toBeInTheDocument();
    });
  });

  it('should render empty state for roles with no data', async () => {
    const { useRoleBasedAnalytics } = require('@/hooks/useRoleBasedAnalytics');
    useRoleBasedAnalytics.mockReturnValue({
      data: {
        roleMetrics: [
          {
            role: 'CITIZEN',
            winRate: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            averageELO: 0,
            performanceLevel: 'needs_improvement',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleMetricsDisplay playerId="test-player-id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No data available for this role/i)
      ).toBeInTheDocument();
    });
  });
});
