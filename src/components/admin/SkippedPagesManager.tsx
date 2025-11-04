'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  RefreshCw,
  Plus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from '@/components/hooks/use-toast';

interface SkippedPagesData {
  syncLogId: string;
  pages: number[];
  timestamp: Date;
}

interface SkippedPagesManagerProps {
  entityType?: 'players' | 'clubs' | 'tournaments';
  onRetrySuccess?: () => void;
}

export function SkippedPagesManager({
  entityType,
  onRetrySuccess,
}: SkippedPagesManagerProps) {
  const [skippedPages, setSkippedPages] = useState<
    Record<string, SkippedPagesData>
  >({});
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [manualPages, setManualPages] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>(
    entityType || 'players'
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const entityTypes = [
    { id: 'players', label: 'Players', phase: 'PLAYERS' },
    { id: 'clubs', label: 'Clubs', phase: 'CLUBS' },
    { id: 'tournaments', label: 'Tournaments', phase: 'TOURNAMENTS' },
  ];

  useEffect(() => {
    fetchSkippedPages();
  }, [entityType]);

  const fetchSkippedPages = async () => {
    try {
      setLoading(true);
      const url = entityType
        ? `/api/admin/import/skipped-pages?entityType=${entityType}`
        : '/api/admin/import/skipped-pages';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch skipped pages');
      }

      const data = await response.json();
      setSkippedPages(data.skippedPages || {});
    } catch (error) {
      console.error('Error fetching skipped pages:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch skipped pages',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (pages: number[], entity: string) => {
    try {
      setRetrying(true);
      const response = await fetch('/api/admin/import/skipped-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: entity,
          pageNumbers: pages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to retry pages');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description:
          result.message || `Successfully retried ${pages.length} pages`,
      });

      // Refresh skipped pages
      await fetchSkippedPages();
      onRetrySuccess?.();
    } catch (error) {
      console.error('Error retrying pages:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to retry pages. Please try again.',
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleManualRetry = async () => {
    // Parse page numbers from input (support comma-separated or space-separated)
    const pageNumbers = manualPages
      .split(/[,\s]+/)
      .map((p) => parseInt(p.trim()))
      .filter((p) => !isNaN(p) && p > 0);

    if (pageNumbers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please enter valid page numbers',
      });
      return;
    }

    await handleRetry(pageNumbers, selectedEntityType);
    setManualPages('');
    setIsDialogOpen(false);
  };

  const getSkippedPagesForEntity = (entityId: string): number[] => {
    const data = skippedPages[entityId];
    if (!data) return [];

    // Remove duplicates and sort
    return Array.from(new Set(data.pages)).sort((a, b) => a - b);
  };

  const displayedEntities = entityType
    ? [entityTypes.find((e) => e.id === entityType)!]
    : entityTypes;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Skipped Pages
            </CardTitle>
            <CardDescription>
              View and retry pages that were skipped during import
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSkippedPages}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Retry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manually Retry Pages</DialogTitle>
                  <DialogDescription>
                    Enter page numbers to retry manually (comma or space
                    separated)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Entity Type</Label>
                    <select
                      id="entity-type"
                      value={selectedEntityType}
                      onChange={(e) => setSelectedEntityType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {entityTypes.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-numbers">Page Numbers</Label>
                    <Input
                      id="page-numbers"
                      placeholder="796, 850, 920 or 796 850 920"
                      value={manualPages}
                      onChange={(e) => setManualPages(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter page numbers separated by commas or spaces
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleManualRetry} disabled={retrying}>
                    {retrying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Pages
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>Loading skipped pages...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedEntities.map((entity) => {
              const pages = getSkippedPagesForEntity(entity.id);
              const hasPages = pages.length > 0;

              return (
                <div key={entity.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{entity.label}</h3>
                      {hasPages ? (
                        <Badge variant="secondary">{pages.length} pages</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          No skipped pages
                        </Badge>
                      )}
                    </div>
                    {hasPages && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(pages, entity.id)}
                        disabled={retrying}
                      >
                        {retrying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry All
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {hasPages && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Page Number</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pages.map((page) => (
                            <TableRow key={page}>
                              <TableCell className="font-medium">
                                Page {page}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetry([page], entity.id)}
                                  disabled={retrying}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(skippedPages).length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No skipped pages found</p>
                <p className="text-sm mt-2">
                  All pages were successfully scraped in recent imports
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
