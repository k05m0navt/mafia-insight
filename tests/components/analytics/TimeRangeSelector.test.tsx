/**
 * Component tests for TimeRangeSelector
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector';
import type { DateRange } from '@/types/analytics';

describe('TimeRangeSelector', () => {
  it('should render all preset options', () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value={null} onChange={onChange} />);

    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should highlight active selection', () => {
    const value: DateRange = { preset: 'last_month' };
    const onChange = vi.fn();
    render(<TimeRangeSelector value={value} onChange={onChange} />);

    const lastMonthButton = screen.getByText('Last Month');
    expect(lastMonthButton.closest('button')).toHaveClass('bg-primary'); // Active button
  });

  it('should call onChange when preset is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector value={null} onChange={onChange} />);

    const threeMonthsButton = screen.getByText('3 Months');
    await user.click(threeMonthsButton);

    expect(onChange).toHaveBeenCalledWith({
      preset: 'last_3_months',
      startDate: null,
      endDate: null,
    });
  });

  it('should filter presets based on props', () => {
    const onChange = vi.fn();
    render(
      <TimeRangeSelector
        value={null}
        onChange={onChange}
        presets={['last_month', 'all_time']}
      />
    );

    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
    expect(screen.queryByText('3 Months')).not.toBeInTheDocument();
    expect(screen.queryByText('6 Months')).not.toBeInTheDocument();
  });

  it('should handle all_time selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector value={null} onChange={onChange} />);

    const allTimeButton = screen.getByText('All Time');
    await user.click(allTimeButton);

    expect(onChange).toHaveBeenCalledWith({
      preset: 'all_time',
      startDate: null,
      endDate: null,
    });
  });

  it('should update active state when value changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TimeRangeSelector value={null} onChange={onChange} />
    );

    // Initially no selection
    const lastMonthButton = screen.getByText('Last Month');
    expect(lastMonthButton.closest('button')).not.toHaveClass('bg-primary');

    // Update to select last_month
    rerender(
      <TimeRangeSelector value={{ preset: 'last_month' }} onChange={onChange} />
    );

    expect(lastMonthButton.closest('button')).toHaveClass('bg-primary');
  });
});
