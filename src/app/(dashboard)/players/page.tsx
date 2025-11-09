'use client';

import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useTransition,
  useRef,
  useMemo,
  memo,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Input component not used in this implementation
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/badge';
import { FilterCard } from '@/components/ui/FilterCard';
import { DataTransition } from '@/components/ui/DataTransition';
import { SortableTableHead } from '@/components/ui/SortableTableHead';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PageLoading, PageError } from '@/components/ui/PageLoading';

interface Player {
  id: string;
  gomafiaId: string;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  clubId?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PlayersResponse {
  players: Player[];
  pagination: PaginationData;
}

// Table skeleton component - defined outside to avoid React warning
function PlayersTableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
  return (
    <>
      {Array.from({ length: pageSize }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Memoized header component - only re-renders when loading changes
function PageHeaderComponent({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Players</h1>
      <Button onClick={onRefresh} variant="outline" disabled={loading}>
        <RefreshCw
          className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
    </div>
  );
}

const PageHeader = memo(PageHeaderComponent);
PageHeader.displayName = 'PageHeader';

// Memoized table row component - prevents re-rendering of individual rows
function PlayerRowComponent({ player }: { player: Player }) {
  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Synced
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TableRow key={player.id} className="transition-colors hover:bg-muted/50">
      <TableCell className="font-medium">
        <Link
          href={`/players/${player.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          {player.name}
        </Link>
      </TableCell>
      <TableCell>{player.eloRating}</TableCell>
      <TableCell>{player.totalGames}</TableCell>
      <TableCell>{player.wins}</TableCell>
      <TableCell>{player.losses}</TableCell>
      <TableCell>{getSyncStatusBadge(player.syncStatus)}</TableCell>
      <TableCell>{formatDate(player.lastSyncAt)}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/players/${player.id}`}>View</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

const PlayerRow = memo(PlayerRowComponent);
PlayerRow.displayName = 'PlayerRow';

// Memoized table component - only re-renders when players, loading, or pagination changes
function PlayersTableComponent({
  players,
  loading,
  pagination,
  pageSize,
  search,
  syncStatus,
  clubId,
  sortBy,
  sortOrder,
  onPageChange,
  onSort,
}: {
  players: Player[];
  loading: boolean;
  pagination: PaginationData | null;
  pageSize: number;
  search: string;
  syncStatus: string;
  clubId: string;
  sortBy: string;
  sortOrder: string;
  onPageChange: (page: number) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players ({pagination?.total || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="name"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                Name
              </SortableTableHead>
              <SortableTableHead
                sortKey="eloRating"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                ELO Rating
              </SortableTableHead>
              <SortableTableHead
                sortKey="totalGames"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                Games
              </SortableTableHead>
              <SortableTableHead
                sortKey="wins"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                Wins
              </SortableTableHead>
              <SortableTableHead
                sortKey="losses"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                Losses
              </SortableTableHead>
              <TableHead>Sync Status</TableHead>
              <SortableTableHead
                sortKey="lastSyncAt"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder as 'asc' | 'desc'}
                onSort={onSort}
              >
                Last Sync
              </SortableTableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && players.length === 0 ? (
              <PlayersTableSkeleton pageSize={pageSize} />
            ) : loading && players.length > 0 ? (
              <PlayersTableSkeleton pageSize={pageSize} />
            ) : players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-gray-500">No players found</p>
                  {(search || syncStatus || clubId) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your filters
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              players.map((player) => (
                <PlayerRow key={player.id} player={player} />
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} players
              </div>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (pagination.hasPrev) {
                        onPageChange(pagination.page - 1);
                      }
                    }}
                    className={
                      !pagination.hasPrev
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (page === 1 || page === pagination.totalPages)
                      return true;
                    if (Math.abs(page - pagination.page) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsisBefore = prevPage && page - prevPage > 1;

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
                              onPageChange(page);
                            }}
                            isActive={page === pagination.page}
                            className="cursor-pointer"
                            aria-disabled={loading}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (pagination.hasNext) {
                        onPageChange(pagination.page + 1);
                      }
                    }}
                    className={
                      !pagination.hasNext
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PlayersTable = memo(PlayersTableComponent);
PlayersTable.displayName = 'PlayersTable';

// Memoized filters component
function PlayersFiltersComponent({
  search,
  syncStatus,
  clubId: _clubId,
  sortBy,
  sortOrder,
  onSearch,
  onFilterChange,
}: {
  search: string;
  syncStatus: string;
  clubId: string;
  sortBy: string;
  sortOrder: string;
  onSearch: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <SearchInput
          placeholder="Search players..."
          onSearch={onSearch}
          debounceMs={600}
          value={search}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sync Status</label>
        <Select
          value={syncStatus || 'all'}
          onValueChange={(value) =>
            onFilterChange('syncStatus', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SYNCED">Synced</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sort By</label>
        <Select
          value={sortBy}
          onValueChange={(value) => onFilterChange('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="eloRating">ELO Rating</SelectItem>
            <SelectItem value="totalGames">Total Games</SelectItem>
            <SelectItem value="wins">Wins</SelectItem>
            <SelectItem value="losses">Losses</SelectItem>
            <SelectItem value="lastSyncAt">Last Sync</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sort Order</label>
        <Select
          value={sortOrder}
          onValueChange={(value) => onFilterChange('sortOrder', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const PlayersFilters = memo(PlayersFiltersComponent);
PlayersFilters.displayName = 'PlayersFilters';

function PlayersPageContent() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [_isPending, startTransition] = useTransition();

  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params - only on mount
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [syncStatus, setSyncStatus] = useState<string>(
    () => searchParams.get('syncStatus') || ''
  );
  const [clubId, setClubId] = useState<string>(
    () => searchParams.get('clubId') || ''
  );
  const [sortBy, setSortBy] = useState<string>(
    () => searchParams.get('sortBy') || 'lastSyncAt'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    () => searchParams.get('sortOrder') || 'desc'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(() =>
    parseInt(searchParams.get('page') || '1')
  );
  const [pageSize] = useState(10);

  // Create query string helper
  const createQueryString = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  // Update URL without causing full page reload - use shallow routing
  const updateURL = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const queryString = createQueryString(updates);
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

      // Only update if URL actually changed
      if (newUrl !== currentUrl) {
        // Use router.replace with scroll: false for shallow routing
        // This updates the URL without causing a full page reload
        startTransition(() => {
          router.replace(newUrl, { scroll: false });
        });
      }
    },
    [createQueryString, pathname, searchParams, router]
  );

  // Fetch players function
  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (syncStatus) params.append('syncStatus', syncStatus);
      if (clubId) params.append('clubId', clubId);

      const response = await fetch(`/api/players?${params}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch players');
        }
      } else {
        const data: PlayersResponse = await response.json();
        setPlayers(data.players);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, syncStatus, clubId, sortBy, sortOrder]);

  // Fetch players when filters change
  useEffect(() => {
    if (!permissionsLoading) {
      fetchPlayers();
    }
  }, [fetchPlayers, permissionsLoading]);

  // Track if we're updating from user interaction to prevent loops
  const isUpdatingFromUser = useRef(false);

  // Sync URL params from browser navigation (back/forward)
  // This effect only runs when searchParams changes from browser navigation
  // and updates local state to match the URL
  useEffect(() => {
    // Skip if we just updated from user interaction
    if (isUpdatingFromUser.current) {
      isUpdatingFromUser.current = false;
      return;
    }

    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlSyncStatus = searchParams.get('syncStatus') || '';
    const urlClubId = searchParams.get('clubId') || '';
    const urlSortBy = searchParams.get('sortBy') || 'lastSyncAt';
    const urlSortOrder = searchParams.get('sortOrder') || 'desc';

    // Only update state if URL params differ from current state
    // This handles browser back/forward navigation
    // Batch state updates to prevent multiple re-renders
    const updates: Array<() => void> = [];

    if (urlSearch !== search) updates.push(() => setSearch(urlSearch));
    if (urlPage !== currentPage) updates.push(() => setCurrentPage(urlPage));
    if (urlSyncStatus !== syncStatus)
      updates.push(() => setSyncStatus(urlSyncStatus));
    if (urlClubId !== clubId) updates.push(() => setClubId(urlClubId));
    if (urlSortBy !== sortBy) updates.push(() => setSortBy(urlSortBy));
    if (urlSortOrder !== sortOrder)
      updates.push(() => setSortOrder(urlSortOrder));

    // Apply all updates in a single batch
    if (updates.length > 0) {
      startTransition(() => {
        updates.forEach((update) => update());
      });
    }
  }, [
    searchParams,
    search,
    currentPage,
    syncStatus,
    clubId,
    sortBy,
    sortOrder,
    startTransition,
  ]);

  const handleSearch = useCallback(
    (value: string) => {
      isUpdatingFromUser.current = true;
      setSearch(value);
      setCurrentPage(1);
      updateURL({
        search: value || null,
        page: 1,
      });
    },
    [updateURL]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      isUpdatingFromUser.current = true;
      const updates: Record<string, string | number | null> = {};

      switch (key) {
        case 'syncStatus':
          setSyncStatus(value);
          updates.syncStatus = value || null;
          break;
        case 'clubId':
          setClubId(value);
          updates.clubId = value || null;
          break;
        case 'sortBy':
          setSortBy(value);
          updates.sortBy = value;
          break;
        case 'sortOrder':
          setSortOrder(value);
          updates.sortOrder = value;
          break;
      }

      setCurrentPage(1);
      updates.page = 1;
      updateURL(updates);
    },
    [updateURL]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      isUpdatingFromUser.current = true;
      setCurrentPage(page);
      updateURL({ page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateURL]
  );

  const handleClearFilters = useCallback(() => {
    isUpdatingFromUser.current = true;
    setSearch('');
    setSyncStatus('');
    setClubId('');
    setSortBy('lastSyncAt');
    setSortOrder('desc');
    setCurrentPage(1);
    updateURL({
      search: null,
      syncStatus: null,
      clubId: null,
      sortBy: null,
      sortOrder: null,
      page: 1,
    });
  }, [updateURL]);

  // Memoize remove handlers to keep them stable
  const removeSearchFilter = useCallback(
    () => handleSearch(''),
    [handleSearch]
  );
  const removeSyncStatusFilter = useCallback(
    () => handleFilterChange('syncStatus', ''),
    [handleFilterChange]
  );
  const removeClubFilter = useCallback(
    () => handleFilterChange('clubId', ''),
    [handleFilterChange]
  );
  const removeSortByFilter = useCallback(
    () => handleFilterChange('sortBy', 'lastSyncAt'),
    [handleFilterChange]
  );
  const removeSortOrderFilter = useCallback(
    () => handleFilterChange('sortOrder', 'desc'),
    [handleFilterChange]
  );

  // Memoize activeFilters array to prevent FilterCard re-renders
  const activeFilters = useMemo(() => {
    return [
      search && {
        key: 'search',
        label: 'Search',
        value: search,
        onRemove: removeSearchFilter,
      },
      syncStatus && {
        key: 'syncStatus',
        label: 'Sync Status',
        value: syncStatus,
        onRemove: removeSyncStatusFilter,
      },
      clubId && {
        key: 'clubId',
        label: 'Club',
        value: clubId,
        onRemove: removeClubFilter,
      },
      sortBy !== 'lastSyncAt' && {
        key: 'sortBy',
        label: 'Sort By',
        value: sortBy,
        onRemove: removeSortByFilter,
      },
      sortOrder !== 'desc' && {
        key: 'sortOrder',
        label: 'Sort Order',
        value: sortOrder === 'asc' ? 'Ascending' : 'Descending',
        onRemove: removeSortOrderFilter,
      },
    ].filter(Boolean) as Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }>;
  }, [
    search,
    syncStatus,
    clubId,
    sortBy,
    sortOrder,
    removeSearchFilter,
    removeSyncStatusFilter,
    removeClubFilter,
    removeSortByFilter,
    removeSortOrderFilter,
  ]);

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
  const hasAccess = canAccessPage('/players') || currentRole === 'admin';
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Players</h1>
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
                You do not have permission to view players. Your current role is{' '}
                <strong>{currentRole}</strong>.
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

  // Show page loading skeleton only on initial load (when no players data exists)
  // After initial load, show filters and let table handle loading state internally
  if (loading && players.length === 0 && !error) {
    return (
      <PageLoading
        title="Players"
        showSearch={true}
        showFilters={true}
        cardCount={8}
      />
    );
  }

  if (error && players.length === 0) {
    return (
      <PageError
        title="Error Loading Players"
        message={error}
        onRetry={fetchPlayers}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={fetchPlayers} loading={loading} />

      {/* Filters */}
      <FilterCard
        title="Filters"
        collapsible={true}
        defaultCollapsed={false}
        onClearAll={handleClearFilters}
        activeFilters={activeFilters}
      >
        <PlayersFilters
          search={search}
          syncStatus={syncStatus}
          clubId={clubId}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
      </FilterCard>

      {/* Players Table */}
      <DataTransition>
        <PlayersTable
          players={players}
          loading={loading}
          pagination={pagination}
          pageSize={pageSize}
          search={search}
          syncStatus={syncStatus}
          clubId={clubId}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onSort={(newSortBy, newSortOrder) => {
            handleFilterChange('sortBy', newSortBy);
            handleFilterChange('sortOrder', newSortOrder);
          }}
        />
      </DataTransition>

      {/* Show error message if there's an error but we have existing data */}
      {error && players.length > 0 && (
        <div className="mt-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-destructive">Error: {error}</p>
                <Button onClick={fetchPlayers} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayersPageContent />
    </Suspense>
  );
}
