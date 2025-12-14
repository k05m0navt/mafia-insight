import { describe, it, expect } from 'vitest';
import {
  calculateProcessingRate,
  calculateEstimatedTimeRemaining,
  calculateProgressPercentage,
  formatTimeRemaining,
  formatProcessingRate,
} from '@/lib/gomafia/import/progress-calculator';

describe('progress-calculator', () => {
  describe('calculateProcessingRate', () => {
    it('should calculate processing rate correctly', () => {
      expect(calculateProcessingRate(100, 10)).toBe(10);
      expect(calculateProcessingRate(50, 5)).toBe(10);
      expect(calculateProcessingRate(200, 20)).toBe(10);
    });

    it('should return 0 for zero elapsed time', () => {
      expect(calculateProcessingRate(100, 0)).toBe(0);
      expect(calculateProcessingRate(50, -1)).toBe(0);
    });

    it('should return 0 for negative processed count', () => {
      expect(calculateProcessingRate(-10, 5)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateProcessingRate(33, 10)).toBe(3.3);
      expect(calculateProcessingRate(1, 3)).toBeCloseTo(0.333, 2);
    });
  });

  describe('calculateEstimatedTimeRemaining', () => {
    it('should calculate estimated time remaining correctly', () => {
      expect(calculateEstimatedTimeRemaining(100, 10)).toBe(10);
      expect(calculateEstimatedTimeRemaining(50, 5)).toBe(10);
      expect(calculateEstimatedTimeRemaining(200, 20)).toBe(10);
    });

    it('should return 0 for zero processing rate', () => {
      expect(calculateEstimatedTimeRemaining(100, 0)).toBe(0);
      expect(calculateEstimatedTimeRemaining(50, -1)).toBe(0);
    });

    it('should return 0 for zero remaining count', () => {
      expect(calculateEstimatedTimeRemaining(0, 10)).toBe(0);
      expect(calculateEstimatedTimeRemaining(-10, 5)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateEstimatedTimeRemaining(33, 10)).toBe(3.3);
      expect(calculateEstimatedTimeRemaining(1, 3)).toBeCloseTo(0.333, 2);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate progress percentage correctly', () => {
      expect(calculateProgressPercentage(50, 100)).toBe(50);
      expect(calculateProgressPercentage(25, 100)).toBe(25);
      expect(calculateProgressPercentage(75, 100)).toBe(75);
    });

    it('should return 0 for zero total count', () => {
      expect(calculateProgressPercentage(50, 0)).toBe(0);
      expect(calculateProgressPercentage(100, -10)).toBe(0);
    });

    it('should return 0 for negative processed count', () => {
      expect(calculateProgressPercentage(-10, 100)).toBe(0);
    });

    it('should return 100 when processed equals or exceeds total', () => {
      expect(calculateProgressPercentage(100, 100)).toBe(100);
      expect(calculateProgressPercentage(150, 100)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateProgressPercentage(33, 100)).toBe(33);
      expect(calculateProgressPercentage(66, 100)).toBe(66);
      expect(calculateProgressPercentage(1, 3)).toBe(33);
    });

    it('should handle edge cases', () => {
      expect(calculateProgressPercentage(0, 100)).toBe(0);
      expect(calculateProgressPercentage(1, 100)).toBe(1);
      expect(calculateProgressPercentage(99, 100)).toBe(99);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format time correctly for hours', () => {
      expect(formatTimeRemaining(3600)).toBe('1h 0m');
      expect(formatTimeRemaining(7200)).toBe('2h 0m');
      expect(formatTimeRemaining(3660)).toBe('1h 1m');
      expect(formatTimeRemaining(7320)).toBe('2h 2m');
    });

    it('should format time correctly for minutes', () => {
      expect(formatTimeRemaining(60)).toBe('1m 0s');
      expect(formatTimeRemaining(120)).toBe('2m 0s');
      expect(formatTimeRemaining(90)).toBe('1m 30s');
    });

    it('should format time correctly for seconds', () => {
      expect(formatTimeRemaining(30)).toBe('30s');
      expect(formatTimeRemaining(45)).toBe('45s');
      expect(formatTimeRemaining(1)).toBe('1s');
    });

    it('should handle zero and negative values', () => {
      expect(formatTimeRemaining(0)).toBe('Less than a minute');
      expect(formatTimeRemaining(-10)).toBe('Less than a minute');
    });
  });

  describe('formatProcessingRate', () => {
    it('should format rate correctly for rates >= 1 per second', () => {
      expect(formatProcessingRate(10)).toBe('10.0/sec');
      expect(formatProcessingRate(5.5)).toBe('5.5/sec');
      expect(formatProcessingRate(1)).toBe('1.0/sec');
    });

    it('should format rate correctly for rates < 1 per second (show per minute)', () => {
      expect(formatProcessingRate(0.5)).toBe('30.0/min');
      expect(formatProcessingRate(0.1)).toBe('6.0/min');
      expect(formatProcessingRate(0.0167)).toBe('1.0/min');
    });

    it('should handle zero and negative values', () => {
      expect(formatProcessingRate(0)).toBe('0/sec');
      expect(formatProcessingRate(-10)).toBe('0/sec');
    });
  });
});
