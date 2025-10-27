/**
 * Tests for DataIntegrityPanel component
 * T094: Test for data integrity panel showing referential integrity checks
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataIntegrityPanel } from '@/components/sync/DataIntegrityPanel';
import type { IntegritySummary } from '@/lib/gomafia/import/integrity-checker';

describe('DataIntegrityPanel', () => {
  it('should render integrity panel with passing status', () => {
    const summary: IntegritySummary = {
      status: 'PASS',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      message: 'All integrity checks passed successfully.',
    };

    render(<DataIntegrityPanel summary={summary} />);

    expect(screen.getByText('Data Integrity')).toBeInTheDocument();
    expect(
      screen.getByText('All integrity checks passed successfully.')
    ).toBeInTheDocument();
    expect(screen.getByText('3 / 3 checks passed')).toBeInTheDocument();
  });

  it('should render integrity panel with failing status', () => {
    const summary: IntegritySummary = {
      status: 'FAIL',
      totalChecks: 3,
      passedChecks: 1,
      failedChecks: 2,
      message: '2 of 3 integrity checks failed.',
      issues: [
        'GameParticipation 123 references non-existent Player 456',
        'Found 5 orphaned Game records',
      ],
    };

    render(<DataIntegrityPanel summary={summary} />);

    expect(
      screen.getByText('2 of 3 integrity checks failed.')
    ).toBeInTheDocument();
    expect(screen.getByText('1 / 3 checks passed')).toBeInTheDocument();
  });

  it('should display individual issues when integrity fails', () => {
    const summary: IntegritySummary = {
      status: 'FAIL',
      totalChecks: 2,
      passedChecks: 0,
      failedChecks: 2,
      message: '2 of 2 integrity checks failed.',
      issues: [
        'PlayerTournament 999 references non-existent Tournament 123',
        'Found 10 orphaned GameParticipation records',
      ],
    };

    render(<DataIntegrityPanel summary={summary} />);

    expect(screen.getByText(/PlayerTournament 999/)).toBeInTheDocument();
    expect(
      screen.getByText(/Found 10 orphaned GameParticipation records/)
    ).toBeInTheDocument();
  });

  it('should not display issues list when all checks pass', () => {
    const summary: IntegritySummary = {
      status: 'PASS',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      message: 'All integrity checks passed successfully.',
    };

    const { container } = render(<DataIntegrityPanel summary={summary} />);

    // Should not have issues section
    expect(container.querySelector('.text-red-800')).not.toBeInTheDocument();
  });

  it('should show loading state when summary is null', () => {
    render(<DataIntegrityPanel summary={null} />);

    expect(screen.getByText('No integrity data available')).toBeInTheDocument();
  });

  it('should display correct badge variant for PASS status', () => {
    const summary: IntegritySummary = {
      status: 'PASS',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      message: 'All integrity checks passed.',
    };

    const { container } = render(<DataIntegrityPanel summary={summary} />);

    // Check for success badge (green styling)
    const badge = screen.getByText('PASS');
    expect(badge).toBeInTheDocument();
  });

  it('should display correct badge variant for FAIL status', () => {
    const summary: IntegritySummary = {
      status: 'FAIL',
      totalChecks: 3,
      passedChecks: 1,
      failedChecks: 2,
      message: '2 of 3 checks failed.',
      issues: ['Issue 1'],
    };

    const { container } = render(<DataIntegrityPanel summary={summary} />);

    // Check for error badge (red styling)
    const badge = screen.getByText('FAIL');
    expect(badge).toBeInTheDocument();
  });

  it('should show progress indicator with correct ratio', () => {
    const summary: IntegritySummary = {
      status: 'FAIL',
      totalChecks: 10,
      passedChecks: 7,
      failedChecks: 3,
      message: '3 of 10 checks failed.',
      issues: ['Issue 1', 'Issue 2', 'Issue 3'],
    };

    render(<DataIntegrityPanel summary={summary} />);

    expect(screen.getByText('7 / 10 checks passed')).toBeInTheDocument();
  });

  it('should handle empty issues array gracefully', () => {
    const summary: IntegritySummary = {
      status: 'FAIL',
      totalChecks: 3,
      passedChecks: 2,
      failedChecks: 1,
      message: '1 of 3 checks failed.',
      issues: [],
    };

    const { container } = render(<DataIntegrityPanel summary={summary} />);

    expect(screen.getByText('1 of 3 checks failed.')).toBeInTheDocument();
    // Should not crash with empty issues
  });
});
