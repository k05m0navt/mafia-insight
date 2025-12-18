/**
 * Component tests for DateRangeFilter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import type { DateRange } from '@/types/analytics';

// Mock the date range utilities
vi.mock('@/lib/utils/dateRange', () => ({
  calculatePresetDateRange: vi.fn((preset) => {
    const now = new Date('2025-01-27T12:00:00.000Z');
    const mockRanges: Record<string, { startDate: string; endDate: string }> = {
      last_week: {
        startDate: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: now.toISOString(),
      },
      last_month: {
        startDate: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: now.toISOString(),
      },
      last_3_months: {
        startDate: new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: now.toISOString(),
      },
      last_year: {
        startDate: new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: now.toISOString(),
      },
    };
    return mockRanges[preset] || { startDate: '', endDate: '' };
  }),
  validateDateRange: vi.fn((startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    if (start > end) {
      return {
        valid: false,
        error: 'Start date must be before or equal to end date',
      };
    }
    if (start > now || end > now) {
      return { valid: false, error: 'Dates cannot be in the future' };
    }
    return { valid: true };
  }),
  formatDateRangeLabel: vi.fn((range) => {
    if (!range) return 'All Time';
    if (range.preset) {
      const labels: Record<string, string> = {
        last_week: 'Last Week',
        last_month: 'Last Month',
        last_3_months: 'Last 3 Months',
        last_year: 'Last Year',
        all_time: 'All Time',
      };
      return labels[range.preset] || 'All Time';
    }
    return 'Custom Range';
  }),
}));

describe('DateRangeFilter', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all preset buttons', () => {
    render(<DateRangeFilter value={null} onChange={defaultOnChange} />);

    expect(screen.getByText('Last Week')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('Last 3 Months')).toBeInTheDocument();
    expect(screen.getByText('Last Year')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should highlight active preset button', () => {
    const value: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(<DateRangeFilter value={value} onChange={defaultOnChange} />);

    // Find the button (not the span in the indicator)
    const buttons = screen.getAllByText('Last Month');
    const lastMonthButton = buttons.find((el) => el.closest('button'));
    expect(lastMonthButton?.closest('button')).toHaveClass('bg-primary');
  });

  it('should call onChange when preset button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DateRangeFilter value={null} onChange={onChange} />);

    const lastWeekButton = screen.getByText('Last Week');
    await user.click(lastWeekButton);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const callArgs = onChange.mock.calls[0][0];
    expect(callArgs.preset).toBe('last_week');
    expect(callArgs.startDate).toBeDefined();
    expect(callArgs.endDate).toBeDefined();
  });

  it('should call onChange with null when All Time is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DateRangeFilter value={null} onChange={onChange} />);

    const allTimeButton = screen.getByText('All Time');
    await user.click(allTimeButton);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  it('should filter presets based on props', () => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter
        value={null}
        onChange={onChange}
        presets={['last_week', 'last_month', 'all_time']}
      />
    );

    expect(screen.getByText('Last Week')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
    expect(screen.queryByText('Last 3 Months')).not.toBeInTheDocument();
    expect(screen.queryByText('Last Year')).not.toBeInTheDocument();
  });

  it('should render date picker button', () => {
    render(<DateRangeFilter value={null} onChange={defaultOnChange} />);

    expect(screen.getByText('Pick a date range')).toBeInTheDocument();
  });

  it('should display active filter indicator when value is set', () => {
    const value: DateRange = {
      preset: 'last_3_months',
      startDate: '2024-10-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(<DateRangeFilter value={value} onChange={defaultOnChange} />);

    expect(screen.getByText(/Showing:/)).toBeInTheDocument();
    // "Last 3 Months" appears in both button and indicator, so use getAllByText
    const last3MonthsElements = screen.getAllByText('Last 3 Months');
    expect(last3MonthsElements.length).toBeGreaterThan(0);
  });

  it('should not display filter indicator when value is null', () => {
    render(<DateRangeFilter value={null} onChange={defaultOnChange} />);

    expect(screen.queryByText(/Showing:/)).not.toBeInTheDocument();
  });

  it('should show clear button when value is set', () => {
    const value: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(<DateRangeFilter value={value} onChange={defaultOnChange} />);

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('should call onChange with null when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const value: DateRange = {
      preset: 'last_week',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(<DateRangeFilter value={value} onChange={onChange} />);

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  it('should update active state when value changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateRangeFilter value={null} onChange={onChange} />
    );

    // Initially no selection - find the button
    const buttons = screen.getAllByText('Last Month');
    const lastMonthButton = buttons
      .find((el) => el.closest('button'))
      ?.closest('button');
    expect(lastMonthButton).not.toHaveClass('bg-primary');

    // Update to select last_month
    const value: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    rerender(<DateRangeFilter value={value} onChange={onChange} />);

    // Re-query after rerender
    const updatedButtons = screen.getAllByText('Last Month');
    const updatedButton = updatedButtons
      .find((el) => el.closest('button'))
      ?.closest('button');
    expect(updatedButton).toHaveClass('bg-primary');
  });

  it('should handle custom date range display', () => {
    const value: DateRange = {
      preset: null,
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-15T00:00:00.000Z',
    };

    render(<DateRangeFilter value={value} onChange={defaultOnChange} />);

    // Custom range should show in indicator
    expect(screen.getByText(/Showing:/)).toBeInTheDocument();
  });
});
