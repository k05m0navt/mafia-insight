/**
 * RoleComparisonChart - Component for displaying role comparison charts
 *
 * Shows bar charts comparing metrics across roles (win rate, games played,
 * average ELO, win streak) with tooltips and best-performing role highlighting.
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import type { RoleComparisonChartProps } from '@/types/analytics';

/**
 * Metric type for chart display
 */
type MetricType = 'winRate' | 'gamesPlayed' | 'averageELO' | 'winStreak';

/**
 * Custom tooltip for role comparison chart
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-xs text-muted-foreground">
                {entry.name}:
              </span>
              <span className="text-sm font-semibold">
                {entry.dataKey === 'winRate'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.dataKey === 'averageELO'
                    ? Math.round(entry.value).toString()
                    : entry.value.toString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * RoleComparisonChart Component
 */
export function RoleComparisonChart({
  comparison,
  highlightBest = true,
}: RoleComparisonChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | 'all'>(
    'all'
  );

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return comparison.roles.map((role) => ({
      role: role.role,
      winRate: role.winRate,
      gamesPlayed: role.gamesPlayed,
      averageELO: role.averageELO,
      winStreak: role.winStreak,
    }));
  }, [comparison.roles]);

  // Determine which metrics to display
  const metricsToShow = useMemo(() => {
    if (selectedMetric === 'all') {
      return [
        { key: 'winRate', name: 'Win Rate (%)', color: 'hsl(var(--chart-1))' },
        {
          key: 'gamesPlayed',
          name: 'Games Played',
          color: 'hsl(var(--chart-2))',
        },
        {
          key: 'averageELO',
          name: 'Average ELO',
          color: 'hsl(var(--chart-3))',
        },
        {
          key: 'winStreak',
          name: 'Win Streak',
          color: 'hsl(var(--chart-4))',
        },
      ];
    }

    const metricMap: Record<MetricType, { name: string; color: string }> = {
      winRate: { name: 'Win Rate (%)', color: 'hsl(var(--chart-1))' },
      gamesPlayed: { name: 'Games Played', color: 'hsl(var(--chart-2))' },
      averageELO: { name: 'Average ELO', color: 'hsl(var(--chart-3))' },
      winStreak: { name: 'Win Streak', color: 'hsl(var(--chart-4))' },
    };

    return [
      {
        key: selectedMetric,
        name: metricMap[selectedMetric].name,
        color: metricMap[selectedMetric].color,
      },
    ];
  }, [selectedMetric]);

  if (chartData.length === 0) {
    return (
      <Card variant="chart">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium mb-2">No comparison data</p>
            <p className="text-sm text-muted-foreground">
              No role data available for comparison.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get best-performing role index for highlighting
  const _bestRoleIndex = chartData.findIndex(
    (d) => d.role === comparison.bestPerformingRole
  );

  return (
    <Card variant="chart" className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Role Comparison</CardTitle>
            {highlightBest && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Trophy className="h-3 w-3" />
                Best: {comparison.bestPerformingRole}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={selectedMetric === 'winRate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('winRate')}
              className="text-xs"
            >
              Win Rate
            </Button>
            <Button
              variant={selectedMetric === 'gamesPlayed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('gamesPlayed')}
              className="text-xs"
            >
              Games
            </Button>
            <Button
              variant={selectedMetric === 'averageELO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('averageELO')}
              className="text-xs"
            >
              ELO
            </Button>
            <Button
              variant={selectedMetric === 'winStreak' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('winStreak')}
              className="text-xs"
            >
              Streak
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="role"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metricsToShow.map((metric) => (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  name={metric.name}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
                >
                  {highlightBest &&
                    chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.role === comparison.bestPerformingRole
                            ? metric.color
                            : `${metric.color}80` // 50% opacity for non-best
                        }
                      />
                    ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
