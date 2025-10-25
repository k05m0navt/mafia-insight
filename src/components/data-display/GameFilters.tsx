'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface GameFiltersProps {
  onFiltersChange: (filters: GameFiltersData) => void;
  onClearFilters: () => void;
  initialFilters?: GameFiltersData;
}

interface GameFiltersData {
  status: string;
  winnerTeam: string;
  tournamentId: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function GameFilters({
  onFiltersChange,
  onClearFilters,
  initialFilters = {
    status: '',
    winnerTeam: '',
    tournamentId: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
  },
}: GameFiltersProps) {
  const [filters, setFilters] = useState<GameFiltersData>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof GameFiltersData, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      winnerTeam: '',
      tournamentId: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc' as const,
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters =
    filters.status ||
    filters.winnerTeam ||
    filters.tournamentId ||
    filters.startDate ||
    filters.endDate;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Winner Team */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Winner Team</label>
              <Select
                value={filters.winnerTeam}
                onValueChange={(value) =>
                  handleFilterChange('winnerTeam', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All teams</SelectItem>
                  <SelectItem value="BLACK">Black</SelectItem>
                  <SelectItem value="RED">Red</SelectItem>
                  <SelectItem value="DRAW">Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tournament */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tournament</label>
              <Select
                value={filters.tournamentId}
                onValueChange={(value) =>
                  handleFilterChange('tournamentId', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All tournaments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tournaments</SelectItem>
                  {/* This would be populated with actual tournament data */}
                  <SelectItem value="tournament1">Tournament 1</SelectItem>
                  <SelectItem value="tournament2">Tournament 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value)
                }
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
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
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="durationMinutes">Duration</SelectItem>
                  <SelectItem value="winnerTeam">Winner</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
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
