/**
 * Tests for ImportProgressCard component
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImportProgressCard } from '@/components/sync/ImportProgressCard';

const baseProgress = {
  id: 'sync-123',
  operation: 'Syncing data',
  progress: 0,
  totalRecords: 0,
  processedRecords: 0,
  errors: 0,
  startTime: new Date('2024-01-01T00:00:00Z'),
  estimatedCompletion: undefined,
  status: 'PENDING' as const,
};

describe('ImportProgressCard', () => {
  it('renders empty state when no progress is provided', () => {
    render(
      <ImportProgressCard
        status="PENDING"
        isRunning={false}
        isPending={false}
        isCancelling={false}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByText('Import Progress')).toBeInTheDocument();
    expect(
      screen.getByText('No import operation in progress')
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('displays 0 progress when provided', () => {
    render(
      <ImportProgressCard
        status="RUNNING"
        isRunning
        isPending={false}
        isCancelling={false}
        progress={{ ...baseProgress, progress: 0, status: 'RUNNING' }}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText(/0\s*%/)).toBeInTheDocument();
  });

  it('shows 100% when import completes', () => {
    render(
      <ImportProgressCard
        status="COMPLETED"
        isRunning={false}
        isPending={false}
        isCancelling={false}
        progress={{ ...baseProgress, progress: 100, status: 'COMPLETED' }}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/100\s*%/)).toBeInTheDocument();
  });

  it('renders progress bar with correct value', () => {
    render(
      <ImportProgressCard
        status="RUNNING"
        isRunning
        isPending={false}
        isCancelling={false}
        progress={{
          ...baseProgress,
          progress: 67,
          processedRecords: 670,
          totalRecords: 1000,
          status: 'RUNNING',
        }}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/67\s*%/)).toBeInTheDocument();
    expect(screen.getByText(/670\s*\/\s*1,000/)).toBeInTheDocument();
  });

  it('updates when progress changes', () => {
    const { rerender } = render(
      <ImportProgressCard
        status="RUNNING"
        isRunning
        isPending={false}
        isCancelling={false}
        progress={{ ...baseProgress, progress: 25, status: 'RUNNING' }}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByText(/25\s*%/)).toBeInTheDocument();

    rerender(
      <ImportProgressCard
        status="RUNNING"
        isRunning
        isPending={false}
        isCancelling={false}
        progress={{
          ...baseProgress,
          progress: 80,
          processedRecords: 800,
          totalRecords: 1000,
          status: 'RUNNING',
        }}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onStop={() => undefined}
        onManualSync={() => undefined}
        onSelectiveDelete={() => undefined}
      />
    );

    expect(screen.getByText(/80\s*%/)).toBeInTheDocument();
  });
});
