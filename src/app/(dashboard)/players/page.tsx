'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Input component not used in this implementation
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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

export default function PlayersPage() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [clubId, setClubId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('lastSyncAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchPlayers = async () => {
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
      if (syncStatus) params.append('syncStatus', syncStatus);
      if (clubId) params.append('clubId', clubId);

      const response = await fetch(`/api/search/players?${params}`);

      if (!response.ok) {
        if (response.status === 403) {
          // Permission denied - this shouldn't happen if permissions are checked correctly
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
  };

  useEffect(() => {
    // Wait for permissions to load before checking access
    if (!permissionsLoading) {
      fetchPlayers();
    }
  }, [
    currentPage,
    pageSize,
    search,
    syncStatus,
    clubId,
    sortBy,
    sortOrder,
    permissionsLoading,
  ]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'syncStatus':
        setSyncStatus(value);
        break;
      case 'clubId':
        setClubId(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  // Show page loading skeleton only if user has access
  if (loading) {
    return (
      <PageLoading
        title="Players"
        showSearch={true}
        showFilters={true}
        cardCount={8}
      />
    );
  }

  if (error) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Players</h1>
        <Button onClick={fetchPlayers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <SearchInput
                placeholder="Search players..."
                onSearch={handleSearch}
                debounceMs={300}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Status</label>
              <Select
                value={syncStatus}
                onValueChange={(value) =>
                  handleFilterChange('syncStatus', value)
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
                onValueChange={(value) => handleFilterChange('sortBy', value)}
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
                onValueChange={(value) =>
                  handleFilterChange('sortOrder', value)
                }
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
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle>Players ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No players found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ELO Rating</TableHead>
                    <TableHead>Games</TableHead>
                    <TableHead>Wins</TableHead>
                    <TableHead>Losses</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/players/${player.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {player.name}
                        </Link>
                      </TableCell>
                      <TableCell>{player.eloRating}</TableCell>
                      <TableCell>{player.totalGames}</TableCell>
                      <TableCell>{player.wins}</TableCell>
                      <TableCell>{player.losses}</TableCell>
                      <TableCell>
                        {getSyncStatusBadge(player.syncStatus)}
                      </TableCell>
                      <TableCell>{formatDate(player.lastSyncAt)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/players/${player.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                      of {pagination.total} players
                    </div>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasPrev) {
                              handlePageChange(pagination.page - 1);
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
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page);
                                }}
                                isActive={page === pagination.page}
                                className="cursor-pointer"
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
                            if (pagination.hasNext) {
                              handlePageChange(pagination.page + 1);
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
