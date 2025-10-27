import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportProgressCard } from '@/components/sync/ImportProgressCard';
import '@testing-library/jest-dom';

describe('ImportProgressCard', () => {
  it('should display import progress when running', () => {
    render(
      <ImportProgressCard
        isRunning={true}
        progress={45}
        currentOperation="Importing players: batch 15/50"
      />
    );

    expect(screen.getByText('Current Import Progress')).toBeInTheDocument();
    expect(
      screen.getByText('Importing players: batch 15/50')
    ).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should display idle state when not running', () => {
    render(
      <ImportProgressCard
        isRunning={false}
        progress={100}
        currentOperation={null}
      />
    );

    expect(screen.getByText('No import in progress')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should display 0% progress at start', () => {
    render(
      <ImportProgressCard
        isRunning={true}
        progress={0}
        currentOperation="Initializing import..."
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Initializing import...')).toBeInTheDocument();
  });

  it('should display 100% progress when complete', () => {
    render(
      <ImportProgressCard
        isRunning={true}
        progress={100}
        currentOperation="Finalizing import..."
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Finalizing import...')).toBeInTheDocument();
  });

  it('should render progress bar with correct value', () => {
    render(
      <ImportProgressCard
        isRunning={true}
        progress={67}
        currentOperation="Processing data..."
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '67');
  });

  it('should show last sync time when provided', () => {
    const lastSyncTime = '2024-01-01T12:00:00.000Z';
    render(
      <ImportProgressCard
        isRunning={false}
        progress={100}
        currentOperation={null}
        lastSyncTime={lastSyncTime}
      />
    );

    expect(screen.getByText(/Last import:/)).toBeInTheDocument();
  });

  it('should handle null current operation gracefully', () => {
    render(
      <ImportProgressCard
        isRunning={false}
        progress={0}
        currentOperation={null}
      />
    );

    expect(screen.queryByText('Initializing')).not.toBeInTheDocument();
  });

  it('should update progress bar value when progress changes', () => {
    const { rerender } = render(
      <ImportProgressCard
        isRunning={true}
        progress={25}
        currentOperation="Step 1"
      />
    );

    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(
      <ImportProgressCard
        isRunning={true}
        progress={75}
        currentOperation="Step 3"
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });
});
