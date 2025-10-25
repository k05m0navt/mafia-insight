'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TournamentBracket } from '@/components/analytics/TournamentBracket';
import { LiveUpdates } from '@/components/analytics/LiveUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TournamentAnalytics {
  tournament: {
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
    }>;
  };
  gamesPlayed: number;
  averageDuration: number;
  winnerDistribution: {
    blackWins: number;
    redWins: number;
    draws: number;
  };
  participantStats: Array<{
    id: string;
    name: string;
    eloRating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    roles: string[];
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    winRate: number;
  }>;
}

export default function TournamentAnalyticsPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [analytics, setAnalytics] = useState<TournamentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentAnalytics();
    }
  }, [tournamentId]);

  const fetchTournamentAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tournaments/${tournamentId}/analytics`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tournament analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
              <Button onClick={fetchTournamentAnalytics}>Try Again</Button>
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
              <p className="text-muted-foreground">Tournament not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLive = analytics.tournament.status === 'IN_PROGRESS';
  const isCompleted = analytics.tournament.status === 'COMPLETED';

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {analytics.tournament.name}
              </h1>
              {analytics.tournament.description && (
                <p className="text-muted-foreground mt-2">
                  {analytics.tournament.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  isLive
                    ? 'bg-yellow-500'
                    : isCompleted
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                } text-white`}
              >
                {analytics.tournament.status.replace('_', ' ')}
              </Badge>
              {isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created by {analytics.tournament.creator.name}</span>
            <span>•</span>
            <span>Started {formatDate(analytics.tournament.startDate)}</span>
            {analytics.tournament.endDate && (
              <>
                <span>•</span>
                <span>Ended {formatDate(analytics.tournament.endDate)}</span>
              </>
            )}
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.gamesPlayed}</div>
              <p className="text-xs text-muted-foreground">
                out of {analytics.tournament.games.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.averageDuration.toFixed(0)}m
              </div>
              <p className="text-xs text-muted-foreground">per game</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Black Team Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.winnerDistribution.blackWins}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.gamesPlayed > 0
                  ? (
                      (analytics.winnerDistribution.blackWins /
                        analytics.gamesPlayed) *
                      100
                    ).toFixed(1)
                  : 0}
                % win rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Red Team Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.winnerDistribution.redWins}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.gamesPlayed > 0
                  ? (
                      (analytics.winnerDistribution.redWins /
                        analytics.gamesPlayed) *
                      100
                    ).toFixed(1)
                  : 0}
                % win rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prize Information */}
        {(analytics.tournament.entryFee || analytics.tournament.prizePool) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Prize Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                {analytics.tournament.entryFee && (
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(analytics.tournament.entryFee)}
                    </p>
                  </div>
                )}
                {analytics.tournament.prizePool && (
                  <div>
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(analytics.tournament.prizePool)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Updates */}
        {isLive && (
          <div className="mb-6">
            <LiveUpdates tournamentId={tournamentId} />
          </div>
        )}

        {/* Tournament Bracket */}
        <div className="mb-6">
          <TournamentBracket games={analytics.tournament.games} />
        </div>

        {/* Top Performers */}
        {analytics.topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPerformers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ELO: {player.eloRating}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {player.winRate.toFixed(1)}% win rate
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
