'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceChartProps {
  data: Array<{
    date: string;
    value: number;
    change?: number;
  }>;
  title?: string;
  metric?: string;
}

export function PerformanceChart({
  data,
  title = 'Performance Trend',
  metric = 'ELO Rating',
}: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No data available for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{metric}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {data[data.length - 1]?.value}
              </span>
              {data[data.length - 1]?.change && (
                <span
                  className={`text-sm ${
                    data[data.length - 1].change! > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {data[data.length - 1].change! > 0 ? '+' : ''}
                  {data[data.length - 1].change}
                </span>
              )}
            </div>
          </div>

          <div className="h-32 flex items-end gap-1">
            {data.map((point, index) => {
              const height =
                range > 0 ? ((point.value - minValue) / range) * 100 : 50;
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary rounded-t-sm transition-all hover:bg-primary/80"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.value}`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
