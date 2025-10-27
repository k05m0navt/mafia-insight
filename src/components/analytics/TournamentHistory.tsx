'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  _DollarSign,
  TrendingUp,
  _Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TournamentParticipation {
  tournamentId: string;
  tournamentName: string;
  placement: number;
  ggPoints: number;
  eloChange: number;
  prizeMoney: number;
  date: string;
}

interface TournamentHistoryProps {
  tournaments: TournamentParticipation[];
  pageSize?: number;
}

export function TournamentHistory({
  tournaments,
  pageSize = 10,
}: TournamentHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'placement' | 'prizeMoney'>(
    'date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getPlacementIcon = (placement: number) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    if (placement <= 10) return '🏆';
    return '📊';
  };

  const getPlacementBadge = (placement: number) => {
    if (placement === 1) {
      return <Badge className="bg-yellow-100 text-yellow-800">1st Place</Badge>;
    }
    if (placement === 2) {
      return <Badge className="bg-gray-100 text-gray-800">2nd Place</Badge>;
    }
    if (placement === 3) {
      return <Badge className="bg-orange-100 text-orange-800">3rd Place</Badge>;
    }
    if (placement <= 10) {
      return <Badge variant="secondary">Top 10</Badge>;
    }
    return <Badge variant="outline">#{placement}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortTournaments = (tournaments: TournamentParticipation[]) => {
    return [...tournaments].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'placement':
          aValue = a.placement;
          bValue = b.placement;
          break;
        case 'prizeMoney':
          aValue = a.prizeMoney || 0;
          bValue = b.prizeMoney || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const sortedTournaments = sortTournaments(tournaments);
  const totalPages = Math.ceil(sortedTournaments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTournaments = sortedTournaments.slice(startIndex, endIndex);

  const handleSort = (field: 'date' | 'placement' | 'prizeMoney') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'date' | 'placement' | 'prizeMoney') => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No tournament history available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament History
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {tournaments.length} tournaments
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sort Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('date')}
          >
            Date {getSortIcon('date')}
          </Button>
          <Button
            variant={sortBy === 'placement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('placement')}
          >
            Placement {getSortIcon('placement')}
          </Button>
          <Button
            variant={sortBy === 'prizeMoney' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('prizeMoney')}
          >
            Prize {getSortIcon('prizeMoney')}
          </Button>
        </div>

        {/* Tournament List */}
        <div className="space-y-3">
          {paginatedTournaments.map((tournament) => (
            <div
              key={tournament.tournamentId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">
                  {getPlacementIcon(tournament.placement)}
                </div>
                <div>
                  <div className="font-medium text-lg">
                    {tournament.tournamentName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(tournament.date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    #{tournament.placement}
                  </div>
                  <div className="text-xs text-muted-foreground">Placement</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {tournament.ggPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">GG Points</div>
                </div>

                {tournament.eloChange !== 0 && (
                  <div className="text-center">
                    <div
                      className={`text-lg font-bold flex items-center gap-1 ${
                        tournament.eloChange > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      {tournament.eloChange > 0 ? '+' : ''}
                      {tournament.eloChange}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ELO Change
                    </div>
                  </div>
                )}

                {tournament.prizeMoney > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(tournament.prizeMoney)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prize Money
                    </div>
                  </div>
                )}

                <div>{getPlacementBadge(tournament.placement)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(endIndex, sortedTournaments.length)} of{' '}
              {sortedTournaments.length} tournaments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
