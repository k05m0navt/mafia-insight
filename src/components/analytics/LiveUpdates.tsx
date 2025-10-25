'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LiveUpdatesProps {
  tournamentId: string;
  onRefresh?: () => void;
}

interface LiveUpdate {
  tournament: {
    id: string;
    name: string;
    status: string;
  };
  recentGames: Array<{
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
  lastUpdated: string;
}

const statusColors = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function LiveUpdates({ tournamentId }: LiveUpdatesProps) {
  const [updates, setUpdates] = useState<LiveUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchUpdates();

    if (autoRefresh) {
      const interval = setInterval(fetchUpdates, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [tournamentId, autoRefresh]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/live`);
      if (!response.ok) {
        throw new Error('Failed to fetch live updates');
      }

      const data = await response.json();
      setUpdates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !updates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchUpdates}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!updates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No updates available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Updates</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUpdates}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last updated: {formatTime(updates.lastUpdated)}</span>
          {autoRefresh && (
            <Badge variant="outline" className="text-xs">
              Auto-refresh ON
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates.recentGames.map((game) => {
            const isLive = game.status === 'IN_PROGRESS';
            const isCompleted = game.status === 'COMPLETED';

            return (
              <div
                key={game.id}
                className={`border rounded-lg p-4 ${
                  isLive
                    ? 'border-yellow-300 bg-yellow-50'
                    : isCompleted
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Game {game.id.slice(-4)}
                    </span>
                    <Badge
                      className={`${statusColors[game.status as keyof typeof statusColors] || 'bg-gray-500'} text-white text-xs`}
                    >
                      {game.status.replace('_', ' ')}
                    </Badge>
                    {isLive && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse text-xs"
                      >
                        LIVE
                      </Badge>
                    )}
                    {game.winnerTeam && (
                      <Badge variant="outline" className="text-xs">
                        Winner: {game.winnerTeam}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(game.date)} {formatTime(game.date)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Black Team */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-gray-800 text-white text-xs">
                        BLACK
                      </Badge>
                      {game.winnerTeam === 'BLACK' && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600 text-xs"
                        >
                          WINNER
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {game.participations
                        .filter((p) => p.team === 'BLACK')
                        .map((participation) => (
                          <div
                            key={participation.player.id}
                            className="text-xs"
                          >
                            {participation.player.name} ({participation.role})
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Red Team */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-500 text-white text-xs">
                        RED
                      </Badge>
                      {game.winnerTeam === 'RED' && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600 text-xs"
                        >
                          WINNER
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {game.participations
                        .filter((p) => p.team === 'RED')
                        .map((participation) => (
                          <div
                            key={participation.player.id}
                            className="text-xs"
                          >
                            {participation.player.name} ({participation.role})
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
