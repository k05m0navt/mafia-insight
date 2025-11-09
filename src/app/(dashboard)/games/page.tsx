'use client';

import React, {
  useState,
  useEffect,
  Suspense,
  useRef,
  useCallback,
  useTransition,
  useMemo,
  memo,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PageLoading, PageError } from '@/components/ui/PageLoading';
import { SearchInput } from '@/components/ui/SearchInput';

interface Game {
  id: string;
  gomafiaId: string;
  date: string;
  winnerTeam: string;
  status: string;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  tournamentId?: string;
  participations: Array<{
    player: {
      id: string;
      name: string;
      eloRating: number;
    };
    role: string;
    team: string;
    isWinner: boolean;
  }>;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GamesResponse {
  games: Game[];
  pagination: PaginationData;
}

// Table skeleton component - defined outside to avoid React warning
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Memoized header component
function PageHeaderComponent({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Games</h1>
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

// Memoized table row component
function GameRowComponent({ game }: { game: Game }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Scheduled
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getWinnerBadge = (winnerTeam: string) => {
    switch (winnerTeam) {
      case 'BLACK':
        return (
          <Badge variant="default" className="bg-gray-800 text-white">
            Black
          </Badge>
        );
      case 'RED':
        return <Badge variant="destructive">Red</Badge>;
      case 'DRAW':
        return <Badge variant="secondary">Draw</Badge>;
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
    <TableRow key={game.id} className="transition-colors hover:bg-muted/50">
      <TableCell>{formatDate(game.date)}</TableCell>
      <TableCell>{getWinnerBadge(game.winnerTeam)}</TableCell>
      <TableCell>{getStatusBadge(game.status)}</TableCell>
      <TableCell>{game.participations.length}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/games/${game.id}`}>View</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

const GameRow = memo(GameRowComponent);
GameRow.displayName = 'GameRow';

// Memoized table component
function GamesTableComponent({
  games,
  loading,
  pagination,
  sortBy,
  sortOrder,
  onPageChange,
  onSort,
}: {
  games: Game[];
  loading: boolean;
  pagination: PaginationData | null;
  sortBy: string;
  sortOrder: string;
  onPageChange: (page: number) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Games ({pagination?.total || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && games.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortKey="date"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder as 'asc' | 'desc'}
                  onSort={onSort}
                >
                  Date
                </SortableTableHead>
                <SortableTableHead
                  sortKey="winnerTeam"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder as 'asc' | 'desc'}
                  onSort={onSort}
                >
                  Winner
                </SortableTableHead>
                <SortableTableHead
                  sortKey="status"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder as 'asc' | 'desc'}
                  onSort={onSort}
                >
                  Status
                </SortableTableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton />
            </TableBody>
          </Table>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No games found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="date"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder as 'asc' | 'desc'}
                    onSort={onSort}
                  >
                    Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="winnerTeam"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder as 'asc' | 'desc'}
                    onSort={onSort}
                  >
                    Winner
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder as 'asc' | 'desc'}
                    onSort={onSort}
                  >
                    Status
                  </SortableTableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && games.length > 0 ? (
                  <TableSkeleton />
                ) : (
                  games.map((game) => <GameRow key={game.id} game={game} />)
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total} games
                  </div>
                </div>
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            if (pagination.hasPrev) {
                              onPageChange(pagination.page - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={
                            !pagination.hasPrev
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
                          if (Math.abs(page - pagination.page) <= 1)
                            return true;
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
                                    onPageChange(page);
                                    window.scrollTo({
                                      top: 0,
                                      behavior: 'smooth',
                                    });
                                  }}
                                  isActive={page === pagination.page}
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
                          onClick={() => {
                            if (pagination.hasNext) {
                              onPageChange(pagination.page + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
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
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const GamesTable = memo(GamesTableComponent);
GamesTable.displayName = 'GamesTable';

// Memoized filters component
function GamesFiltersComponent({
  search,
  status,
  winnerTeam,
  sortBy,
  sortOrder,
  startDate,
  endDate,
  onSearch,
  onFilterChange,
}: {
  search: string;
  status: string;
  winnerTeam: string;
  sortBy: string;
  sortOrder: string;
  startDate: string;
  endDate: string;
  onSearch: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <SearchInput
          placeholder="Search games..."
          onSearch={onSearch}
          debounceMs={600}
          value={search}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={status || 'all'}
          onValueChange={(value) =>
            onFilterChange('status', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Winner Team</label>
        <Select
          value={winnerTeam || 'all'}
          onValueChange={(value) =>
            onFilterChange('winnerTeam', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            <SelectItem value="BLACK">Black</SelectItem>
            <SelectItem value="RED">Red</SelectItem>
            <SelectItem value="DRAW">Draw</SelectItem>
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
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="winnerTeam">Winner</SelectItem>
            <SelectItem value="status">Status</SelectItem>
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Start Date</label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">End Date</label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
          min={startDate || undefined}
        />
      </div>
    </div>
  );
}

const GamesFilters = memo(GamesFiltersComponent);
GamesFilters.displayName = 'GamesFilters';

function GamesPageContent() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [_isPending, startTransition] = useTransition();

  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [search, setSearch] = useState<string>(
    searchParams.get('search') || ''
  );
  const [status, setStatus] = useState<string>(
    searchParams.get('status') || ''
  );
  const [winnerTeam, setWinnerTeam] = useState<string>(
    searchParams.get('winnerTeam') || ''
  );
  const [tournamentId, setTournamentId] = useState<string>(
    searchParams.get('tournamentId') || ''
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get('startDate') || ''
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get('endDate') || ''
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'date'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
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

  // Update URL without causing full page reload
  const updateURL = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const queryString = createQueryString(updates);
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

      if (newUrl !== currentUrl) {
        startTransition(() => {
          router.replace(newUrl, { scroll: false });
        });
      }
    },
    [createQueryString, pathname, searchParams, router]
  );

  // Fetch games function
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: Permissions are checked in render, so we don't need to check here
      // But we still handle 403 responses from the API

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (winnerTeam) params.append('winnerTeam', winnerTeam);
      if (tournamentId) params.append('tournamentId', tournamentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/games?${params}`);

      if (!response.ok) {
        if (response.status === 403) {
          // Permission denied - this shouldn't happen if permissions are checked correctly
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch games');
        }
      } else {
        const data: GamesResponse = await response.json();
        setGames(data.games);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    search,
    status,
    winnerTeam,
    tournamentId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  // Fetch games when filters change
  useEffect(() => {
    if (!permissionsLoading) {
      fetchGames();
    }
  }, [fetchGames, permissionsLoading]);

  // Track if we're updating from user interaction to prevent loops
  const isUpdatingFromUser = useRef(false);

  // Sync URL params from browser navigation (back/forward)
  useEffect(() => {
    if (isUpdatingFromUser.current) {
      isUpdatingFromUser.current = false;
      return;
    }

    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlStatus = searchParams.get('status') || '';
    const urlWinnerTeam = searchParams.get('winnerTeam') || '';
    const urlTournamentId = searchParams.get('tournamentId') || '';
    const urlStartDate = searchParams.get('startDate') || '';
    const urlEndDate = searchParams.get('endDate') || '';
    const urlSortBy = searchParams.get('sortBy') || 'date';
    const urlSortOrder = searchParams.get('sortOrder') || 'desc';

    const updates: Array<() => void> = [];

    if (urlSearch !== search) updates.push(() => setSearch(urlSearch));
    if (urlPage !== currentPage) updates.push(() => setCurrentPage(urlPage));
    if (urlStatus !== status) updates.push(() => setStatus(urlStatus));
    if (urlWinnerTeam !== winnerTeam)
      updates.push(() => setWinnerTeam(urlWinnerTeam));
    if (urlTournamentId !== tournamentId)
      updates.push(() => setTournamentId(urlTournamentId));
    if (urlStartDate !== startDate)
      updates.push(() => setStartDate(urlStartDate));
    if (urlEndDate !== endDate) updates.push(() => setEndDate(urlEndDate));
    if (urlSortBy !== sortBy) updates.push(() => setSortBy(urlSortBy));
    if (urlSortOrder !== sortOrder)
      updates.push(() => setSortOrder(urlSortOrder));

    if (updates.length > 0) {
      startTransition(() => {
        updates.forEach((update) => update());
      });
    }
  }, [
    searchParams,
    search,
    currentPage,
    status,
    winnerTeam,
    tournamentId,
    startDate,
    endDate,
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
        case 'status':
          setStatus(value);
          updates.status = value || null;
          break;
        case 'winnerTeam':
          setWinnerTeam(value);
          updates.winnerTeam = value || null;
          break;
        case 'tournamentId':
          setTournamentId(value);
          updates.tournamentId = value || null;
          break;
        case 'startDate':
          setStartDate(value);
          updates.startDate = value || null;
          break;
        case 'endDate':
          setEndDate(value);
          updates.endDate = value || null;
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
    setStatus('');
    setWinnerTeam('');
    setTournamentId('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
    updateURL({
      search: null,
      status: null,
      winnerTeam: null,
      tournamentId: null,
      startDate: null,
      endDate: null,
      sortBy: null,
      sortOrder: null,
      page: 1,
    });
  }, [updateURL]);

  // Memoize remove handlers
  const removeSearchFilter = useCallback(
    () => handleSearch(''),
    [handleSearch]
  );
  const removeStatusFilter = useCallback(
    () => handleFilterChange('status', ''),
    [handleFilterChange]
  );
  const removeWinnerTeamFilter = useCallback(
    () => handleFilterChange('winnerTeam', ''),
    [handleFilterChange]
  );
  const removeTournamentFilter = useCallback(
    () => handleFilterChange('tournamentId', ''),
    [handleFilterChange]
  );
  const removeStartDateFilter = useCallback(
    () => handleFilterChange('startDate', ''),
    [handleFilterChange]
  );
  const removeEndDateFilter = useCallback(
    () => handleFilterChange('endDate', ''),
    [handleFilterChange]
  );
  const removeSortByFilter = useCallback(
    () => handleFilterChange('sortBy', 'date'),
    [handleFilterChange]
  );
  const removeSortOrderFilter = useCallback(
    () => handleFilterChange('sortOrder', 'desc'),
    [handleFilterChange]
  );

  // Memoize activeFilters array
  const activeFilters = useMemo(() => {
    return [
      search && {
        key: 'search',
        label: 'Search',
        value: search,
        onRemove: removeSearchFilter,
      },
      status && {
        key: 'status',
        label: 'Status',
        value: status,
        onRemove: removeStatusFilter,
      },
      winnerTeam && {
        key: 'winnerTeam',
        label: 'Winner Team',
        value: winnerTeam,
        onRemove: removeWinnerTeamFilter,
      },
      tournamentId && {
        key: 'tournamentId',
        label: 'Tournament',
        value: tournamentId,
        onRemove: removeTournamentFilter,
      },
      startDate && {
        key: 'startDate',
        label: 'Start Date',
        value: new Date(startDate).toLocaleDateString(),
        onRemove: removeStartDateFilter,
      },
      endDate && {
        key: 'endDate',
        label: 'End Date',
        value: new Date(endDate).toLocaleDateString(),
        onRemove: removeEndDateFilter,
      },
      sortBy !== 'date' && {
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
    status,
    winnerTeam,
    tournamentId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    removeSearchFilter,
    removeStatusFilter,
    removeWinnerTeamFilter,
    removeTournamentFilter,
    removeStartDateFilter,
    removeEndDateFilter,
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
  const hasAccess = canAccessPage('/games') || currentRole === 'admin';
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Games</h1>
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
                You do not have permission to view games. Your current role is{' '}
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

  // Show page loading skeleton only on initial load
  if (loading && games.length === 0 && !error) {
    return (
      <PageLoading
        title="Games"
        showSearch={true}
        showFilters={true}
        layout="table"
        tableRows={8}
      />
    );
  }

  if (error && games.length === 0) {
    return (
      <PageError
        title="Error Loading Games"
        message={error}
        onRetry={fetchGames}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={fetchGames} loading={loading} />

      {/* Filters */}
      <FilterCard
        title="Filters"
        collapsible={true}
        defaultCollapsed={false}
        onClearAll={handleClearFilters}
        activeFilters={activeFilters}
      >
        <GamesFilters
          search={search}
          status={status}
          winnerTeam={winnerTeam}
          sortBy={sortBy}
          sortOrder={sortOrder}
          startDate={startDate}
          endDate={endDate}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
      </FilterCard>

      {/* Games Table */}
      <DataTransition>
        <GamesTable
          games={games}
          loading={loading}
          pagination={pagination}
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
      {error && games.length > 0 && (
        <div className="mt-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-destructive">Error: {error}</p>
                <Button onClick={fetchGames} variant="outline" size="sm">
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

export default function GamesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamesPageContent />
    </Suspense>
  );
}
