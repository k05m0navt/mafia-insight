/**
 * DateRangeFilter - Component for filtering analytics by date range
 *
 * Provides preset buttons (last week, last month, last 3 months, last year, all time)
 * and a custom date picker for selecting date ranges.
 * Integrates with Zustand analytics store for filter state.
 */

'use client';

import React, { useState } from 'react';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange as DateRangeType } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/hooks/use-toast';
import type { DateRange, DateRangePreset } from '@/types/analytics';
import {
  calculatePresetDateRange,
  validateDateRange,
  formatDateRangeLabel,
} from '@/lib/utils/dateRange';

/**
 * Date range preset options
 */
const DATE_RANGE_PRESETS: Array<{
  value: DateRangePreset;
  label: string;
}> = [
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
];

/**
 * Props for DateRangeFilter component
 */
export interface DateRangeFilterProps {
  /** Current date range value */
  value: DateRange | null;
  /** Callback when date range changes */
  onChange: (range: DateRange | null) => void;
  /** Optional list of preset options to display (defaults to all presets) */
  presets?: DateRangePreset[];
  /** Optional CSS class name */
  className?: string;
}

/**
 * DateRangeFilter Component
 */
export function DateRangeFilter({
  value,
  onChange,
  presets = [
    'last_week',
    'last_month',
    'last_3_months',
    'last_year',
    'all_time',
  ],
  className,
}: DateRangeFilterProps) {
  const { toast } = useToast();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>(
    value?.startDate && value?.endDate
      ? {
          from: new Date(value.startDate),
          to: new Date(value.endDate),
        }
      : undefined
  );

  const availablePresets = DATE_RANGE_PRESETS.filter((p) =>
    presets.includes(p.value)
  );

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'all_time') {
      onChange(null);
    } else {
      const { startDate, endDate } = calculatePresetDateRange(preset);
      onChange({
        preset,
        startDate,
        endDate,
      });
    }
    // Reset date picker when preset is selected
    setDateRange(undefined);
  };

  const handleDateRangeSelect = (range: DateRangeType | undefined) => {
    setDateRange(range);
    setError(null); // Clear previous errors

    // Only apply when both dates are selected
    if (range?.from && range?.to) {
      const startDate = range.from.toISOString();
      const endDate = range.to.toISOString();

      // Validate the date range
      const validation = validateDateRange(startDate, endDate);
      if (!validation.valid) {
        const errorMessage = validation.error || 'Invalid date range';
        setError(errorMessage);
        toast({
          title: 'Invalid Date Range',
          description: errorMessage,
          variant: 'destructive',
        });
        // Reset date picker to allow user to try again
        setDateRange(undefined);
        return;
      }

      // Apply custom date range
      onChange({
        preset: null,
        startDate,
        endDate,
      });
      setDatePickerOpen(false);
      setError(null);
    }
  };

  const handleClear = () => {
    onChange(null);
    setDateRange(undefined);
    setError(null);
  };

  const isPresetActive = (preset: DateRangePreset) => {
    return value?.preset === preset;
  };

  // Format date range for display
  const dateRangeDisplay = formatDateRangeLabel(value);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {availablePresets.map((preset) => {
          const isActive = isPresetActive(preset.value);
          return (
            <Button
              key={preset.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset.value)}
              className={cn(
                'transition-all duration-200',
                isActive && 'shadow-md'
              )}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Custom Date Range Picker */}
      <div className="flex items-center gap-2">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[280px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Button */}
        {(value || dateRange) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Filter Indicator */}
      {value && !error && (
        <div className="text-sm text-muted-foreground">
          Showing: <span className="font-medium">{dateRangeDisplay}</span>
        </div>
      )}
    </div>
  );
}
