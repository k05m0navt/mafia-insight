/**
 * WinLossPieChartContent - Lazy-loaded pie chart content using Recharts
 *
 * This component is lazy-loaded to improve initial page load performance.
 * It renders a pie chart showing win/loss distribution.
 */

'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface WinLossPieChartContentProps {
  wins: number;
  losses: number;
}

const COLORS = {
  wins: '#10b981', // Green
  losses: '#ef4444', // Red
};

/**
 * Custom tooltip for win/loss pie chart
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      percentage: number;
    };
  }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Count:</span>{' '}
            <span className="font-medium">{data.value}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Percentage:</span>{' '}
            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Chart content component that renders the Recharts pie chart
 */
export function ChartContent({ wins, losses }: WinLossPieChartContentProps) {
  const total = wins + losses;

  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    if (total === 0) {
      return [];
    }

    return [
      {
        name: 'Wins',
        value: wins,
        percentage: (wins / total) * 100,
      },
      {
        name: 'Losses',
        value: losses,
        percentage: (losses / total) * 100,
      },
    ];
  }, [wins, losses, total]);

  if (chartData.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent, payload }) => {
            const percentage =
              percent !== undefined
                ? percent * 100
                : (payload?.percentage ?? 0);
            return `${name}: ${percentage.toFixed(1)}%`;
          }}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          animationDuration={300}
          animationEasing="ease-in-out"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.name === 'Wins' ? COLORS.wins : COLORS.losses}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
