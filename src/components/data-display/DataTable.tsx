'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: Record<string, unknown>[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onRefresh?: () => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: (row: Record<string, unknown>) => React.ReactNode;
}

export function DataTable({
  title,
  columns,
  data,
  pagination,
  loading = false,
  error = null,
  onPageChange,
  onSearch,
  onSort,
  onRefresh,
  searchPlaceholder = 'Search...',
  filters,
  actions,
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleSort = (field: string) => {
    const newOrder =
      sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  const renderCell = (column: Column, row: Record<string, unknown>) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    return String(value ?? '');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        {(onSearch || filters) && (
          <div className="mb-4 space-y-4">
            {onSearch && (
              <SearchInput
                placeholder={searchPlaceholder}
                value={search}
                onSearch={handleSearch}
                debounceMs={300}
              />
            )}
            {filters && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                {filters}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No data found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>
                      {column.sortable && onSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-medium"
                        >
                          {column.label}
                          {sortField === column.key &&
                            (sortOrder === 'asc' ? (
                              <SortAsc className="ml-2 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-2 h-4 w-4" />
                            ))}
                        </Button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ))}
                  {actions && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={String(row.id) || `row-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {renderCell(column, row)}
                      </TableCell>
                    ))}
                    {actions && <TableCell>{actions(row)}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasPrev && onPageChange) {
                            onPageChange(pagination.page - 1);
                          }
                        }}
                        className={
                          !pagination.hasPrev
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (onPageChange) {
                                  onPageChange(page);
                                }
                              }}
                              isActive={page === pagination.page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasNext && onPageChange) {
                            onPageChange(pagination.page + 1);
                          }
                        }}
                        className={
                          !pagination.hasNext
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="mt-2 text-center text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total} results
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
