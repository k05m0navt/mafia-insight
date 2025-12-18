/**
 * Date range utility functions for analytics filtering
 *
 * Provides functions to calculate preset date ranges, validate date ranges,
 * and format date range labels for display.
 */

import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type { DateRange, DateRangePreset } from '@/types/analytics';

/**
 * Calculate start and end dates for a preset date range
 * @param preset The preset to calculate dates for
 * @returns Object with startDate and endDate as ISO 8601 strings
 */
export function calculatePresetDateRange(preset: DateRangePreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const today = endOfDay(now);
  let startDate: Date;

  switch (preset) {
    case 'last_week':
      startDate = startOfDay(subWeeks(now, 1));
      break;
    case 'last_month':
      startDate = startOfDay(subMonths(now, 1));
      break;
    case 'last_3_months':
      startDate = startOfDay(subMonths(now, 3));
      break;
    case 'last_year':
      startDate = startOfDay(subYears(now, 1));
      break;
    case 'all_time':
      // Return null dates for all_time (will be handled by API/repository)
      return { startDate: '', endDate: '' };
    default:
      // Fallback to last month
      startDate = startOfDay(subMonths(now, 1));
  }

  return {
    startDate: startDate.toISOString(),
    endDate: today.toISOString(),
  };
}

/**
 * Validate a date range
 * @param startDate Start date as ISO 8601 string
 * @param endDate End date as ISO 8601 string
 * @returns Validation result with valid flag and optional error message
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start date and end date are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  // Check if dates are valid
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date format' };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date format' };
  }

  // Check if start date is after end date
  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before or equal to end date',
    };
  }

  // Check if dates are in the future
  if (start > now || end > now) {
    return { valid: false, error: 'Dates cannot be in the future' };
  }

  return { valid: true };
}

/**
 * Format a date range for display
 * @param range DateRange object to format
 * @returns Formatted string for display (e.g., "Last 3 months" or "Jan 1 - Mar 31, 2025")
 */
export function formatDateRangeLabel(range: DateRange | null): string {
  if (!range) {
    return 'All Time';
  }

  // If preset is specified, return preset label
  if (range.preset) {
    const presetLabels: Record<DateRangePreset, string> = {
      last_week: 'Last Week',
      last_month: 'Last Month',
      last_3_months: 'Last 3 Months',
      last_year: 'Last Year',
      all_time: 'All Time',
    };
    return presetLabels[range.preset];
  }

  // If custom date range, format the dates
  if (range.startDate && range.endDate) {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);

    // Check if same day
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }

    // Check if same month
    if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }

    // Check if same year
    if (format(start, 'yyyy') === format(end, 'yyyy')) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }

    // Different years
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }

  return 'All Time';
}

/**
 * Convert DateRange to query parameters for API calls
 * @param range DateRange object
 * @returns Object with startDate and endDate query parameters (or empty strings for all_time)
 */
export function dateRangeToQueryParams(range: DateRange | null): {
  startDate?: string;
  endDate?: string;
} {
  if (!range) {
    return {};
  }

  // If preset, calculate dates
  if (range.preset) {
    if (range.preset === 'all_time') {
      return {};
    }
    const { startDate, endDate } = calculatePresetDateRange(range.preset);
    return {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }

  // If custom dates, use them directly
  if (range.startDate && range.endDate) {
    return {
      startDate: range.startDate,
      endDate: range.endDate,
    };
  }

  return {};
}

/**
 * Get the effective start and end dates from a DateRange
 * Handles both preset and custom date ranges
 * @param range DateRange object
 * @returns Object with startDate and endDate, or null for all_time
 */
export function getEffectiveDateRange(range: DateRange | null): {
  startDate: Date | null;
  endDate: Date | null;
} {
  if (!range) {
    return { startDate: null, endDate: null };
  }

  // If preset is all_time, return null dates
  if (range.preset === 'all_time') {
    return { startDate: null, endDate: null };
  }

  // If preset, calculate dates
  if (range.preset) {
    const { startDate, endDate } = calculatePresetDateRange(range.preset);
    return {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
  }

  // If custom dates, use them directly
  if (range.startDate && range.endDate) {
    return {
      startDate: new Date(range.startDate),
      endDate: new Date(range.endDate),
    };
  }

  return { startDate: null, endDate: null };
}
