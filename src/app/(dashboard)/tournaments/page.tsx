'use client';

import { useState, useEffect } from 'react';
import { TournamentCard } from '@/components/analytics/TournamentCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchInput } from '@/components/ui/SearchInput';

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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, [search, selectedStatus]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/tournaments?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }

      const data = await response.json();
      setTournaments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (tournamentId: string) => {
    window.location.href = `/tournaments/${tournamentId}`;
  };

  const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Tournaments</h1>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchTournaments}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Tournaments</h1>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                placeholder="Search tournaments..."
                onSearch={setSearch}
                debounceMs={300}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedStatus === null ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(null)}
              >
                All Status
              </Button>
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  onClick={() =>
                    setSelectedStatus(selectedStatus === status ? null : status)
                  }
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">No tournaments found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
