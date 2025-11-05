'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ClubCard } from '@/components/analytics/ClubCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterCard } from '@/components/ui/FilterCard';
import { DataTransition } from '@/components/ui/DataTransition';
import { RegionFilter } from '@/components/ui/RegionFilter';
import { PageLoading, PageError } from '@/components/ui/PageLoading';
import { SortableToolbar } from '@/components/ui/SortableToolbar';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';
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

interface Club {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  players: Array<{
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
  }>;
  _count: {
    players: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function ClubsPageContent() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
  );
  const [minMembers, setMinMembers] = useState<string>(
    searchParams.get('minMembers') || ''
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    searchParams.get('region') ? [searchParams.get('region')!] : []
  );
  const [regionsData, setRegionsData] = useState<
    Array<{ code: string; name: string; country: string }>
  >([]);

  // Track if this is the initial mount to prevent loops
  const isInitialMount = useRef(true);
  const skipNextUrlUpdate = useRef(false);

  // Fetch regions for display
  useEffect(() => {
    fetch('/api/regions')
      .then((res) => res.json())
      .then((data) => setRegionsData(data.regions || []))
      .catch(() => {});
  }, []);

  // Sync state from URL params on mount or URL change (from browser navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlSortBy = searchParams.get('sortBy') || 'createdAt';
    const urlSortOrder = searchParams.get('sortOrder') || 'desc';
    const urlMinMembers = searchParams.get('minMembers') || '';
    const urlRegion = searchParams.get('region') || '';
    const urlRegions = urlRegion ? [urlRegion] : [];

    // On initial mount, just sync from URL
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (urlSearch !== search) setSearch(urlSearch);
      if (urlPage !== currentPage) setCurrentPage(urlPage);
      if (urlSortBy !== sortBy) setSortBy(urlSortBy);
      if (urlSortOrder !== sortOrder) setSortOrder(urlSortOrder);
      if (urlMinMembers !== minMembers) setMinMembers(urlMinMembers);
      if (JSON.stringify(urlRegions) !== JSON.stringify(selectedRegions))
        setSelectedRegions(urlRegions);
      return;
    }

    // On subsequent URL changes (e.g., browser back/forward), sync state
    // But only if we're not skipping (to avoid loops)
    if (!skipNextUrlUpdate.current) {
      if (
        urlSearch !== search ||
        urlPage !== currentPage ||
        urlSortBy !== sortBy ||
        urlSortOrder !== sortOrder ||
        urlMinMembers !== minMembers ||
        JSON.stringify(urlRegions) !== JSON.stringify(selectedRegions)
      ) {
        setSearch(urlSearch);
        setCurrentPage(urlPage);
        setSortBy(urlSortBy);
        setSortOrder(urlSortOrder);
        setMinMembers(urlMinMembers);
        setSelectedRegions(urlRegions);
      }
    }
    skipNextUrlUpdate.current = false;
  }, [searchParams]);

  // Sync URL params when state changes (user interactions)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (minMembers) params.set('minMembers', minMembers);
    if (selectedRegions.length > 0) params.set('region', selectedRegions[0]);

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Only update URL if it's different (avoid infinite loops)
    if (newUrl !== currentUrl) {
      skipNextUrlUpdate.current = true;
      router.replace(newUrl, { scroll: false });
    }
  }, [
    search,
    currentPage,
    sortBy,
    sortOrder,
    minMembers,
    selectedRegions,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    // Wait for permissions to load before checking access
    if (!permissionsLoading) {
      fetchClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    currentPage,
    sortBy,
    sortOrder,
    minMembers,
    selectedRegions,
    permissionsLoading,
  ]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (minMembers) params.append('minMembers', minMembers);
      if (selectedRegions.length > 0)
        params.append('region', selectedRegions[0]);

      const response = await fetch(`/api/clubs?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch clubs');
        }
      } else {
        const data = await response.json();
        setClubs(data.data || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
      case 'minMembers':
        setMinMembers(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleSort = (sortByValue: string, sortOrderValue: 'asc' | 'desc') => {
    setSortBy(sortByValue);
    setSortOrder(sortOrderValue);
    setCurrentPage(1);
  };

  const handleRegionsChange = (regions: string[]) => {
    setSelectedRegions(regions);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAnalytics = (clubId: string) => {
    window.location.href = `/clubs/${clubId}`;
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
  const hasAccess = canAccessPage('/clubs') || currentRole === 'admin';
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clubs</h1>
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
                You do not have permission to view clubs. Your current role is{' '}
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
  if (loading && clubs.length === 0 && !error) {
    return (
      <PageLoading
        title="Clubs"
        showSearch={true}
        showFilters={false}
        cardCount={6}
      />
    );
  }

  if (error && clubs.length === 0) {
    return (
      <PageError
        title="Error Loading Clubs"
        message={error}
        onRetry={fetchClubs}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clubs</h1>
        </div>

        {/* Filters */}
        <FilterCard
          title="Filters"
          collapsible={true}
          defaultCollapsed={false}
          onClearAll={() => {
            setSearch('');
            setMinMembers('');
            setSortBy('createdAt');
            setSortOrder('desc');
            setSelectedRegions([]);
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
              selectedRegions.length > 0 && {
                key: 'region',
                label: 'Region',
                value: (() => {
                  const region = regionsData.find(
                    (r) => r.code === selectedRegions[0]
                  );
                  return region
                    ? `${region.name}, ${region.country}`
                    : selectedRegions[0];
                })(),
                onRemove: () => handleRegionsChange([]),
              },
              minMembers && {
                key: 'minMembers',
                label: 'Min Members',
                value: `${minMembers}+`,
                onRemove: () => handleFilterChange('minMembers', ''),
              },
              sortBy !== 'createdAt' && {
                key: 'sortBy',
                label: 'Sort By',
                value: sortBy,
                onRemove: () => handleFilterChange('sortBy', 'createdAt'),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <SearchInput
                placeholder="Search clubs..."
                onSearch={handleSearch}
                debounceMs={600}
                value={search}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <RegionFilter
                selectedRegions={selectedRegions}
                onRegionsChange={handleRegionsChange}
                multiple={false}
              />
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
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="memberCount">Member Count</SelectItem>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Members</label>
              <Select
                value={minMembers || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('minMembers', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                  <SelectItem value="20">20+</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterCard>

        {/* Sortable Toolbar */}
        {clubs.length > 0 && (
          <SortableToolbar
            sortOptions={[
              { key: 'createdAt', label: 'Date Created' },
              { key: 'name', label: 'Name' },
              { key: 'memberCount', label: 'Member Count' },
            ]}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder as 'asc' | 'desc'}
            onSort={handleSort}
          />
        )}

        <DataTransition>
          {clubs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No clubs found</p>
                  {(search || minMembers || selectedRegions.length > 0) && (
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
                {clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onViewAnalytics={handleViewAnalytics}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
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

                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (page === 1 || page === pagination.pages)
                            return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
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
                            currentPage < pagination.pages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={
                            currentPage >= pagination.pages
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
                  {pagination.total} clubs
                </div>
              )}
            </>
          )}
        </DataTransition>

        {/* Show error message if there's an error but we have existing data */}
        {error && clubs.length > 0 && (
          <div className="mt-4">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-destructive">Error: {error}</p>
                  <Button onClick={fetchClubs} variant="outline" size="sm">
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

export default function ClubsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClubsPageContent />
    </Suspense>
  );
}
