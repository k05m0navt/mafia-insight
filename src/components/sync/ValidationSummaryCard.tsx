'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ValidationSummaryCardProps {
  validationRate: number | null;
  totalRecordsProcessed: number | null;
  validRecords: number | null;
  invalidRecords: number | null;
}

export function ValidationSummaryCard({
  validationRate,
  totalRecordsProcessed,
  validRecords,
  invalidRecords,
}: ValidationSummaryCardProps) {
  const formatNumber = (num: number | null) =>
    num !== null ? num.toLocaleString() : 'N/A';

  const formatPercentage = (rate: number | null) =>
    rate !== null ? `${rate.toFixed(2)}%` : 'N/A';

  const getValidationStatus = (
    rate: number | null
  ): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  } => {
    if (rate === null) return { label: 'Unknown', variant: 'secondary' };
    if (rate >= 98) return { label: 'Excellent', variant: 'default' };
    if (rate >= 95) return { label: 'Good', variant: 'outline' };
    return { label: 'Below Threshold', variant: 'destructive' };
  };

  const status = getValidationStatus(validationRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Validation Summary
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardTitle>
        <CardDescription>Data quality and integrity checks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Validation Rate
              </span>
              <span className="text-2xl font-bold">
                {formatPercentage(validationRate)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Total Processed
              </span>
              <span className="text-2xl font-bold">
                {formatNumber(totalRecordsProcessed)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Valid Records
              </span>
              <span className="text-xl font-semibold text-green-600">
                {formatNumber(validRecords)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Invalid Records
              </span>
              <span className="text-xl font-semibold text-red-600">
                {formatNumber(invalidRecords)}
              </span>
            </div>
          </div>

          {validationRate !== null && validationRate < 98 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Validation rate is below the 98%
                threshold. Review import logs for details.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
