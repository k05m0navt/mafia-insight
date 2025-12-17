/**
 * ELOTrendsChartContent - Lazy-loaded chart content using Recharts
 *
 * This component is lazy-loaded to improve initial page load performance.
 * It renders the actual Recharts line chart with tooltips and responsive container.
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ELOTrendPoint } from '@/types/analytics';

/**
 * Custom tooltip for ELO trends chart
 */
function CustomTooltip({
  active,
  payload,
  label: _label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ELOTrendPoint;
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-1">{formattedDate}</p>
        <p className="text-lg font-bold text-primary">
          ELO: {Math.round(data.elo)}
        </p>
        {data.gameId && (
          <p className="text-xs text-muted-foreground mt-1">
            Game: {data.gameId.slice(0, 8)}...
          </p>
        )}
      </div>
    );
  }
  return null;
}

/**
 * Format date for X-axis
 */
function formatXAxisDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * ChartContent Component
 */
export function ChartContent({ trends }: { trends: ELOTrendPoint[] }) {
  // Transform data for Recharts (ensure dates are sorted)
  const chartData = React.useMemo(() => {
    return [...trends]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((point) => ({
        date: point.date,
        elo: Math.round(point.elo),
        gameId: point.gameId,
      }));
  }, [trends]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data to display
      </div>
    );
  }

  // Calculate Y-axis domain with some padding
  const eloValues = chartData.map((d) => d.elo);
  const minELO = Math.min(...eloValues);
  const maxELO = Math.max(...eloValues);
  const padding = (maxELO - minELO) * 0.1; // 10% padding
  const yAxisDomain = [
    Math.max(0, Math.floor(minELO - padding)),
    Math.ceil(maxELO + padding),
  ];

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxisDate}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          domain={yAxisDomain}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          label={{
            value: 'ELO Rating',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle' },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="elo"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
          animationDuration={300}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
