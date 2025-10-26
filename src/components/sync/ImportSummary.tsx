'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ImportSummaryData {
  players: number;
  clubs: number;
  games: number;
  tournaments: number;
}

export interface ImportSummaryProps {
  summary: ImportSummaryData;
  validationRate?: number;
  processedRecords?: number;
  lastSyncTime?: string | null;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function ImportSummary({
  summary,
  validationRate,
  processedRecords,
  lastSyncTime,
}: ImportSummaryProps) {
  const total =
    summary.players + summary.clubs + summary.games + summary.tournaments;

  const stats = [
    { label: 'Players', value: summary.players, color: 'text-blue-600' },
    { label: 'Clubs', value: summary.clubs, color: 'text-green-600' },
    { label: 'Games', value: summary.games, color: 'text-purple-600' },
    {
      label: 'Tournaments',
      value: summary.tournaments,
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>
                {formatNumber(stat.value)}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t space-y-2">
          {processedRecords !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Total Records Processed
              </span>
              <span className="font-medium">
                {formatNumber(processedRecords)}
              </span>
            </div>
          )}

          {processedRecords === undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Records</span>
              <span className="font-medium">{formatNumber(total)}</span>
            </div>
          )}

          {validationRate !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Validation Rate</span>
              <span className="font-medium text-green-600">
                {validationRate.toFixed(1)}%
              </span>
            </div>
          )}

          {lastSyncTime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="font-medium">
                {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
