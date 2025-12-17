/**
 * ChartContent - Internal component that renders the Recharts chart
 * This is separated to enable lazy loading of the Recharts library
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
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { RoleMetrics } from '@/types/analytics';

interface ChartContentProps {
  chartData: Array<{
    role: string;
    winRate: number;
    gamesPlayed: number;
    averageELO: number;
  }>;
  colors: Record<string, string>;
  bestRole: RoleMetrics | null;
  highlightBest: boolean;
}

/**
 * Custom tooltip for chart
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
      gamesPlayed: number;
      averageELO: number;
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
          <p>
            <span className="text-muted-foreground">Games Played:</span>{' '}
            <span className="font-medium">{data.gamesPlayed}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Average ELO:</span>{' '}
            <span className="font-medium">{data.averageELO.toFixed(0)}</span>
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
export function ChartContent({
  chartData,
  colors,
  bestRole,
  highlightBest,
}: ChartContentProps) {
  return (
    <ResponsiveContainer width="100%" height={400} debounce={300}>
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
          label={{
            value: 'Win Rate (%)',
            angle: -90,
            position: 'insideLeft',
            className: 'text-xs fill-muted-foreground',
          }}
          tick={{ fill: 'currentColor', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="winRate" name="Win Rate (%)" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => {
            const isBest = highlightBest && bestRole?.role === entry.role;
            const baseColor = colors[entry.role] || '#8884d8';

            return (
              <Cell
                key={`cell-${index}`}
                fill={baseColor}
                opacity={isBest ? 1 : 0.7}
                stroke={isBest ? baseColor : 'none'}
                strokeWidth={isBest ? 2 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
