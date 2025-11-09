'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface PlayerFiltersProps {
  onFiltersChange: (filters: PlayerFiltersData) => void;
  onClearFilters: () => void;
  initialFilters?: PlayerFiltersData;
}

interface PlayerFiltersData {
  search: string;
  syncStatus: string;
  clubId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function PlayerFilters({
  onFiltersChange,
  onClearFilters,
  initialFilters = {
    search: '',
    syncStatus: 'all',
    clubId: 'all',
    sortBy: 'lastSyncAt',
    sortOrder: 'desc',
  },
}: PlayerFiltersProps) {
  const [filters, setFilters] = useState<PlayerFiltersData>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof PlayerFiltersData, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      syncStatus: 'all',
      clubId: 'all',
      sortBy: 'lastSyncAt',
      sortOrder: 'desc' as const,
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters =
    filters.search || filters.syncStatus || filters.clubId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <SearchInput
                placeholder="Search players..."
                value={filters.search}
                onSearch={(value) => handleFilterChange('search', value)}
                debounceMs={300}
              />
            </div>

            {/* Sync Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Status</label>
              <Select
                value={filters.syncStatus}
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

            {/* Club */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Club</label>
              <Select
                value={filters.clubId}
                onValueChange={(value) => handleFilterChange('clubId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clubs</SelectItem>
                  {/* This would be populated with actual club data */}
                  <SelectItem value="club1">Club 1</SelectItem>
                  <SelectItem value="club2">Club 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
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

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) =>
                  handleFilterChange('sortOrder', value as 'asc' | 'desc')
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
      )}
    </Card>
  );
}
