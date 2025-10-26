import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationMetricsTracker } from '@/services/validation-service';

describe('ValidationMetricsTracker', () => {
  let tracker: ValidationMetricsTracker;

  beforeEach(() => {
    tracker = new ValidationMetricsTracker();
  });

  it('should initialize with zero counts', () => {
    const metrics = tracker.getMetrics();

    expect(metrics.totalRecords).toBe(0);
    expect(metrics.validRecords).toBe(0);
    expect(metrics.invalidRecords).toBe(0);
    expect(metrics.validationRate).toBe(0);
  });

  it('should track valid records', () => {
    tracker.recordValid('players');
    tracker.recordValid('players');
    tracker.recordValid('clubs');

    const metrics = tracker.getMetrics();

    expect(metrics.totalRecords).toBe(3);
    expect(metrics.validRecords).toBe(3);
    expect(metrics.invalidRecords).toBe(0);
    expect(metrics.validationRate).toBe(100);
  });

  it('should track invalid records', () => {
    tracker.recordInvalid('players', 'Missing required field: name');
    tracker.recordInvalid('clubs', 'Invalid region format');

    const metrics = tracker.getMetrics();

    expect(metrics.totalRecords).toBe(2);
    expect(metrics.validRecords).toBe(0);
    expect(metrics.invalidRecords).toBe(2);
    expect(metrics.validationRate).toBe(0);
  });

  it('should calculate validation rate correctly', () => {
    // 8 valid + 2 invalid = 10 total, 80% validation rate
    for (let i = 0; i < 8; i++) {
      tracker.recordValid('players');
    }
    tracker.recordInvalid('players', 'Invalid format');
    tracker.recordInvalid('players', 'Invalid format');

    const metrics = tracker.getMetrics();

    expect(metrics.totalRecords).toBe(10);
    expect(metrics.validRecords).toBe(8);
    expect(metrics.invalidRecords).toBe(2);
    expect(metrics.validationRate).toBe(80);
  });

  it('should track errors by entity type', () => {
    tracker.recordInvalid('players', 'Error 1');
    tracker.recordInvalid('players', 'Error 2');
    tracker.recordInvalid('clubs', 'Error 3');

    const metrics = tracker.getMetrics();

    expect(metrics.errorsByEntity.players).toBe(2);
    expect(metrics.errorsByEntity.clubs).toBe(1);
  });

  it('should collect validation error details', () => {
    tracker.recordInvalid('players', 'Missing name field', { id: '123' });
    tracker.recordInvalid('clubs', 'Invalid region', { id: '456' });

    const errors = tracker.getErrors();

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({
      entity: 'players',
      message: 'Missing name field',
      context: { id: '123' },
    });
    expect(errors[1]).toMatchObject({
      entity: 'clubs',
      message: 'Invalid region',
      context: { id: '456' },
    });
  });

  it('should limit stored error details to prevent memory issues', () => {
    // Add 1000 errors
    for (let i = 0; i < 1000; i++) {
      tracker.recordInvalid('players', `Error ${i}`);
    }

    const errors = tracker.getErrors();

    // Should cap at 100 errors (or whatever limit is set)
    expect(errors.length).toBeLessThanOrEqual(100);
  });

  it('should calculate validation rate for specific entity', () => {
    tracker.recordValid('players');
    tracker.recordValid('players');
    tracker.recordValid('players');
    tracker.recordInvalid('players', 'Error');

    tracker.recordValid('clubs');
    tracker.recordInvalid('clubs', 'Error');
    tracker.recordInvalid('clubs', 'Error');

    const playerRate = tracker.getValidationRateByEntity('players');
    const clubRate = tracker.getValidationRateByEntity('clubs');

    expect(playerRate).toBe(75); // 3 valid out of 4 total
    expect(clubRate).toBeCloseTo(33.33, 1); // 1 valid out of 3 total
  });

  it('should reset all metrics', () => {
    tracker.recordValid('players');
    tracker.recordValid('clubs');
    tracker.recordInvalid('games', 'Error');

    tracker.reset();

    const metrics = tracker.getMetrics();
    expect(metrics.totalRecords).toBe(0);
    expect(metrics.validRecords).toBe(0);
    expect(metrics.invalidRecords).toBe(0);
    expect(metrics.validationRate).toBe(0);
    expect(tracker.getErrors()).toHaveLength(0);
  });

  it('should provide summary statistics', () => {
    for (let i = 0; i < 98; i++) {
      tracker.recordValid('players');
    }
    tracker.recordInvalid('players', 'Error 1');
    tracker.recordInvalid('players', 'Error 2');

    const summary = tracker.getSummary();

    expect(summary.validationRate).toBe(98);
    expect(summary.meetsThreshold).toBe(true); // ≥98%
    expect(summary.totalRecords).toBe(100);
  });

  it('should indicate when validation rate is below threshold', () => {
    for (let i = 0; i < 95; i++) {
      tracker.recordValid('players');
    }
    for (let i = 0; i < 5; i++) {
      tracker.recordInvalid('players', 'Error');
    }

    const summary = tracker.getSummary();

    expect(summary.validationRate).toBe(95);
    expect(summary.meetsThreshold).toBe(false); // <98%
  });
});
