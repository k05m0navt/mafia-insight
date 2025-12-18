/**
 * Unit tests for date range utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculatePresetDateRange,
  validateDateRange,
  formatDateRangeLabel,
  dateRangeToQueryParams,
  getEffectiveDateRange,
} from '@/lib/utils/dateRange';
import type { DateRange } from '@/types/analytics';

describe('dateRange utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for consistent testing: 2025-01-27 12:00:00 UTC
    vi.setSystemTime(new Date('2025-01-27T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculatePresetDateRange', () => {
    it('should calculate last_week date range correctly', () => {
      const result = calculatePresetDateRange('last_week');
      const startDate = new Date(result.startDate);
      const endDate = new Date(result.endDate);

      // Should be 7 days ago to today
      expect(startDate.getTime()).toBeLessThan(new Date().getTime());
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());

      // Check that it's approximately 7-8 days (includes end day)
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(7);
      expect(daysDiff).toBeLessThanOrEqual(8);
    });

    it('should calculate last_month date range correctly', () => {
      const result = calculatePresetDateRange('last_month');
      const startDate = new Date(result.startDate);
      const endDate = new Date(result.endDate);

      // Should be 30 days ago to today
      expect(startDate.getTime()).toBeLessThan(new Date().getTime());
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());

      // Check that it's approximately 30 days
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(28); // At least 28 days (month can vary)
      expect(daysDiff).toBeLessThanOrEqual(32); // Can be up to 32 days (includes end day)
    });

    it('should calculate last_3_months date range correctly', () => {
      const result = calculatePresetDateRange('last_3_months');
      const startDate = new Date(result.startDate);
      const endDate = new Date(result.endDate);

      // Should be 90 days ago to today
      expect(startDate.getTime()).toBeLessThan(new Date().getTime());
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());

      // Check that it's approximately 90 days
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(88); // At least 88 days
      expect(daysDiff).toBeLessThanOrEqual(93); // At most 93 days
    });

    it('should calculate last_year date range correctly', () => {
      const result = calculatePresetDateRange('last_year');
      const startDate = new Date(result.startDate);
      const endDate = new Date(result.endDate);

      // Should be 365 days ago to today
      expect(startDate.getTime()).toBeLessThan(new Date().getTime());
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());

      // Check that it's approximately 365 days
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(364); // At least 364 days
      expect(daysDiff).toBeLessThanOrEqual(367); // At most 367 days (includes end day + leap year)
    });

    it('should return empty strings for all_time preset', () => {
      const result = calculatePresetDateRange('all_time');
      expect(result.startDate).toBe('');
      expect(result.endDate).toBe('');
    });

    it('should return ISO 8601 formatted dates', () => {
      const result = calculatePresetDateRange('last_week');
      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('validateDateRange', () => {
    it('should validate a valid date range', () => {
      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-27T00:00:00.000Z';
      const result = validateDateRange(startDate, endDate);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject when start date is missing', () => {
      const result = validateDateRange('', '2025-01-27T00:00:00.000Z');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Both start date and end date are required');
    });

    it('should reject when end date is missing', () => {
      const result = validateDateRange('2025-01-01T00:00:00.000Z', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Both start date and end date are required');
    });

    it('should reject invalid start date format', () => {
      const result = validateDateRange(
        'invalid-date',
        '2025-01-27T00:00:00.000Z'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid start date format');
    });

    it('should reject invalid end date format', () => {
      const result = validateDateRange(
        '2025-01-01T00:00:00.000Z',
        'invalid-date'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid end date format');
    });

    it('should reject when start date is after end date', () => {
      const result = validateDateRange(
        '2025-01-27T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Start date must be before or equal to end date'
      );
    });

    it('should accept when start date equals end date', () => {
      const date = '2025-01-15T00:00:00.000Z';
      const result = validateDateRange(date, date);
      expect(result.valid).toBe(true);
    });

    it('should reject future start date', () => {
      const futureDate = '2026-01-01T00:00:00.000Z';
      const result = validateDateRange(futureDate, '2026-01-27T00:00:00.000Z');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dates cannot be in the future');
    });

    it('should reject future end date', () => {
      const result = validateDateRange(
        '2025-01-01T00:00:00.000Z',
        '2026-01-27T00:00:00.000Z'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dates cannot be in the future');
    });
  });

  describe('formatDateRangeLabel', () => {
    it('should return "All Time" for null range', () => {
      expect(formatDateRangeLabel(null)).toBe('All Time');
    });

    it('should return preset label for preset ranges', () => {
      expect(formatDateRangeLabel({ preset: 'last_week' })).toBe('Last Week');
      expect(formatDateRangeLabel({ preset: 'last_month' })).toBe('Last Month');
      expect(formatDateRangeLabel({ preset: 'last_3_months' })).toBe(
        'Last 3 Months'
      );
      expect(formatDateRangeLabel({ preset: 'last_year' })).toBe('Last Year');
      expect(formatDateRangeLabel({ preset: 'all_time' })).toBe('All Time');
    });

    it('should format custom date range for same day', () => {
      // Use same date for both start and end (exact same day)
      const dateStr = '2025-01-15';
      const range: DateRange = {
        startDate: `${dateStr}T00:00:00.000Z`,
        endDate: `${dateStr}T00:00:00.000Z`,
      };
      const result = formatDateRangeLabel(range);
      // Should show single date format
      expect(result).toMatch(/Jan 15/);
    });

    it('should format custom date range for same month', () => {
      const range: DateRange = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-15T00:00:00.000Z',
      };
      const result = formatDateRangeLabel(range);
      expect(result).toMatch(/Jan 1/);
      expect(result).toMatch(/15, 2025/);
    });

    it('should format custom date range for same year', () => {
      const range: DateRange = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z',
      };
      const result = formatDateRangeLabel(range);
      expect(result).toMatch(/Jan 1/);
      expect(result).toMatch(/Mar 31, 2025/);
    });

    it('should format custom date range for different years', () => {
      const range: DateRange = {
        startDate: '2024-12-01T00:00:00.000Z',
        endDate: '2025-01-15T00:00:00.000Z',
      };
      const result = formatDateRangeLabel(range);
      expect(result).toMatch(/Dec 1, 2024/);
      expect(result).toMatch(/Jan 15, 2025/);
    });

    it('should return "All Time" for range without dates', () => {
      expect(formatDateRangeLabel({})).toBe('All Time');
    });
  });

  describe('dateRangeToQueryParams', () => {
    it('should return empty object for null range', () => {
      expect(dateRangeToQueryParams(null)).toEqual({});
    });

    it('should return empty object for all_time preset', () => {
      expect(dateRangeToQueryParams({ preset: 'all_time' })).toEqual({});
    });

    it('should calculate dates for preset ranges', () => {
      const result = dateRangeToQueryParams({ preset: 'last_week' });
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(typeof result.startDate).toBe('string');
      expect(typeof result.endDate).toBe('string');
    });

    it('should use custom dates directly', () => {
      const range: DateRange = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };
      const result = dateRangeToQueryParams(range);
      expect(result.startDate).toBe('2025-01-01T00:00:00.000Z');
      expect(result.endDate).toBe('2025-01-27T00:00:00.000Z');
    });

    it('should return empty object for range without dates or preset', () => {
      expect(dateRangeToQueryParams({})).toEqual({});
    });
  });

  describe('getEffectiveDateRange', () => {
    it('should return null dates for null range', () => {
      const result = getEffectiveDateRange(null);
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it('should return null dates for all_time preset', () => {
      const result = getEffectiveDateRange({ preset: 'all_time' });
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it('should calculate dates for preset ranges', () => {
      const result = getEffectiveDateRange({ preset: 'last_week' });
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate!.getTime()).toBeLessThan(
        result.endDate!.getTime()
      );
    });

    it('should use custom dates directly', () => {
      const range: DateRange = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };
      const result = getEffectiveDateRange(range);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate!.toISOString()).toBe('2025-01-01T00:00:00.000Z');
      expect(result.endDate!.toISOString()).toBe('2025-01-27T00:00:00.000Z');
    });

    it('should return null dates for range without dates or preset', () => {
      const result = getEffectiveDateRange({});
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });
  });
});
