/**
 * WinRateBarChartContent - Lazy-loaded bar chart content using Recharts
 *
 * This component is lazy-loaded to improve initial page load performance.
 * It renders a bar chart comparing win rates across roles.
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PlayerRole } from '@prisma/client';

interface WinRateBarChartContentProps {
  data: Record<string, number>; // role -> win rate percentage
  roles: PlayerRole[];
}

/**
 * Role color mapping
 */
const roleColors: Record<PlayerRole, string> = {
  DON: '#8b5cf6', // Purple
  MAFIA: '#ef4444', // Red
  SHERIFF: '#3b82f6', // Blue
  CITIZEN: '#10b981', // Green
};

/**
 * Custom tooltip for win rate bar chart
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      role: string;
      winRate: number;
    };
  }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{data.role}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Win Rate:</span>{' '}
            <span className="font-medium">{data.winRate.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Chart content component that renders the Recharts bar chart
 */
export function ChartContent({ data, roles }: WinRateBarChartContentProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    return roles.map((role) => ({
      role,
      winRate: data[role] || 0,
    }));
  }, [data, roles]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="role"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          domain={[0, 100]}
          label={{
            value: 'Win Rate (%)',
            angle: -90,
            position: 'insideLeft',
            className: 'text-xs fill-muted-foreground',
          }}
          tick={{ fill: 'currentColor', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="winRate"
          name="Win Rate (%)"
          radius={[8, 8, 0, 0]}
          animationDuration={300}
          animationEasing="ease-in-out"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={roleColors[entry.role as PlayerRole] || '#8884d8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
