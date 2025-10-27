'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { _Progress } from '@/components/ui/progress';
import {
  Trophy,
  _Target,
  _TrendingUp,
  _Calendar,
  _Award,
  BarChart3,
  Users,
  Clock,
} from 'lucide-react';

interface PlayerStatisticsProps {
  playerId: string;
  year?: number;
}

interface PlayerStats {
  player: {
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
  };
  tournamentHistory: Array<{
    tournamentId: string;
    tournamentName: string;
    placement: number;
    ggPoints: number;
    eloChange: number;
    prizeMoney: number;
    date: string;
  }>;
  yearStats: Array<{
    year: number;
    totalGames: number;
    donGames: number;
    mafiaGames: number;
    sheriffGames: number;
    civilianGames: number;
    eloRating: number;
    extraPoints: number;
  }>;
  gameDetails: Array<{
    gameId: string;
    date: string;
    durationMinutes: number;
    role: string;
    team: string;
    isWinner: boolean;
    performanceScore: number;
  }>;
}

export function PlayerStatistics({ playerId, year }: PlayerStatisticsProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, _setSelectedYear] = useState<number | null>(
    year || null
  );

  useEffect(() => {
    fetchPlayerStats();
  }, [playerId, selectedYear]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedYear) {
        params.append('year', selectedYear.toString());
      }

      const response = await fetch(
        `/api/players/${playerId}/statistics?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch player statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DON':
        return '👑';
      case 'MAFIA':
        return '🕵️';
      case 'SHERIFF':
        return '👮';
      case 'CITIZEN':
        return '👤';
      default:
        return '❓';
    }
  };

  const getTeamColor = (team: string) => {
    return team === 'BLACK'
      ? 'bg-gray-800 text-white'
      : 'bg-red-600 text-white';
  };

  const getWinRate = (wins: number, total: number) => {
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getRoleStats = (yearStats: any) => {
    if (!yearStats || yearStats.length === 0) return null;

    const currentYear = selectedYear || new Date().getFullYear();
    const yearData =
      yearStats.find((y: any) => y.year === currentYear) || yearStats[0];

    return {
      don: yearData.donGames,
      mafia: yearData.mafiaGames,
      sheriff: yearData.sheriffGames,
      civilian: yearData.civilianGames,
      total: yearData.totalGames,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>No statistics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roleStats = getRoleStats(stats.yearStats);
  const winRate = getWinRate(stats.player.wins, stats.player.totalGames);

  return (
    <div className="space-y-6">
      {/* Player Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Player Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.player.eloRating}
              </div>
              <div className="text-sm text-muted-foreground">ELO Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.player.wins}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.player.losses}
              </div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {winRate}%
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Statistics */}
      {roleStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Role Statistics {selectedYear && `(${selectedYear})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{roleStats.don}</div>
                <div className="text-sm text-muted-foreground">Don Games</div>
                <div className="text-xs text-muted-foreground">
                  {roleStats.total > 0
                    ? Math.round((roleStats.don / roleStats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{roleStats.mafia}</div>
                <div className="text-sm text-muted-foreground">Mafia Games</div>
                <div className="text-xs text-muted-foreground">
                  {roleStats.total > 0
                    ? Math.round((roleStats.mafia / roleStats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{roleStats.sheriff}</div>
                <div className="text-sm text-muted-foreground">
                  Sheriff Games
                </div>
                <div className="text-xs text-muted-foreground">
                  {roleStats.total > 0
                    ? Math.round((roleStats.sheriff / roleStats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{roleStats.civilian}</div>
                <div className="text-sm text-muted-foreground">
                  Civilian Games
                </div>
                <div className="text-xs text-muted-foreground">
                  {roleStats.total > 0
                    ? Math.round((roleStats.civilian / roleStats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.tournamentHistory.length > 0 ? (
            <div className="space-y-3">
              {stats.tournamentHistory.slice(0, 5).map((tournament, index) => (
                <div
                  key={tournament.tournamentId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : '🏆'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {tournament.tournamentName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(tournament.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">#{tournament.placement}</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.ggPoints} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tournament history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.gameDetails.length > 0 ? (
            <div className="space-y-2">
              {stats.gameDetails.slice(0, 10).map((game) => (
                <div
                  key={game.gameId}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getRoleIcon(game.role)}</span>
                    <div>
                      <div className="text-sm font-medium">
                        {game.role} - {game.team}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTeamColor(game.team)}>
                      {game.team}
                    </Badge>
                    <Badge variant={game.isWinner ? 'default' : 'secondary'}>
                      {game.isWinner ? 'Win' : 'Loss'}
                    </Badge>
                    {game.performanceScore && (
                      <span className="text-sm font-medium">
                        {game.performanceScore} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent games available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
