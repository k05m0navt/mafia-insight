import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationSummaryCard } from '@/components/sync/ValidationSummaryCard';

describe('ValidationSummaryCard', () => {
  it('should render validation summary with metrics', () => {
    render(
      <ValidationSummaryCard
        validationRate={99.5}
        totalRecordsProcessed={1000}
        validRecords={995}
        invalidRecords={5}
      />
    );

    expect(screen.getByText('Validation Summary')).toBeInTheDocument();
    expect(screen.getByText('99.50%')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('995')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show "Excellent" badge when validation rate >= 98%', () => {
    render(
      <ValidationSummaryCard
        validationRate={98.5}
        totalRecordsProcessed={1000}
        validRecords={985}
        invalidRecords={15}
      />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('should show "Good" badge when validation rate is between 95% and 98%', () => {
    render(
      <ValidationSummaryCard
        validationRate={96.0}
        totalRecordsProcessed={1000}
        validRecords={960}
        invalidRecords={40}
      />
    );

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should show "Below Threshold" badge when validation rate < 95%', () => {
    render(
      <ValidationSummaryCard
        validationRate={90.0}
        totalRecordsProcessed={1000}
        validRecords={900}
        invalidRecords={100}
      />
    );

    expect(screen.getByText('Below Threshold')).toBeInTheDocument();
  });

  it('should show warning message when validation rate < 98%', () => {
    render(
      <ValidationSummaryCard
        validationRate={95.0}
        totalRecordsProcessed={1000}
        validRecords={950}
        invalidRecords={50}
      />
    );

    expect(screen.getByText(/Warning:/i)).toBeInTheDocument();
    expect(screen.getByText(/below the 98% threshold/i)).toBeInTheDocument();
  });

  it('should not show warning message when validation rate >= 98%', () => {
    render(
      <ValidationSummaryCard
        validationRate={99.0}
        totalRecordsProcessed={1000}
        validRecords={990}
        invalidRecords={10}
      />
    );

    expect(screen.queryByText(/Warning:/i)).not.toBeInTheDocument();
  });

  it('should render "N/A" when metrics are null', () => {
    render(
      <ValidationSummaryCard
        validationRate={null}
        totalRecordsProcessed={null}
        validRecords={null}
        invalidRecords={null}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(4);
  });

  it('should show "Unknown" badge when validation rate is null', () => {
    render(
      <ValidationSummaryCard
        validationRate={null}
        totalRecordsProcessed={null}
        validRecords={null}
        invalidRecords={null}
      />
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should format large numbers with commas', () => {
    render(
      <ValidationSummaryCard
        validationRate={98.5}
        totalRecordsProcessed={1234567}
        validRecords={1216789}
        invalidRecords={17778}
      />
    );

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('1,216,789')).toBeInTheDocument();
    expect(screen.getByText('17,778')).toBeInTheDocument();
  });

  it('should apply correct color classes to valid and invalid records', () => {
    const { container } = render(
      <ValidationSummaryCard
        validationRate={99.0}
        totalRecordsProcessed={1000}
        validRecords={990}
        invalidRecords={10}
      />
    );

    const validRecordsElement = container.querySelector('.text-green-600');
    expect(validRecordsElement).toBeInTheDocument();
    expect(validRecordsElement).toHaveTextContent('990');

    const invalidRecordsElement = container.querySelector('.text-red-600');
    expect(invalidRecordsElement).toBeInTheDocument();
    expect(invalidRecordsElement).toHaveTextContent('10');
  });
});
