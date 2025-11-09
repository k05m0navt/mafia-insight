'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TeamStats } from '@/components/analytics/TeamStats';
import { MemberList } from '@/components/analytics/MemberList';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoading, PageError } from '@/components/ui/PageLoading';

interface ClubAnalytics {
  club: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    creator: {
      id: string;
      name: string;
      email: string;
    };
    president?: {
      id: string;
      name: string;
      gomafiaId: string;
      eloRating: number;
    } | null;
    players: Array<{
      id: string;
      name: string;
      eloRating: number;
      totalGames: number;
      wins: number;
      losses: number;
      roleStats: Array<{
        role: string;
        gamesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
      }>;
    }>;
  };
  memberCount: number;
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageElo: number;
  roleDistribution: Record<string, number>;
  topPerformers: Array<{
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    winRate: number;
  }>;
}

export default function ClubAnalyticsPage() {
  const params = useParams();
  const clubId = params.id as string;

  const [analytics, setAnalytics] = useState<ClubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clubs/${clubId}/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch club analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      fetchClubAnalytics();
    }
  }, [clubId, fetchClubAnalytics]);

  const handleViewPlayer = (playerId: string) => {
    window.location.href = `/players/${playerId}`;
  };

  if (loading) {
    return (
      <PageLoading
        title="Club Analytics"
        showSearch={false}
        showFilters={false}
        cardCount={3}
        layout="cards"
      />
    );
  }

  if (error) {
    return (
      <PageError
        title="Club Analytics"
        message={error}
        onRetry={fetchClubAnalytics}
      />
    );
  }

  if (!analytics) {
    return (
      <PageError
        title="Club Analytics"
        message="Club not found"
        showRetry={false}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{analytics.club.name}</h1>
              {analytics.club.description && (
                <p className="text-muted-foreground mt-2">
                  {analytics.club.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{analytics.memberCount} members</Badge>
              <Badge variant="secondary">
                Avg ELO: {analytics.averageElo.toFixed(0)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created by {analytics.club.creator.name}</span>
            {analytics.club.president && (
              <>
                <span>•</span>
                <span>
                  President:{' '}
                  <Link
                    href={`/players/${analytics.club.president.id}`}
                    className="text-primary hover:underline"
                  >
                    {analytics.club.president.name}
                  </Link>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <TeamStats analytics={analytics} />
        </div>

        <div className="mb-6">
          <MemberList
            members={analytics.club.players}
            onViewPlayer={handleViewPlayer}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
