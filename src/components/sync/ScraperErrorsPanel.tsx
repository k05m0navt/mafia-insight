'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileX,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScraperErrorData {
  errorSummary?: {
    totalErrors: number;
    errorsByPhase: Record<string, number>;
    errorsByCode: Record<string, number>;
    criticalErrors: number;
    retriedErrors: number;
  };
  skippedPages?: Record<string, number[]>;
  integrity?: unknown;
  message?: string;
  errors?: Array<{
    code?: string;
    message?: string;
    phase?: string;
    context?: Record<string, unknown>;
    timestamp?: string;
    willRetry?: boolean;
  }>;
}

export interface ScraperErrorsPanelProps {
  errorData: ScraperErrorData | null;
  className?: string;
}

export function ScraperErrorsPanel({
  errorData,
  className,
}: ScraperErrorsPanelProps) {
  if (!errorData) {
    return null;
  }

  const { errorSummary, skippedPages, errors, message } = errorData;

  // If there's nothing to show, don't render
  if (!errorSummary && !skippedPages && !errors?.length && !message) {
    return null;
  }

  const hasErrors = (errorSummary?.totalErrors ?? 0) > 0;
  const hasSkippedPages = skippedPages && Object.keys(skippedPages).length > 0;

  return (
    <Card className={cn('border-orange-200 bg-orange-50/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Scraper Errors & Issues
        </CardTitle>
        <CardDescription>
          Detailed information about mistakes and issues encountered during the
          import process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue={
            hasErrors ? 'errors' : hasSkippedPages ? 'pages' : 'summary'
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="errors">
              Errors
              {errorSummary?.totalErrors ? (
                <Badge variant="destructive" className="ml-2">
                  {errorSummary.totalErrors}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="pages">
              Skipped Pages
              {hasSkippedPages ? (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(skippedPages).flat().length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {message && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Status Message</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {errorSummary && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Error Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-md border">
                    <div className="text-xs text-muted-foreground">
                      Total Errors
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {errorSummary.totalErrors}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <div className="text-xs text-muted-foreground">
                      Critical
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {errorSummary.criticalErrors}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <div className="text-xs text-muted-foreground">Retried</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {errorSummary.retriedErrors}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <div className="text-xs text-muted-foreground">
                      Unique Codes
                    </div>
                    <div className="text-2xl font-bold">
                      {Object.keys(errorSummary.errorsByCode).length}
                    </div>
                  </div>
                </div>

                {/* Errors by Phase */}
                {Object.keys(errorSummary.errorsByPhase).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Errors by Phase</h5>
                    <div className="space-y-1">
                      {Object.entries(errorSummary.errorsByPhase).map(
                        ([phase, count]) => (
                          <div
                            key={phase}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <span className="text-sm font-mono">{phase}</span>
                            <Badge variant="destructive">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Top Error Codes */}
                {Object.keys(errorSummary.errorsByCode).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Top Error Codes</h5>
                    <div className="space-y-1">
                      {Object.entries(errorSummary.errorsByCode)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([code, count]) => (
                          <div
                            key={code}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <code className="text-xs font-mono">{code}</code>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasSkippedPages && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileX className="h-4 w-4 text-orange-500" />
                  Skipped Pages Summary
                </h4>
                <div className="space-y-1">
                  {Object.entries(skippedPages).map(([phase, pages]) => (
                    <div
                      key={phase}
                      className="p-2 bg-white rounded border text-sm"
                    >
                      <div className="font-mono text-xs text-muted-foreground">
                        {phase}
                      </div>
                      <div className="text-sm">
                        {pages.length} page{pages.length !== 1 ? 's' : ''}{' '}
                        skipped
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-2">
            {errors && errors.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {errors.map((error, index) => (
                  <Alert
                    key={index}
                    variant={error.willRetry ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    <div className="flex items-start gap-2">
                      {error.willRetry ? (
                        <RefreshCw className="h-4 w-4 text-orange-500" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {error.code && (
                            <Badge variant="outline" className="text-xs">
                              {error.code}
                            </Badge>
                          )}
                          {error.phase && (
                            <Badge variant="secondary" className="text-xs">
                              {error.phase}
                            </Badge>
                          )}
                          {error.willRetry && (
                            <Badge variant="default" className="text-xs">
                              Will Retry
                            </Badge>
                          )}
                        </div>
                        <AlertDescription className="mt-1">
                          {error.message}
                        </AlertDescription>
                        {error.context &&
                          Object.keys(error.context).length > 0 && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View Context
                              </summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        {error.timestamp && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : errorSummary && errorSummary.totalErrors > 0 ? (
              <Alert>
                <AlertDescription>
                  Error summary available but detailed error list is not
                  provided. Check the summary tab for error statistics.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  No detailed errors recorded.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Skipped Pages Tab */}
          <TabsContent value="pages" className="space-y-3">
            {hasSkippedPages ? (
              <div className="space-y-3">
                {Object.entries(skippedPages).map(([phase, pages]) => (
                  <div key={phase} className="space-y-2">
                    <h5 className="text-sm font-semibold flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      {phase}
                    </h5>
                    <div className="p-3 bg-white rounded border">
                      <div className="text-sm text-muted-foreground mb-2">
                        {pages.length} page{pages.length !== 1 ? 's' : ''}{' '}
                        skipped
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pages.map((page) => (
                          <Badge key={page} variant="secondary">
                            Page {page}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>About Skipped Pages</AlertTitle>
                  <AlertDescription className="text-xs">
                    These pages were skipped during scraping due to errors or
                    timeouts. You can retry the import to attempt fetching these
                    pages again.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert>
                <AlertDescription>No pages were skipped.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
