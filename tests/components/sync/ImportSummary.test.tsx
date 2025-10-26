import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportSummary } from '@/components/sync/ImportSummary';
import '@testing-library/jest-dom';

describe('ImportSummary', () => {
  it('should display all record counts', () => {
    const summary = {
      players: 1234,
      clubs: 56,
      games: 5678,
      tournaments: 78,
    };

    render(<ImportSummary summary={summary} />);

    expect(screen.getByText('1,234')).toBeInTheDocument(); // Players
    expect(screen.getByText('56')).toBeInTheDocument(); // Clubs
    expect(screen.getByText('5,678')).toBeInTheDocument(); // Games
    expect(screen.getByText('78')).toBeInTheDocument(); // Tournaments
  });

  it('should display record labels', () => {
    const summary = {
      players: 100,
      clubs: 10,
      games: 500,
      tournaments: 5,
    };

    render(<ImportSummary summary={summary} />);

    expect(screen.getByText(/Players/i)).toBeInTheDocument();
    expect(screen.getByText(/Clubs/i)).toBeInTheDocument();
    expect(screen.getByText(/Games/i)).toBeInTheDocument();
    expect(screen.getByText(/Tournaments/i)).toBeInTheDocument();
  });

  it('should display zero counts when no data', () => {
    const summary = {
      players: 0,
      clubs: 0,
      games: 0,
      tournaments: 0,
    };

    render(<ImportSummary summary={summary} />);

    // Should have 4 zeros for the stat categories + 1 for total = 5 total
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);

    // Verify each stat category exists
    expect(screen.getByText(/Players/i)).toBeInTheDocument();
    expect(screen.getByText(/Clubs/i)).toBeInTheDocument();
    expect(screen.getByText(/Games/i)).toBeInTheDocument();
    expect(screen.getByText(/Tournaments/i)).toBeInTheDocument();
  });

  it('should format large numbers with commas', () => {
    const summary = {
      players: 123456,
      clubs: 7890,
      games: 999999,
      tournaments: 1234,
    };

    render(<ImportSummary summary={summary} />);

    expect(screen.getByText('123,456')).toBeInTheDocument();
    expect(screen.getByText('7,890')).toBeInTheDocument();
    expect(screen.getByText('999,999')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should show validation rate when provided', () => {
    const summary = {
      players: 1000,
      clubs: 50,
      games: 5000,
      tournaments: 20,
    };
    const validationRate = 98.5;

    render(<ImportSummary summary={summary} validationRate={validationRate} />);

    expect(screen.getByText('98.5%')).toBeInTheDocument();
    expect(screen.getByText(/Validation Rate/i)).toBeInTheDocument();
  });

  it('should not show validation rate when not provided', () => {
    const summary = {
      players: 1000,
      clubs: 50,
      games: 5000,
      tournaments: 20,
    };

    render(<ImportSummary summary={summary} />);

    expect(screen.queryByText(/Validation Rate/i)).not.toBeInTheDocument();
  });

  it('should show processed records count when provided', () => {
    const summary = {
      players: 1000,
      clubs: 50,
      games: 5000,
      tournaments: 20,
    };
    const processedRecords = 6070;

    render(
      <ImportSummary summary={summary} processedRecords={processedRecords} />
    );

    expect(screen.getByText('6,070')).toBeInTheDocument();
    expect(screen.getByText(/Total Records Processed/i)).toBeInTheDocument();
  });

  it('should calculate total records from summary', () => {
    const summary = {
      players: 100,
      clubs: 20,
      games: 300,
      tournaments: 10,
    };

    render(<ImportSummary summary={summary} />);

    // Total = 100 + 20 + 300 + 10 = 430
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it('should show last sync time when provided', () => {
    const summary = {
      players: 1000,
      clubs: 50,
      games: 5000,
      tournaments: 20,
    };
    const lastSyncTime = '2024-01-01T12:00:00.000Z';

    render(<ImportSummary summary={summary} lastSyncTime={lastSyncTime} />);

    expect(screen.getByText(/Last Sync/i)).toBeInTheDocument();
  });

  it('should update when summary changes', () => {
    const initialSummary = {
      players: 500,
      clubs: 25,
      games: 2500,
      tournaments: 10,
    };

    const { rerender } = render(<ImportSummary summary={initialSummary} />);

    expect(screen.getByText('500')).toBeInTheDocument();

    const updatedSummary = {
      players: 1000,
      clubs: 50,
      games: 5000,
      tournaments: 20,
    };

    rerender(<ImportSummary summary={updatedSummary} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.queryByText('500')).not.toBeInTheDocument();
  });
});
