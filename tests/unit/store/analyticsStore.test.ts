/**
 * Unit tests for analytics store date range actions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { DateRange } from '@/types/analytics';

describe('analyticsStore date range actions', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAnalyticsStore.getState().reset();
  });

  describe('setDateRange', () => {
    it('should set date range with preset', () => {
      const range: DateRange = {
        preset: 'last_week',
        startDate: '2025-01-20T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(range);

      const state = useAnalyticsStore.getState();
      expect(state.dateRange).toEqual(range);
    });

    it('should set date range with custom dates', () => {
      const range: DateRange = {
        preset: null,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-15T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(range);

      const state = useAnalyticsStore.getState();
      expect(state.dateRange).toEqual(range);
    });

    it('should set date range to null', () => {
      // First set a range
      const range: DateRange = {
        preset: 'last_month',
        startDate: '2024-12-27T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };
      useAnalyticsStore.getState().setDateRange(range);
      expect(useAnalyticsStore.getState().dateRange).toEqual(range);

      // Then set to null
      useAnalyticsStore.getState().setDateRange(null);
      expect(useAnalyticsStore.getState().dateRange).toBeNull();
    });

    it('should update existing date range', () => {
      const firstRange: DateRange = {
        preset: 'last_week',
        startDate: '2025-01-20T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(firstRange);
      expect(useAnalyticsStore.getState().dateRange).toEqual(firstRange);

      const secondRange: DateRange = {
        preset: 'last_month',
        startDate: '2024-12-27T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(secondRange);
      expect(useAnalyticsStore.getState().dateRange).toEqual(secondRange);
    });
  });

  describe('clearDateRange', () => {
    it('should clear date range when one is set', () => {
      const range: DateRange = {
        preset: 'last_week',
        startDate: '2025-01-20T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(range);
      expect(useAnalyticsStore.getState().dateRange).toEqual(range);

      useAnalyticsStore.getState().clearDateRange();
      expect(useAnalyticsStore.getState().dateRange).toBeNull();
    });

    it('should handle clearing when date range is already null', () => {
      expect(useAnalyticsStore.getState().dateRange).toBeNull();

      useAnalyticsStore.getState().clearDateRange();
      expect(useAnalyticsStore.getState().dateRange).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset date range along with other state', () => {
      const range: DateRange = {
        preset: 'last_month',
        startDate: '2024-12-27T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(range);
      useAnalyticsStore.getState().setSelectedRole('DON');
      useAnalyticsStore.getState().setTimeRange('last_3_months');

      expect(useAnalyticsStore.getState().dateRange).toEqual(range);
      expect(useAnalyticsStore.getState().selectedRole).toBe('DON');
      expect(useAnalyticsStore.getState().timeRange).toBe('last_3_months');

      useAnalyticsStore.getState().reset();

      expect(useAnalyticsStore.getState().dateRange).toBeNull();
      expect(useAnalyticsStore.getState().selectedRole).toBeNull();
      expect(useAnalyticsStore.getState().timeRange).toBe('all_time');
    });
  });

  describe('state persistence', () => {
    it('should maintain date range state across multiple calls', () => {
      const range: DateRange = {
        preset: 'last_3_months',
        startDate: '2024-10-27T00:00:00.000Z',
        endDate: '2025-01-27T00:00:00.000Z',
      };

      useAnalyticsStore.getState().setDateRange(range);

      // Get state multiple times - should be consistent
      expect(useAnalyticsStore.getState().dateRange).toEqual(range);
      expect(useAnalyticsStore.getState().dateRange).toEqual(range);
      expect(useAnalyticsStore.getState().dateRange).toEqual(range);
    });
  });
});
