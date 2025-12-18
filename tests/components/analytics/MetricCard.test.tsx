/**
 * Component tests for MetricCard
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/analytics/MetricCard';
import { Gamepad2, Trophy } from 'lucide-react';

describe('MetricCard', () => {
  it('should render metric card with title and value', () => {
    render(<MetricCard title="Total Games" value={10} />);

    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render metric card with icon', () => {
    render(<MetricCard title="Total Games" value={10} icon={Gamepad2} />);

    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    // Icon should be present (lucide-react icons render as SVG)
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render percentage value correctly', () => {
    render(
      <MetricCard title="Win Rate" value={75.5} showPercentage icon={Trophy} />
    );

    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('75.5')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('should render value with unit', () => {
    render(
      <MetricCard
        title="Average Duration"
        value={45}
        unit="min"
        icon={Gamepad2}
      />
    );

    expect(screen.getByText('Average Duration')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
  });

  it('should format large numbers with commas', () => {
    render(<MetricCard title="Total Games" value={1234} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <MetricCard
        title="Average Duration"
        value={45}
        description="Average game duration"
      />
    );

    expect(screen.getByText('Average game duration')).toBeInTheDocument();
  });

  it('should apply positive variant styling', () => {
    const { container } = render(
      <MetricCard title="Wins" value={10} variant="positive" />
    );

    const card = container.querySelector('[class*="text-green"]');
    expect(card).toBeInTheDocument();
  });

  it('should apply negative variant styling', () => {
    const { container } = render(
      <MetricCard title="Losses" value={5} variant="negative" />
    );

    const card = container.querySelector('[class*="text-red"]');
    expect(card).toBeInTheDocument();
  });

  it('should apply neutral variant styling', () => {
    const { container } = render(
      <MetricCard title="Games" value={15} variant="neutral" />
    );

    const card = container.querySelector('[class*="text-muted-foreground"]');
    expect(card).toBeInTheDocument();
  });

  it('should apply default variant styling', () => {
    const { container } = render(
      <MetricCard title="Games" value={15} variant="default" />
    );

    const card = container.querySelector('[class*="text-foreground"]');
    expect(card).toBeInTheDocument();
  });

  it('should render trend indicator when provided', () => {
    render(
      <MetricCard title="Win Rate" value={75} trend="up" trendValue="+5.2%" />
    );

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('+5.2%')).toBeInTheDocument();
  });

  it('should render down trend indicator', () => {
    render(
      <MetricCard title="Win Rate" value={70} trend="down" trendValue="-3.1%" />
    );

    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('-3.1%')).toBeInTheDocument();
  });

  it('should render stable trend indicator', () => {
    render(
      <MetricCard title="Win Rate" value={75} trend="stable" trendValue="0%" />
    );

    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(<MetricCard title="Status" value="Active" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MetricCard title="Games" value={10} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(<MetricCard title="Games" value={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle negative values', () => {
    render(<MetricCard title="Change" value={-5} />);

    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('should format percentage with one decimal place', () => {
    render(<MetricCard title="Win Rate" value={66.666} showPercentage />);

    expect(screen.getByText('66.7')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('should not render unit when showPercentage is true', () => {
    render(
      <MetricCard title="Win Rate" value={75} showPercentage unit="games" />
    );

    expect(screen.getByText('%')).toBeInTheDocument();
    // Unit should not be rendered when showPercentage is true
    expect(screen.queryByText('games')).not.toBeInTheDocument();
  });

  it('should apply hover animation when animate is true', () => {
    const { container } = render(
      <MetricCard title="Games" value={10} animate />
    );

    const card = container.querySelector('[class*="hover:shadow-md"]');
    expect(card).toBeInTheDocument();
  });

  it('should not apply hover animation when animate is false', () => {
    const { container } = render(
      <MetricCard title="Games" value={10} animate={false} />
    );

    const card = container.querySelector('[class*="hover:shadow-md"]');
    expect(card).not.toBeInTheDocument();
  });
});
