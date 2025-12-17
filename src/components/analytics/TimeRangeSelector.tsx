/**
 * TimeRangeSelector - Component for selecting time range presets
 *
 * Displays preset options (last month, 3 months, 6 months, all time) as buttons
 * with active selection indicator.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimeRangeSelectorProps, DateRange } from '@/types/analytics';

/**
 * Time range preset options
 */
const TIME_RANGE_PRESETS: Array<{
  value: 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time';
  label: string;
}> = [
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: '3 Months' },
  { value: 'last_6_months', label: '6 Months' },
  { value: 'all_time', label: 'All Time' },
];

/**
 * TimeRangeSelector Component
 */
export function TimeRangeSelector({
  value,
  onChange,
  presets = ['last_month', 'last_3_months', 'last_6_months', 'all_time'],
}: TimeRangeSelectorProps) {
  const handlePresetClick = (
    preset: 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time'
  ) => {
    const newRange: DateRange = {
      preset,
      startDate: null,
      endDate: null,
    };
    onChange(newRange);
  };

  const isPresetActive = (
    preset: 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time'
  ) => {
    return value?.preset === preset;
  };

  const availablePresets = TIME_RANGE_PRESETS.filter((p) =>
    presets.includes(p.value)
  );

  return (
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
  );
}
