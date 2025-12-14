'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { ImportErrorSummaryResponse } from '@/hooks/useImportErrorSummary';
import { ErrorCategory } from '@/lib/gomafia/import/retry-manager';
import { useState } from 'react';

export interface ImportErrorSummaryProps {
  errorSummary: ImportErrorSummaryResponse | null;
  isLoading?: boolean;
}

/**
 * Component to display import error summary with detailed error information.
 * Shows error counts by category and type, skipped entities, and recent errors with expandable details.
 */
export function ImportErrorSummary({
  errorSummary,
  isLoading,
}: ImportErrorSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Summary</CardTitle>
          <CardDescription>Import error tracking and reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Loading error summary...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!errorSummary || errorSummary.errorSummary.totalErrors === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-600" />
            Error Summary
          </CardTitle>
          <CardDescription>Import error tracking and reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {errorSummary?.message ||
                'Import completed successfully with no errors.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { errorSummary: summary } = errorSummary;
  const totalSkipped = Object.values(summary.skippedEntitiesByPhase).reduce(
    (sum, count) => sum + count,
    0
  );

  // Determine severity based on error counts
  const hasErrors = summary.totalErrors > 0;
  const hasPermanentErrors = summary.errorsByCategory.permanent > 0;
  const severity = hasPermanentErrors ? 'destructive' : 'default';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Error Summary
          </span>
          <Badge variant={severity}>
            {summary.totalErrors} Error{summary.totalErrors !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          {errorSummary.message || 'Import error tracking and reporting'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Summary Alert */}
        {hasErrors && (
          <Alert variant={hasPermanentErrors ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorSummary.message ||
                `Import completed with ${summary.totalErrors} error${
                  summary.totalErrors !== 1 ? 's' : ''
                }. ${totalSkipped} entit${totalSkipped !== 1 ? 'ies' : 'y'} skipped.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Counts by Category */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Errors by Category</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <span className="text-blue-600">Transient:</span>
                <span className="font-semibold">
                  {summary.errorsByCategory.transient}
                </span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <span className="text-red-600">Permanent:</span>
                <span className="font-semibold">
                  {summary.errorsByCategory.permanent}
                </span>
              </Badge>
            </div>
          </div>

          {/* Skipped Entities by Phase */}
          {totalSkipped > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Skipped Entities by Phase</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.skippedEntitiesByPhase).map(
                  ([phase, count]) => (
                    <Badge key={phase} variant="secondary">
                      {phase}: {count}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Errors by Type */}
        {Object.keys(summary.errorsByType).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Errors by Type</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.errorsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type}: {count}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Recent Errors Table */}
        {summary.recentErrors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Recent Errors ({summary.recentErrors.length})
            </h3>
            <div className="space-y-2">
              {summary.recentErrors.slice(0, 20).map((error, index) => (
                <ErrorDetailRow key={index} error={error} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Component for displaying individual error details with expandable content
 */
function ErrorDetailRow({
  error,
}: {
  error: ImportErrorSummaryResponse['errorSummary']['recentErrors'][0];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between p-3 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <Badge
            variant={
              error.category === ErrorCategory.PERMANENT
                ? 'destructive'
                : 'outline'
            }
            className="text-xs"
          >
            {error.code}
          </Badge>
          <span className="text-sm truncate">{error.message}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(error.timestamp).toLocaleString()}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        )}
      </Button>
      {isExpanded && (
        <div className="p-4 pt-0 space-y-2 text-sm border-t">
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-32">Phase</TableHead>
                <TableCell>{error.phase}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableCell>
                  <Badge
                    variant={
                      error.category === ErrorCategory.PERMANENT
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {error.category}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableCell>{error.type}</TableCell>
              </TableRow>
              {error.entityId && (
                <TableRow>
                  <TableHead>Entity ID</TableHead>
                  <TableCell className="font-mono text-xs">
                    {error.entityId}
                  </TableCell>
                </TableRow>
              )}
              {error.entityType && (
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableCell>{error.entityType}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableCell>
                  {new Date(error.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {error.stackTrace && (
            <div className="mt-2">
              <h4 className="text-xs font-medium mb-1">Stack Trace:</h4>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {error.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
