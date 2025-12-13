import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PublicStatistics } from '@/components/public/PublicStatistics';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PublicStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton initially', () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves to keep loading state
        })
    );

    const { container } = render(<PublicStatistics />);

    expect(screen.getByText('Community Statistics')).toBeInTheDocument();
    // Check for skeleton elements (Skeleton component uses animate-pulse class)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render statistics data when fetch succeeds', async () => {
    const mockData = {
      totalPlayers: 1234,
      totalGames: 5678,
      totalTournaments: 90,
      totalClubs: 45,
      averageEloRating: 1250,
      totalWins: 3000,
      totalLosses: 2678,
      lastUpdated: '2025-01-27T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Community Statistics')).toBeInTheDocument();
    });

    // Check that statistics are displayed
    expect(screen.getByText('Total Players')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument(); // Formatted number

    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('5,678')).toBeInTheDocument();

    expect(screen.getByText('Tournaments')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();

    expect(screen.getByText('Clubs')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    expect(screen.getByText('Average ELO')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('should render error message when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(
        screen.getByText(/Network error.*Please try again later/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Community Statistics')).toBeInTheDocument();
  });

  it('should render error message when API returns error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch public statistics.*Please try again later/i)
      ).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    );

    const { container } = render(<PublicStatistics className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should display last updated timestamp when available', async () => {
    const mockData = {
      totalPlayers: 100,
      totalGames: 200,
      totalTournaments: 10,
      totalClubs: 5,
      averageEloRating: 1200,
      totalWins: 100,
      totalLosses: 100,
      lastUpdated: '2025-01-27T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  it('should format numbers with commas correctly', async () => {
    const mockData = {
      totalPlayers: 1234567,
      totalGames: 9876543,
      totalTournaments: 12345,
      totalClubs: 6789,
      averageEloRating: 1500,
      totalWins: 5000,
      totalLosses: 5000,
      lastUpdated: '2025-01-27T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('9,876,543')).toBeInTheDocument();
      expect(screen.getByText('12,345')).toBeInTheDocument();
      expect(screen.getByText('6,789')).toBeInTheDocument();
    });
  });

  it('should render all statistics cards with icons', async () => {
    const mockData = {
      totalPlayers: 100,
      totalGames: 200,
      totalTournaments: 10,
      totalClubs: 5,
      averageEloRating: 1200,
      totalWins: 100,
      totalLosses: 100,
      lastUpdated: '2025-01-27T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      // Check all statistic titles are present
      expect(screen.getByText('Total Players')).toBeInTheDocument();
      expect(screen.getByText('Total Games')).toBeInTheDocument();
      expect(screen.getByText('Tournaments')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();
      expect(screen.getByText('Average ELO')).toBeInTheDocument();
    });

    // Check that icons are rendered (they have aria-hidden="true")
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(5); // At least 5 icons (one per stat)
  });

  it('should render descriptions for each statistic', async () => {
    const mockData = {
      totalPlayers: 100,
      totalGames: 200,
      totalTournaments: 10,
      totalClubs: 5,
      averageEloRating: 1200,
      totalWins: 100,
      totalLosses: 100,
      lastUpdated: '2025-01-27T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(screen.getByText('Registered players')).toBeInTheDocument();
      expect(screen.getByText('Completed games')).toBeInTheDocument();
      expect(screen.getByText('Tournaments hosted')).toBeInTheDocument();
      expect(screen.getByText('Active clubs')).toBeInTheDocument();
      expect(screen.getByText('Community average')).toBeInTheDocument();
    });
  });

  it('should handle component unmount before fetch completes', async () => {
    let resolvePromise: ((value: any) => void) | null = null;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise);

    const { unmount } = render(<PublicStatistics />);

    // Unmount before fetch completes
    unmount();

    // Resolve the promise after unmount
    if (resolvePromise) {
      resolvePromise({
        ok: true,
        json: async () => ({ totalPlayers: 100 }),
      });
    }

    // Wait a bit to ensure no state updates occur
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Component should be unmounted, no errors should occur
    expect(screen.queryByText('Community Statistics')).not.toBeInTheDocument();
  });

  it('should fetch data from correct API endpoint', async () => {
    const mockData = {
      totalPlayers: 100,
      totalGames: 200,
      totalTournaments: 10,
      totalClubs: 5,
      averageEloRating: 1200,
      totalWins: 100,
      totalLosses: 100,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<PublicStatistics />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/public/statistics');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should render responsive grid layout', async () => {
    const mockData = {
      totalPlayers: 100,
      totalGames: 200,
      totalTournaments: 10,
      totalClubs: 5,
      averageEloRating: 1200,
      totalWins: 100,
      totalLosses: 100,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { container } = render(<PublicStatistics />);

    await waitFor(() => {
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-5');
    });
  });
});
