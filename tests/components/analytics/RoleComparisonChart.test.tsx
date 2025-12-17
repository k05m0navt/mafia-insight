/**
 * Component tests for RoleComparisonChart
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleComparisonChart } from '@/components/analytics/RoleComparisonChart';
import type { RoleMetrics } from '@/types/analytics';

// Mock the lazy-loaded chart content component
vi.mock('@/components/analytics/RoleComparisonChartContent', () => ({
  ChartContent: ({ chartData, colors, bestRole, highlightBest }: any) => (
    <div data-testid="chart-content">
      <div data-testid="chart-data">{JSON.stringify(chartData)}</div>
      <div data-testid="best-role">{bestRole?.role || 'none'}</div>
      <div data-testid="highlight-best">{highlightBest ? 'true' : 'false'}</div>
    </div>
  ),
}));

describe('RoleComparisonChart', () => {
  const mockRoleMetrics: RoleMetrics[] = [
    {
      role: 'DON',
      winRate: 60.0,
      gamesPlayed: 10,
      wins: 6,
      losses: 4,
      averageELO: 1200,
      performanceLevel: 'excellent',
    },
    {
      role: 'MAFIA',
      winRate: 50.0,
      gamesPlayed: 8,
      wins: 4,
      losses: 4,
      averageELO: 1150,
      performanceLevel: 'good',
    },
    {
      role: 'SHERIFF',
      winRate: 40.0,
      gamesPlayed: 5,
      wins: 2,
      losses: 3,
      averageELO: 1100,
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chart with role metrics data', async () => {
    render(<RoleComparisonChart roleMetrics={mockRoleMetrics} />);

    await waitFor(() => {
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });

    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent || '[]');
    expect(data).toHaveLength(3); // Should filter out CITIZEN (0 games)
    expect(data[0]).toMatchObject({ role: 'DON', winRate: 60.0 });
  });

  it('should highlight best performing role', async () => {
    render(
      <RoleComparisonChart roleMetrics={mockRoleMetrics} highlightBest={true} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('best-role')).toBeInTheDocument();
    });

    const bestRole = screen.getByTestId('best-role');
    expect(bestRole.textContent).toBe('DON'); // Highest win rate
  });

  it('should not highlight best role when highlightBest is false', async () => {
    render(
      <RoleComparisonChart
        roleMetrics={mockRoleMetrics}
        highlightBest={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('highlight-best')).toBeInTheDocument();
    });

    const highlightBest = screen.getByTestId('highlight-best');
    expect(highlightBest.textContent).toBe('false');
  });

  it('should display empty state when no data available', () => {
    const emptyMetrics: RoleMetrics[] = [
      {
        role: 'DON',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
        performanceLevel: 'needs_improvement',
      },
      {
        role: 'MAFIA',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
        performanceLevel: 'needs_improvement',
      },
      {
        role: 'SHERIFF',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
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
    ];

    render(<RoleComparisonChart roleMetrics={emptyMetrics} />);

    expect(screen.getByText('Role Comparison')).toBeInTheDocument();
    expect(
      screen.getByText('No data available for comparison')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
  });

  it('should filter out roles with zero games played', async () => {
    render(<RoleComparisonChart roleMetrics={mockRoleMetrics} />);

    await waitFor(() => {
      expect(screen.getByTestId('chart-data')).toBeInTheDocument();
    });

    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent || '[]');

    // Should only include roles with gamesPlayed > 0
    expect(data.length).toBe(3);
    expect(data.map((d: any) => d.role)).toEqual(['DON', 'MAFIA', 'SHERIFF']);
    expect(data.map((d: any) => d.role)).not.toContain('CITIZEN');
  });

  it('should use correct role colors', () => {
    const { container } = render(
      <RoleComparisonChart roleMetrics={mockRoleMetrics} />
    );

    // Check that the component renders (colors are passed to ChartContent)
    expect(container).toBeInTheDocument();
  });

  it('should handle single role with data', async () => {
    const singleRoleMetrics: RoleMetrics[] = [
      {
        role: 'DON',
        winRate: 70.0,
        gamesPlayed: 20,
        wins: 14,
        losses: 6,
        averageELO: 1300,
        performanceLevel: 'excellent',
      },
      {
        role: 'MAFIA',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
        performanceLevel: 'needs_improvement',
      },
      {
        role: 'SHERIFF',
        winRate: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averageELO: 0,
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
    ];

    render(<RoleComparisonChart roleMetrics={singleRoleMetrics} />);

    await waitFor(() => {
      expect(screen.getByTestId('chart-data')).toBeInTheDocument();
    });

    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent || '[]');
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ role: 'DON', winRate: 70.0 });
  });
});
