import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClubCard } from '@/components/analytics/ClubCard';

const mockClub = {
  id: 'club-1',
  name: 'Test Club',
  description: 'A test club for mafia games',
  logoUrl: 'https://example.com/logo.png',
  creator: {
    id: 'creator-1',
    name: 'John Creator',
    email: 'john@example.com',
  },
  players: [
    {
      id: 'player-1',
      name: 'Alice',
      eloRating: 1600,
      totalGames: 50,
      wins: 35,
      losses: 15,
    },
    {
      id: 'player-2',
      name: 'Bob',
      eloRating: 1400,
      totalGames: 30,
      wins: 20,
      losses: 10,
    },
    {
      id: 'player-3',
      name: 'Charlie',
      eloRating: 1500,
      totalGames: 40,
      wins: 25,
      losses: 15,
    },
  ],
  _count: {
    players: 3,
  },
};

const mockClubWithoutDescription = {
  ...mockClub,
  description: undefined,
};

const mockClubWithNoPlayers = {
  ...mockClub,
  players: [],
  _count: {
    players: 0,
  },
};

describe('ClubCard', () => {
  it('renders club information correctly', () => {
    render(<ClubCard club={mockClub} />);

    expect(screen.getByText('Test Club')).toBeInTheDocument();
    expect(screen.getByText('A test club for mafia games')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText('Avg ELO: 1500')).toBeInTheDocument();
    expect(screen.getByText('John Creator')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<ClubCard club={mockClubWithoutDescription} />);

    expect(screen.getByText('Test Club')).toBeInTheDocument();
    expect(
      screen.queryByText('A test club for mafia games')
    ).not.toBeInTheDocument();
  });

  it('calculates total games correctly', () => {
    render(<ClubCard club={mockClub} />);

    // Total games: 50 + 30 + 40 = 120
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('calculates win rate correctly', () => {
    render(<ClubCard club={mockClub} />);

    // Total wins: 35 + 20 + 25 = 80
    // Total games: 120
    // Win rate: (80/120) * 100 = 66.7%
    expect(screen.getByText('66.7%')).toBeInTheDocument();
  });

  it('calculates average ELO correctly', () => {
    render(<ClubCard club={mockClub} />);

    // Average ELO: (1600 + 1400 + 1500) / 3 = 1500
    expect(screen.getByText('Avg ELO: 1500')).toBeInTheDocument();
  });

  it('displays top performers sorted by ELO', () => {
    render(<ClubCard club={mockClub} />);

    // Should be sorted by ELO (highest first)
    const performerNames = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(performerNames[0]).toHaveTextContent('Alice'); // 1600 ELO
    expect(performerNames[1]).toHaveTextContent('Charlie'); // 1500 ELO
    expect(performerNames[2]).toHaveTextContent('Bob'); // 1400 ELO
  });

  it('shows only top 3 performers', () => {
    const clubWithManyPlayers = {
      ...mockClub,
      players: [
        ...mockClub.players,
        {
          id: 'player-4',
          name: 'David',
          eloRating: 1300,
          totalGames: 20,
          wins: 10,
          losses: 10,
        },
        {
          id: 'player-5',
          name: 'Eve',
          eloRating: 1200,
          totalGames: 15,
          wins: 8,
          losses: 7,
        },
      ],
      _count: { players: 5 },
    };

    render(<ClubCard club={clubWithManyPlayers} />);

    // Should only show top 3 performers
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('David')).not.toBeInTheDocument();
    expect(screen.queryByText('Eve')).not.toBeInTheDocument();
  });

  it('handles empty players list', () => {
    render(<ClubCard club={mockClubWithNoPlayers} />);

    expect(screen.getByText('0 members')).toBeInTheDocument();
    expect(screen.getByText('Avg ELO: 0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Total games
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win rate
    expect(screen.queryByText('Top Performers')).toBeInTheDocument();
  });

  it('calls onViewAnalytics when button is clicked', () => {
    const onViewAnalytics = jest.fn();
    render(<ClubCard club={mockClub} onViewAnalytics={onViewAnalytics} />);

    const viewButton = screen.getByText('View Analytics');
    fireEvent.click(viewButton);

    expect(onViewAnalytics).toHaveBeenCalledWith('club-1');
  });

  it('does not render view analytics button when onViewAnalytics is not provided', () => {
    render(<ClubCard club={mockClub} />);

    expect(screen.queryByText('View Analytics')).not.toBeInTheDocument();
  });

  it('displays player statistics for each performer', () => {
    render(<ClubCard club={mockClub} />);

    // Check for ELO and games for each performer
    expect(screen.getByText('ELO: 1600')).toBeInTheDocument();
    expect(screen.getByText('50 games')).toBeInTheDocument();
    expect(screen.getByText('ELO: 1500')).toBeInTheDocument();
    expect(screen.getByText('40 games')).toBeInTheDocument();
    expect(screen.getByText('ELO: 1400')).toBeInTheDocument();
    expect(screen.getByText('30 games')).toBeInTheDocument();
  });

  it('handles zero total games', () => {
    const clubWithNoGames = {
      ...mockClub,
      players: [
        {
          id: 'player-1',
          name: 'Alice',
          eloRating: 1600,
          totalGames: 0,
          wins: 0,
          losses: 0,
        },
      ],
    };

    render(<ClubCard club={clubWithNoGames} />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Total games
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win rate
  });

  it('displays all required sections', () => {
    render(<ClubCard club={mockClub} />);

    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Top Performers')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    const clubWithLargeNumbers = {
      ...mockClub,
      players: [
        {
          id: 'player-1',
          name: 'Alice',
          eloRating: 2500,
          totalGames: 1000,
          wins: 750,
          losses: 250,
        },
      ],
      _count: { players: 1 },
    };

    render(<ClubCard club={clubWithLargeNumbers} />);

    expect(screen.getByText('1 members')).toBeInTheDocument();
    expect(screen.getByText('Avg ELO: 2500')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });
});
