import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { PlayerCard } from '@/components/analytics/PlayerCard';
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

const mockPlayer = {
  id: 'player-1',
  name: 'John Doe',
  eloRating: 1500,
  totalGames: 100,
  wins: 65,
  losses: 35,
  club: {
    id: 'club-1',
    name: 'Test Club',
  },
  roleStats: [
    {
      role: 'MAFIA',
      gamesPlayed: 50,
      wins: 30,
      losses: 20,
      winRate: 60.0,
    },
    {
      role: 'CITIZEN',
      gamesPlayed: 30,
      wins: 20,
      losses: 10,
      winRate: 66.7,
    },
    {
      role: 'SHERIFF',
      gamesPlayed: 20,
      wins: 15,
      losses: 5,
      winRate: 75.0,
    },
  ],
};

const mockPlayerWithoutClub = {
  ...mockPlayer,
  club: null,
};

describe('PlayerCard', () => {
  it('renders player information correctly', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ELO: 1500')).toBeInTheDocument();
    expect(screen.getByText('Test Club')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Total games
    expect(screen.getAllByText('65.0%')[0]).toBeInTheDocument(); // Win rate
  });

  it('renders without club information', () => {
    renderWithProviders(<PlayerCard player={mockPlayerWithoutClub} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ELO: 1500')).toBeInTheDocument();
    expect(screen.queryByText('Test Club')).not.toBeInTheDocument();
  });

  it('displays role performance statistics', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    // Check for role badges
    expect(screen.getByText('MAFIA')).toBeInTheDocument();
    expect(screen.getByText('CITIZEN')).toBeInTheDocument();
    expect(screen.getByText('SHERIFF')).toBeInTheDocument();

    // Check for win rates
    expect(screen.getAllByText('60.0%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('66.7%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('75.0%')[0]).toBeInTheDocument();
  });

  it('calculates win rate correctly', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    // Win rate should be (65/100) * 100 = 65.0%
    expect(screen.getAllByText('65.0%')[0]).toBeInTheDocument();
  });

  it('handles zero games played', () => {
    const playerWithNoGames = {
      ...mockPlayer,
      totalGames: 0,
      wins: 0,
      losses: 0,
    };

    renderWithProviders(<PlayerCard player={playerWithNoGames} />);

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('calls onViewAnalytics when button is clicked', () => {
    const onViewAnalytics = vi.fn();
    renderWithProviders(
      <PlayerCard player={mockPlayer} onViewAnalytics={onViewAnalytics} />
    );

    const viewButton = screen.getByText('View Analytics');
    fireEvent.click(viewButton);

    expect(onViewAnalytics).toHaveBeenCalledWith('player-1');
  });

  it('does not render view analytics button when onViewAnalytics is not provided', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    expect(screen.queryByText('View Analytics')).not.toBeInTheDocument();
  });

  it('applies correct role colors', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    // Check for role-specific styling
    const mafiaBadge = screen.getByText('MAFIA');
    const citizenBadge = screen.getByText('CITIZEN');
    const sheriffBadge = screen.getByText('SHERIFF');

    expect(mafiaBadge).toHaveClass('bg-black');
    expect(citizenBadge).toHaveClass('bg-red-500');
    expect(sheriffBadge).toHaveClass('bg-yellow-400');
  });

  it('handles empty role stats', () => {
    const playerWithNoRoles = {
      ...mockPlayer,
      roleStats: [],
    };

    renderWithProviders(<PlayerCard player={playerWithNoRoles} />);

    expect(screen.getByText('Role Performance')).toBeInTheDocument();
    expect(screen.queryByText('MAFIA')).not.toBeInTheDocument();
  });

  it('displays all required statistics', () => {
    renderWithProviders(<PlayerCard player={mockPlayer} />);

    // Check for all stat labels
    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Role Performance')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    const playerWithLargeNumbers = {
      ...mockPlayer,
      eloRating: 2500,
      totalGames: 1000,
      wins: 750,
      losses: 250,
    };

    renderWithProviders(<PlayerCard player={playerWithLargeNumbers} />);

    expect(screen.getByText('ELO: 2500')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getAllByText('75.0%')[0]).toBeInTheDocument();
  });
});
