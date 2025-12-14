'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ValidationSummary } from '@/hooks/useValidationSummary';
import { useState } from 'react';

export interface ValidationQualityReportProps {
  summary: ValidationSummary | null;
  onContinue?: () => void;
}

export function ValidationQualityReport({
  summary,
  onContinue,
}: ValidationQualityReportProps) {
  const [showContinueDialog, setShowContinueDialog] = useState(false);

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation Quality Report</CardTitle>
          <CardDescription>Data quality validation metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>No validation data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validationRate = summary.validationRate ?? 0;
  const meetsThreshold = summary.meetsThreshold;
  const totalRecords = summary.totalRecords ?? 0;
  const validRecords = summary.validRecords ?? 0;
  const invalidRecords = summary.invalidRecords ?? 0;
  const errorsByEntity = summary.errorsByEntity ?? {};
  const errors = summary.errors ?? [];
  const integrity = summary.integrity;

  // Determine status color and icon
  const statusColor = meetsThreshold ? 'text-green-600' : 'text-red-600';
  const StatusIcon = meetsThreshold ? CheckCircle : XCircle;
  const statusBadgeVariant = meetsThreshold ? 'default' : 'destructive';

  const handleContinue = () => {
    setShowContinueDialog(false);
    onContinue?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            Validation Quality Report
          </span>
          <Badge variant={statusBadgeVariant}>
            {meetsThreshold ? 'Excellent' : 'Warning'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Data quality validation metrics and error details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Rate Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Validation Rate</span>
            <span className={`text-2xl font-bold ${statusColor}`}>
              {validationRate.toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                meetsThreshold ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(validationRate, 100)}%` }}
              role="progressbar"
              aria-valuenow={validationRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Validation rate: ${validationRate}%`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Threshold: 98% (Current: {validationRate.toFixed(2)}%)
          </p>
        </div>

        {/* Record Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Records</span>
            <span className="text-2xl font-bold">
              {totalRecords.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Valid</span>
            <span className="text-2xl font-bold text-green-600">
              {validRecords.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Invalid</span>
            <span className="text-2xl font-bold text-red-600">
              {invalidRecords.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Warning Alert if Threshold Not Met */}
        {!meetsThreshold && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Quality Below Threshold</AlertTitle>
            <AlertDescription>
              Data quality is {validationRate.toFixed(2)}%, which is below the
              required 98% threshold. Please review the errors below before
              continuing.
            </AlertDescription>
          </Alert>
        )}

        {/* Errors by Entity Type */}
        {Object.keys(errorsByEntity).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Errors by Entity Type</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(errorsByEntity).map(([entity, count]) => (
                <div
                  key={entity}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="text-sm capitalize">{entity}</span>
                  <Badge variant="destructive">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrity Check Results */}
        {integrity && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Integrity Check Results</h4>
            <div
              className={`p-3 rounded-md border ${
                integrity.status === 'PASS'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  variant={
                    integrity.status === 'PASS' ? 'default' : 'destructive'
                  }
                >
                  {integrity.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {integrity.message}
              </p>
              {integrity.issues && integrity.issues.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Issues:</p>
                  <ul className="text-xs space-y-1">
                    {integrity.issues.slice(0, 5).map((issue, index) => (
                      <li key={index} className="list-disc list-inside">
                        {issue}
                      </li>
                    ))}
                    {integrity.issues.length > 5 && (
                      <li className="text-muted-foreground">
                        ...and {integrity.issues.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Details Table */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Validation Errors</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[100px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 10).map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">
                        {error.entity}
                      </TableCell>
                      <TableCell className="text-sm">{error.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {error.timestamp
                          ? new Date(error.timestamp).toLocaleTimeString()
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {errors.length > 10 && (
              <p className="text-xs text-muted-foreground">
                Showing 10 of {errors.length} errors
              </p>
            )}
          </div>
        )}

        {/* Continue Anyway Button (if threshold not met) */}
        {!meetsThreshold && onContinue && (
          <div className="pt-4 border-t">
            <AlertDialog
              open={showContinueDialog}
              onOpenChange={setShowContinueDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Continue Anyway
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Continue with Low Quality Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The data quality is {validationRate.toFixed(2)}%, which is
                    below the recommended 98% threshold. Continuing may result
                    in inaccurate analytics. Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleContinue}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Continue Anyway
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
