'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TeamStats } from '@/components/analytics/TeamStats';
import { MemberList } from '@/components/analytics/MemberList';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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

  useEffect(() => {
    if (clubId) {
      fetchClubAnalytics();
    }
  }, [clubId]);

  const fetchClubAnalytics = async () => {
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
  };

  const handleViewPlayer = (playerId: string) => {
    window.location.href = `/players/${playerId}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
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
              <Button onClick={fetchClubAnalytics}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Club not found</p>
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
