/**
 * TrendsChartContent - Lazy-loaded chart content using Recharts
 *
 * This component is lazy-loaded to improve initial page load performance.
 * It renders a multi-line chart showing win rate, ELO, and games played over time.
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
  Legend,
} from 'recharts';
import type { PerformanceTrend } from '@/types/analytics';
import { format } from 'date-fns';

/**
 * Custom tooltip for trends chart
 */
function CustomTooltip({
  active,
  payload,
  label: _label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: PerformanceTrend;
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const startDate = new Date(data.startDate);

    // Format period label based on period type
    let periodLabel: string;
    switch (data.period) {
      case 'week':
        periodLabel = `Week of ${format(startDate, 'MMM d, yyyy')}`;
        break;
      case 'month':
        periodLabel = format(startDate, 'MMMM yyyy');
        break;
      case 'quarter':
        periodLabel = `Q${Math.floor(startDate.getMonth() / 3) + 1} ${format(startDate, 'yyyy')}`;
        break;
      default:
        periodLabel = format(startDate, 'MMM d, yyyy');
    }

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-medium mb-2">{periodLabel}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Win Rate:</span>
            <span className="text-sm font-semibold">
              {data.metrics.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">ELO:</span>
            <span className="text-sm font-semibold">
              {Math.round(data.metrics.elo)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Games:</span>
            <span className="text-sm font-semibold">
              {data.metrics.gamesPlayed}
            </span>
          </div>
          {data.changeFromPrevious !== 0 && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">Change:</span>
              <span
                className={`text-xs font-semibold ${
                  data.changeFromPrevious > 0
                    ? 'text-green-600'
                    : data.changeFromPrevious < 0
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                }`}
              >
                {data.changeFromPrevious > 0 ? '+' : ''}
                {data.changeFromPrevious.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Format date for X-axis based on period
 */
function formatXAxisDate(
  dateStr: string,
  period: 'week' | 'month' | 'quarter'
): string {
  const date = new Date(dateStr);

  switch (period) {
    case 'week':
      return format(date, 'MMM d');
    case 'month':
      return format(date, 'MMM yyyy');
    case 'quarter':
      return `Q${Math.floor(date.getMonth() / 3) + 1}`;
    default:
      return format(date, 'MMM d');
  }
}

/**
 * ChartContent Component
 */
export function ChartContent({
  trends,
  period,
}: {
  trends: PerformanceTrend[];
  period: 'week' | 'month' | 'quarter';
}) {
  // Transform data for Recharts (ensure dates are sorted)
  const chartData = React.useMemo(() => {
    return [...trends]
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .map((trend) => ({
        ...trend,
        date: trend.startDate,
        winRate: trend.metrics.winRate,
        elo: Math.round(trend.metrics.elo),
        gamesPlayed: trend.metrics.gamesPlayed,
      }));
  }, [trends]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data to display
      </div>
    );
  }

  // Calculate Y-axis domains
  const winRateValues = chartData.map((d) => d.winRate);
  const eloValues = chartData.map((d) => d.elo);

  const winRateDomain = [
    Math.max(0, Math.min(...winRateValues) - 5),
    Math.min(100, Math.max(...winRateValues) + 5),
  ];
  const eloMin = Math.min(...eloValues);
  const eloMax = Math.max(...eloValues);
  const eloPadding = (eloMax - eloMin) * 0.1 || 50;
  const eloDomain = [
    Math.max(0, Math.floor(eloMin - eloPadding)),
    Math.ceil(eloMax + eloPadding),
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
          tickFormatter={(dateStr) => formatXAxisDate(dateStr, period)}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          yAxisId="left"
          domain={winRateDomain}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          label={{
            value: 'Win Rate %',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle' },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={eloDomain}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          label={{
            value: 'ELO / Games',
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle' },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="winRate"
          name="Win Rate (%)"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={300}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="elo"
          name="ELO Rating"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={300}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="gamesPlayed"
          name="Games Played"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
