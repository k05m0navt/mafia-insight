'use client';

import { useState, useEffect } from 'react';
import { ClubCard } from '@/components/analytics/ClubCard';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchInput } from '@/components/ui/SearchInput';
import { PageLoading, PageError } from '@/components/ui/PageLoading';

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

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClubs();
  }, [search]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/clubs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clubs');
      }

      const data = await response.json();
      setClubs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (clubId: string) => {
    window.location.href = `/clubs/${clubId}`;
  };

  if (loading) {
    return (
      <PageLoading
        title="Clubs"
        showSearch={true}
        showFilters={false}
        cardCount={6}
      />
    );
  }

  if (error) {
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Clubs</h1>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                placeholder="Search clubs..."
                onSearch={setSearch}
                debounceMs={300}
              />
            </div>
          </div>
        </div>

        {clubs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">No clubs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
