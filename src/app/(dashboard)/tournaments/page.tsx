'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { TournamentCard } from '@/components/analytics/TournamentCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterCard } from '@/components/ui/FilterCard';
import { DataTransition } from '@/components/ui/DataTransition';
import { Input } from '@/components/ui/input';
import { PageLoading, PageError } from '@/components/ui/PageLoading';
import { SortableToolbar } from '@/components/ui/SortableToolbar';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  maxParticipants?: number;
  entryFee?: number;
  prizePool?: number;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  games: Array<{
    id: string;
    date: string;
    status: string;
    winnerTeam?: string;
  }>;
  _count: {
    games: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function TournamentsPageContent() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    searchParams.get('status') || null
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'startDate'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
  );
  const [minPrizePool, setMinPrizePool] = useState<string>(
    searchParams.get('minPrizePool') || ''
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get('startDate') || ''
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get('endDate') || ''
  );

  // Track if this is the initial mount to prevent loops
  const isInitialMount = useRef(true);
  const skipNextUrlUpdate = useRef(false);

  // Sync state from URL params on mount or URL change (from browser navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlStatus = searchParams.get('status') || null;
    const urlSortBy = searchParams.get('sortBy') || 'startDate';
    const urlSortOrder = searchParams.get('sortOrder') || 'desc';
    const urlMinPrizePool = searchParams.get('minPrizePool') || '';
    const urlStartDate = searchParams.get('startDate') || '';
    const urlEndDate = searchParams.get('endDate') || '';

    // On initial mount, just sync from URL
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (urlSearch !== search) setSearch(urlSearch);
      if (urlPage !== currentPage) setCurrentPage(urlPage);
      if (urlStatus !== selectedStatus) setSelectedStatus(urlStatus);
      if (urlSortBy !== sortBy) setSortBy(urlSortBy);
      if (urlSortOrder !== sortOrder) setSortOrder(urlSortOrder);
      if (urlMinPrizePool !== minPrizePool) setMinPrizePool(urlMinPrizePool);
      if (urlStartDate !== startDate) setStartDate(urlStartDate);
      if (urlEndDate !== endDate) setEndDate(urlEndDate);
      return;
    }

    // On subsequent URL changes, sync state
    if (!skipNextUrlUpdate.current) {
      if (urlSearch !== search) setSearch(urlSearch);
      if (urlPage !== currentPage) setCurrentPage(urlPage);
      if (urlStatus !== selectedStatus) setSelectedStatus(urlStatus);
      if (urlSortBy !== sortBy) setSortBy(urlSortBy);
      if (urlSortOrder !== sortOrder) setSortOrder(urlSortOrder);
      if (urlMinPrizePool !== minPrizePool) setMinPrizePool(urlMinPrizePool);
      if (urlStartDate !== startDate) setStartDate(urlStartDate);
      if (urlEndDate !== endDate) setEndDate(urlEndDate);
    }
    skipNextUrlUpdate.current = false;
  }, [
    searchParams,
    search,
    currentPage,
    selectedStatus,
    sortBy,
    sortOrder,
    minPrizePool,
    startDate,
    endDate,
  ]);

  // Sync URL params when state changes (user interactions)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedStatus) params.set('status', selectedStatus);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== 'startDate') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (minPrizePool) params.set('minPrizePool', minPrizePool);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Only update URL if it's different (avoid infinite loops)
    if (newUrl !== currentUrl) {
      skipNextUrlUpdate.current = true;
      router.replace(newUrl, { scroll: false });
    }
  }, [
    search,
    selectedStatus,
    currentPage,
    sortBy,
    sortOrder,
    minPrizePool,
    startDate,
    endDate,
    pathname,
    router,
    searchParams,
  ]);

  const fetchTournaments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (selectedStatus) params.append('status', selectedStatus);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (minPrizePool) params.append('minPrizePool', minPrizePool);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/tournaments?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch tournaments');
        }
      } else {
        const data = await response.json();
        setTournaments(data.data || data.tournaments || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    minPrizePool,
    pageSize,
    search,
    selectedStatus,
    sortBy,
    sortOrder,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchTournaments();
    }
  }, [fetchTournaments, permissionsLoading]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
      case 'minPrizePool':
        setMinPrizePool(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleSort = (sortByValue: string, sortOrderValue: 'asc' | 'desc') => {
    setSortBy(sortByValue);
    setSortOrder(sortOrderValue);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleViewAnalytics = (tournamentId: string) => {
    window.location.href = `/tournaments/${tournamentId}`;
  };

  const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  // Show minimal loading while permissions are being checked (prevent flash)
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-8 h-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-primary border-t-transparent"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission (check BEFORE any content)
  // Admin users should always have access, so double-check with role
  const hasAccess = canAccessPage('/tournaments') || currentRole === 'admin';
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tournaments</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-red-500">🚫</span>
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You do not have permission to view tournaments. Your current
                role is <strong>{currentRole}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                {currentRole === 'guest'
                  ? 'Please sign in to access this page.'
                  : 'Please contact an administrator if you believe this is an error.'}
              </p>
              <div className="flex gap-2">
                {currentRole === 'guest' && (
                  <Button asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant={currentRole === 'guest' ? 'outline' : 'default'}
                >
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show page loading skeleton only on initial load
  if (loading && tournaments.length === 0 && !error) {
    return (
      <PageLoading
        title="Tournaments"
        showSearch={true}
        showFilters={true}
        cardCount={6}
      />
    );
  }

  if (error && tournaments.length === 0) {
    return (
      <PageError
        title="Error Loading Tournaments"
        message={error}
        onRetry={fetchTournaments}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tournaments</h1>
        </div>

        {/* Filters */}
        <FilterCard
          title="Filters"
          collapsible={true}
          defaultCollapsed={false}
          onClearAll={() => {
            setSearch('');
            setSelectedStatus(null);
            setMinPrizePool('');
            setStartDate('');
            setEndDate('');
            setSortBy('startDate');
            setSortOrder('desc');
            setCurrentPage(1);
          }}
          activeFilters={
            [
              search && {
                key: 'search',
                label: 'Search',
                value: search,
                onRemove: () => handleSearch(''),
              },
              selectedStatus && {
                key: 'status',
                label: 'Status',
                value: selectedStatus.replace('_', ' '),
                onRemove: () => handleStatusChange(null),
              },
              minPrizePool && {
                key: 'minPrizePool',
                label: 'Min Prize Pool',
                value: `$${parseInt(minPrizePool).toLocaleString()}+`,
                onRemove: () => handleFilterChange('minPrizePool', ''),
              },
              startDate && {
                key: 'startDate',
                label: 'Start Date',
                value: new Date(startDate).toLocaleDateString(),
                onRemove: () => handleFilterChange('startDate', ''),
              },
              endDate && {
                key: 'endDate',
                label: 'End Date',
                value: new Date(endDate).toLocaleDateString(),
                onRemove: () => handleFilterChange('endDate', ''),
              },
              sortBy !== 'startDate' && {
                key: 'sortBy',
                label: 'Sort By',
                value: sortBy,
                onRemove: () => handleFilterChange('sortBy', 'startDate'),
              },
              sortOrder !== 'desc' && {
                key: 'sortOrder',
                label: 'Order',
                value: sortOrder === 'asc' ? 'Ascending' : 'Descending',
                onRemove: () => handleFilterChange('sortOrder', 'desc'),
              },
            ].filter(Boolean) as Array<{
              key: string;
              label: string;
              value: string;
              onRemove: () => void;
            }>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <SearchInput
                placeholder="Search tournaments..."
                onSearch={handleSearch}
                debounceMs={600}
                value={search}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={selectedStatus || 'all'}
                onValueChange={(value) =>
                  handleStatusChange(value === 'all' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={startDate || undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Prize Pool</label>
              <Select
                value={minPrizePool || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'minPrizePool',
                    value === 'all' ? '' : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="100">$100+</SelectItem>
                  <SelectItem value="500">$500+</SelectItem>
                  <SelectItem value="1000">$1,000+</SelectItem>
                  <SelectItem value="2500">$2,500+</SelectItem>
                  <SelectItem value="5000">$5,000+</SelectItem>
                  <SelectItem value="10000">$10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="prizePool">Prize Pool</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select
                value={sortOrder}
                onValueChange={(value) =>
                  handleFilterChange('sortOrder', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterCard>

        {/* Sortable Toolbar */}
        {tournaments.length > 0 && (
          <SortableToolbar
            sortOptions={[
              { key: 'startDate', label: 'Start Date' },
              { key: 'name', label: 'Name' },
              { key: 'prizePool', label: 'Prize Pool' },
              { key: 'status', label: 'Status' },
            ]}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder as 'asc' | 'desc'}
            onSort={handleSort}
          />
        )}

        <DataTransition>
          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No tournaments found</p>
                  {(search ||
                    selectedStatus ||
                    minPrizePool ||
                    startDate ||
                    endDate) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your filters
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onViewAnalytics={handleViewAnalytics}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={
                            currentPage <= 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          if (page === 1 || page === pagination.totalPages)
                            return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsisBefore =
                            prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(page);
                                  }}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </React.Fragment>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < pagination.totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={
                            currentPage >= pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {pagination && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Showing {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, pagination.total)} of{' '}
                  {pagination.total} tournaments
                </div>
              )}
            </>
          )}
        </DataTransition>

        {/* Show error message if there's an error but we have existing data */}
        {error && tournaments.length > 0 && (
          <div className="mt-4">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-destructive">Error: {error}</p>
                  <Button
                    onClick={fetchTournaments}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TournamentsPageContent />
    </Suspense>
  );
}
