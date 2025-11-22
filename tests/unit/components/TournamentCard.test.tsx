import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { TournamentCard } from '@/components/analytics/TournamentCard';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
  });
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>);

const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  description: 'A test tournament for mafia games',
  startDate: '2024-01-15T10:00:00Z',
  endDate: '2024-01-20T18:00:00Z',
  status: 'COMPLETED',
  maxParticipants: 16,
  entryFee: 10,
  prizePool: 150,
  creator: {
    id: 'creator-1',
    name: 'John Creator',
    email: 'john@example.com',
  },
  games: [
    {
      id: 'game-1',
      date: '2024-01-15T10:00:00Z',
      status: 'COMPLETED',
      winnerTeam: 'Mafia',
    },
    {
      id: 'game-2',
      date: '2024-01-16T10:00:00Z',
      status: 'COMPLETED',
      winnerTeam: 'Citizens',
    },
    {
      id: 'game-3',
      date: '2024-01-17T10:00:00Z',
      status: 'IN_PROGRESS',
    },
  ],
  _count: {
    games: 3,
  },
};

const mockLiveTournament = {
  ...mockTournament,
  id: 'tournament-2',
  name: 'Live Tournament',
  status: 'IN_PROGRESS',
  endDate: undefined,
};

const mockScheduledTournament = {
  ...mockTournament,
  id: 'tournament-3',
  name: 'Scheduled Tournament',
  status: 'SCHEDULED',
  endDate: undefined,
  entryFee: undefined,
  prizePool: undefined,
};

describe('TournamentCard', () => {
  it('renders tournament information correctly', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(
      screen.getByText('A test tournament for mafia games')
    ).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('John Creator')).toBeInTheDocument();
  });

  it('displays formatted start date', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('displays formatted end date when available', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument();
  });

  it('does not display end date when not available', () => {
    renderWithProviders(<TournamentCard tournament={mockLiveTournament} />);

    expect(screen.queryByText('End Date')).not.toBeInTheDocument();
  });

  it('calculates games played correctly', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    // 2 completed games out of 3 total
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('displays entry fee and prize pool when available', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('$10.00')).toBeInTheDocument(); // Entry fee
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Prize pool
  });

  it('does not display entry fee and prize pool when not available', () => {
    renderWithProviders(
      <TournamentCard tournament={mockScheduledTournament} />
    );

    expect(screen.queryByText('Entry Fee')).not.toBeInTheDocument();
    expect(screen.queryByText('Prize Pool')).not.toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { rerender } = renderWithProviders(
      <TournamentCard tournament={mockTournament} />
    );

    // COMPLETED should have green background
    const completedBadge = screen.getByText('COMPLETED');
    expect(completedBadge).toHaveClass('bg-green-500');

    // Test IN_PROGRESS status
    rerender(
      <ThemeProvider defaultTheme="light">
        <TournamentCard tournament={mockLiveTournament} />
      </ThemeProvider>
    );
    const inProgressBadge = screen.getByText('IN PROGRESS');
    expect(inProgressBadge).toHaveClass('bg-yellow-500');

    // Test SCHEDULED status
    rerender(
      <ThemeProvider defaultTheme="light">
        <TournamentCard tournament={mockScheduledTournament} />
      </ThemeProvider>
    );
    const scheduledBadge = screen.getByText('SCHEDULED');
    expect(scheduledBadge).toHaveClass('bg-blue-500');
  });

  it('shows LIVE badge for in-progress tournaments', () => {
    renderWithProviders(<TournamentCard tournament={mockLiveTournament} />);

    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toHaveClass('animate-pulse');
  });

  it('does not show LIVE badge for non-live tournaments', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('calls onViewAnalytics when button is clicked', () => {
    const onViewAnalytics = vi.fn();
    renderWithProviders(
      <TournamentCard
        tournament={mockTournament}
        onViewAnalytics={onViewAnalytics}
      />
    );

    const viewButton = screen.getByText('View Analytics');
    fireEvent.click(viewButton);

    expect(onViewAnalytics).toHaveBeenCalledWith('tournament-1');
  });

  it('shows different button text for live tournaments', () => {
    const onViewAnalytics = vi.fn();
    renderWithProviders(
      <TournamentCard
        tournament={mockLiveTournament}
        onViewAnalytics={onViewAnalytics}
      />
    );

    expect(screen.getByText('View Live Updates')).toBeInTheDocument();
  });

  it('does not render view analytics button when onViewAnalytics is not provided', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.queryByText('View Analytics')).not.toBeInTheDocument();
  });

  it('handles tournaments without description', () => {
    const tournamentWithoutDescription = {
      ...mockTournament,
      description: undefined,
    };

    renderWithProviders(
      <TournamentCard tournament={tournamentWithoutDescription} />
    );

    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(
      screen.queryByText('A test tournament for mafia games')
    ).not.toBeInTheDocument();
  });

  it('handles zero games played', () => {
    const tournamentWithNoGames = {
      ...mockTournament,
      games: [],
      _count: { games: 0 },
    };

    renderWithProviders(<TournamentCard tournament={tournamentWithNoGames} />);

    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });

  it('handles all games in progress', () => {
    const tournamentWithInProgressGames = {
      ...mockTournament,
      games: [
        { id: 'game-1', date: '2024-01-15T10:00:00Z', status: 'IN_PROGRESS' },
        { id: 'game-2', date: '2024-01-16T10:00:00Z', status: 'IN_PROGRESS' },
      ],
      _count: { games: 2 },
    };

    renderWithProviders(
      <TournamentCard tournament={tournamentWithInProgressGames} />
    );

    expect(screen.getByText('0 / 2')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const tournamentWithLargeAmounts = {
      ...mockTournament,
      entryFee: 1000,
      prizePool: 10000,
    };

    renderWithProviders(
      <TournamentCard tournament={tournamentWithLargeAmounts} />
    );

    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    const tournamentWithUnknownStatus = {
      ...mockTournament,
      status: 'UNKNOWN_STATUS',
    };

    renderWithProviders(
      <TournamentCard tournament={tournamentWithUnknownStatus} />
    );

    expect(screen.getByText('UNKNOWN STATUS')).toBeInTheDocument();
    // Should use default gray color
    const badge = screen.getByText('UNKNOWN STATUS');
    expect(badge).toHaveClass('bg-gray-500');
  });

  it('displays all required sections', () => {
    renderWithProviders(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
  });
});
