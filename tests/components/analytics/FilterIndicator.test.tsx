/**
 * Component tests for FilterIndicator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterIndicator } from '@/components/analytics/FilterIndicator';
import type { DateRange, DateRangePreset } from '@/types/analytics';

// Mock the date range utilities
vi.mock('@/lib/utils/dateRange', () => ({
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

describe('FilterIndicator', () => {
  const defaultOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when both dateRange and roles are empty', () => {
    const { container } = render(
      <FilterIndicator
        dateRange={null}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render with preset date range', () => {
    const dateRange: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
      />
    );

    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
  });

  it('should render with custom date range', () => {
    const dateRange: DateRange = {
      preset: null,
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-15T00:00:00.000Z',
    };

    render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
      />
    );

    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('Custom Range')).toBeInTheDocument();
  });

  it('should display clear button for date range', () => {
    const dateRange: DateRange = {
      preset: 'last_week',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
      />
    );

    const clearButton = screen.getByLabelText('Clear date range filter');
    expect(clearButton).toBeInTheDocument();
  });

  it('should call onClearDateRange when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClearDateRange = vi.fn();

    const dateRange: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={onClearDateRange}
        roles={[]}
        onClearRoles={vi.fn()}
      />
    );

    const clearButton = screen.getByLabelText('Clear date range filter');
    await user.click(clearButton);

    expect(onClearDateRange).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when isLoading is true', () => {
    const dateRange: DateRange = {
      preset: 'last_3_months',
      startDate: '2024-10-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    const { container } = render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
        isLoading={true}
      />
    );

    // Check for loading spinner (Loader2 component with animate-spin class)
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });

  it('should not show loading state when isLoading is false', () => {
    const dateRange: DateRange = {
      preset: 'last_week',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    const { container } = render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
        isLoading={false}
      />
    );

    // Should not have loading spinner
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).not.toBeInTheDocument();
  });

  it('should apply opacity when loading', () => {
    const dateRange: DateRange = {
      preset: 'last_month',
      startDate: '2024-12-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    const { container } = render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
        isLoading={true}
      />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('opacity-75');
  });

  it('should accept custom className', () => {
    const dateRange: DateRange = {
      preset: 'last_year',
      startDate: '2024-01-27T00:00:00.000Z',
      endDate: '2025-01-27T00:00:00.000Z',
    };

    const { container } = render(
      <FilterIndicator
        dateRange={dateRange}
        onClearDateRange={defaultOnClear}
        roles={[]}
        onClearRoles={vi.fn()}
        className="custom-class"
      />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('custom-class');
  });

  it('should render all preset labels correctly', () => {
    const presets: DateRangePreset[] = [
      'last_week',
      'last_month',
      'last_3_months',
      'last_year',
      'all_time',
    ];

    presets.forEach((preset) => {
      const dateRange: DateRange = {
        preset,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      const { unmount } = render(
        <FilterIndicator
          dateRange={dateRange}
          onClearDateRange={defaultOnClear}
          roles={[]}
          onClearRoles={vi.fn()}
        />
      );

      expect(screen.getByText('Date:')).toBeInTheDocument();
      unmount();
    });
  });

  describe('role filter support', () => {
    it('should not render when both dateRange and roles are empty', () => {
      const { container } = render(
        <FilterIndicator
          dateRange={null}
          onClearDateRange={defaultOnClear}
          roles={[]}
          onClearRoles={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render role filter badge when roles are selected', () => {
      render(
        <FilterIndicator
          dateRange={null}
          onClearDateRange={defaultOnClear}
          roles={['DON']}
          onClearRoles={vi.fn()}
        />
      );

      expect(screen.getByText('Roles:')).toBeInTheDocument();
      expect(screen.getByText('Don selected')).toBeInTheDocument();
    });

    it('should render both date range and role filter badges', () => {
      const dateRange: DateRange = {
        preset: 'last_month',
        startDate: '2024-12-27T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      render(
        <FilterIndicator
          dateRange={dateRange}
          onClearDateRange={defaultOnClear}
          roles={['DON', 'MAFIA']}
          onClearRoles={vi.fn()}
        />
      );

      expect(screen.getByText('Date:')).toBeInTheDocument();
      expect(screen.getByText('Roles:')).toBeInTheDocument();
      expect(screen.getByText('Don + Mafia selected')).toBeInTheDocument();
    });

    it('should call onClearRoles when role clear button is clicked', async () => {
      const user = userEvent.setup();
      const onClearRoles = vi.fn();

      render(
        <FilterIndicator
          dateRange={null}
          onClearDateRange={defaultOnClear}
          roles={['DON']}
          onClearRoles={onClearRoles}
        />
      );

      const clearButton = screen.getByLabelText('Clear role filter');
      await user.click(clearButton);

      expect(onClearRoles).toHaveBeenCalledTimes(1);
    });

    it('should show loading state for role filter', () => {
      const { container } = render(
        <FilterIndicator
          dateRange={null}
          onClearDateRange={defaultOnClear}
          roles={['DON']}
          onClearRoles={vi.fn()}
          isLoading={true}
        />
      );

      const loadingIcon = container.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('should format multiple roles correctly', () => {
      render(
        <FilterIndicator
          dateRange={null}
          onClearDateRange={defaultOnClear}
          roles={['DON', 'MAFIA', 'SHERIFF']}
          onClearRoles={vi.fn()}
        />
      );

      expect(
        screen.getByText('Don + Mafia + Sheriff selected')
      ).toBeInTheDocument();
    });
  });
});
