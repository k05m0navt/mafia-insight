'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  actionType: string;
  adminUserId: string;
  targetUserId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    name: string;
  };
  target?: {
    id: string;
    email: string;
    name: string;
  } | null;
}

interface AuditLogResponse {
  entries: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/admin/audit-log?${params}`);
      const data: AuditLogResponse | ApiErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        throw new Error(
          errorData.error || errorData.message || 'Failed to fetch audit logs'
        );
      }

      setEntries(data.entries);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleDateFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  const getActionTypeLabel = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (isLoading && entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Loading audit logs...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          View all administrative actions and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Complete history of administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleDateFilter} className="w-full sm:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                Apply Filter
              </Button>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && entries.length > 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No audit log entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(
                          new Date(entry.createdAt),
                          'MMM d, yyyy HH:mm:ss'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {getActionTypeLabel(entry.actionType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.admin.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.admin.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.target ? (
                          <div>
                            <div className="font-medium">
                              {entry.target.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.target.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.oldValue && entry.newValue ? (
                          <div className="text-sm">
                            <span className="text-red-600 line-through">
                              {entry.oldValue}
                            </span>
                            {' → '}
                            <span className="text-green-600 font-medium">
                              {entry.newValue}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={
                    pagination.page >= pagination.totalPages || isLoading
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
