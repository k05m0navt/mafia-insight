'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { IntegritySummary } from '@/lib/gomafia/import/integrity-checker';

export interface DataIntegrityPanelProps {
  summary: IntegritySummary | null;
}

export function DataIntegrityPanel({ summary }: DataIntegrityPanelProps) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Integrity</CardTitle>
          <CardDescription>Referential integrity checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>No integrity data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPassing = summary.status === 'PASS';
  const statusVariant = isPassing ? 'default' : 'destructive';
  const StatusIcon = isPassing ? CheckCircle : AlertCircle;
  const statusColor = isPassing ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            Data Integrity
          </span>
          <Badge variant={statusVariant}>{summary.status}</Badge>
        </CardTitle>
        <CardDescription>
          Referential integrity and orphaned records checks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Message */}
          <div
            className={`p-3 rounded-md ${isPassing ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
          >
            <p
              className={`text-sm ${isPassing ? 'text-green-800' : 'text-red-800'}`}
            >
              {summary.message}
            </p>
          </div>

          {/* Check Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Total Checks
              </span>
              <span className="text-2xl font-bold">{summary.totalChecks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Passed</span>
              <span className="text-2xl font-bold text-green-600">
                {summary.passedChecks}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Failed</span>
              <span className="text-2xl font-bold text-red-600">
                {summary.failedChecks}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check Progress</span>
              <span className="font-medium">
                {summary.passedChecks} / {summary.totalChecks} checks passed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isPassing ? 'bg-green-600' : 'bg-red-600'}`}
                style={{
                  width: `${(summary.passedChecks / summary.totalChecks) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Issues List */}
          {summary.issues && summary.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-red-800">
                Integrity Issues:
              </h4>
              <ul className="space-y-2">
                {summary.issues.map((issue, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm bg-red-50 p-2 rounded border border-red-200"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Recommendations */}
          {!isPassing && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Recommendation:</strong> Review the issues above and
                consider re-running the import or manually correcting the
                orphaned records.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
