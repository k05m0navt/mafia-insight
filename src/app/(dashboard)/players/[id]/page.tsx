'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Target,
  Users,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { PageLoading, PageError } from '@/components/ui/PageLoading';

interface Player {
  id: string;
  gomafiaId: string;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  clubId?: string;
  club?: {
    id: string;
    name: string;
  };
  // Judge fields (only present if player is a judge)
  judgeCategory?: string | null;
  judgeCanBeGs?: number | null;
  judgeCanJudgeFinal?: boolean | null;
  judgeMaxTablesAsGs?: number | null;
  judgeRating?: number | null;
  judgeGamesJudged?: number | null;
  judgeAccreditationDate?: string | null;
  judgeResponsibleFromSc?: string | null;
  participations: Array<{
    game: {
      id: string;
      gomafiaId: string;
      date: string;
      durationMinutes: number;
      winnerTeam: string;
      status: string;
    };
  }>;
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
  }>;
  statistics: {
    totalGames: number;
    winRate: number;
    recentGames: Array<{
      id: string;
      gomafiaId: string;
      date: string;
      durationMinutes: number;
      winnerTeam: string;
      status: string;
    }>;
    roleStats: Record<
      string,
      {
        gamesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
      }
    >;
  };
}

export default function PlayerDetailsPage() {
  const params = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/players/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error('Failed to fetch player');
      }

      const data: Player = await response.json();
      setPlayer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPlayer();
    }
  }, [params.id, fetchPlayer]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Synced
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <PageLoading
        title="Player Details"
        showSearch={false}
        showFilters={false}
        cardCount={4}
        layout="cards"
      />
    );
  }

  if (error) {
    return (
      <PageError title="Player Details" message={error} onRetry={fetchPlayer} />
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Player not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Players
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{player.name}</h1>
        </div>
        <Button onClick={fetchPlayer} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Player Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ELO Rating</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.eloRating}</div>
            <p className="text-xs text-muted-foreground">Current rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {player.wins} wins, {player.losses} losses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {player.statistics.winRate}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getSyncStatusBadge(player.syncStatus)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last sync: {formatDate(player.lastSyncAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Judge Information */}
      {player.judgeCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Judge Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Category
                </label>
                <p className="text-sm font-semibold">{player.judgeCategory}</p>
              </div>
              {player.judgeCanBeGs !== null &&
                player.judgeCanBeGs !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Can be GS
                    </label>
                    <p className="text-sm">{player.judgeCanBeGs} games</p>
                  </div>
                )}
              {player.judgeCanJudgeFinal && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Can Judge Final
                  </label>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Yes
                  </Badge>
                </div>
              )}
              {player.judgeMaxTablesAsGs !== null &&
                player.judgeMaxTablesAsGs !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Max Tables as GS
                    </label>
                    <p className="text-sm">{player.judgeMaxTablesAsGs}</p>
                  </div>
                )}
              {player.judgeRating !== null &&
                player.judgeRating !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Judge Rating
                    </label>
                    <p className="text-sm font-semibold">
                      {player.judgeRating}
                    </p>
                  </div>
                )}
              {player.judgeGamesJudged !== null &&
                player.judgeGamesJudged !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Games Judged
                    </label>
                    <p className="text-sm">{player.judgeGamesJudged}</p>
                  </div>
                )}
              {player.judgeAccreditationDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Accreditation Date
                  </label>
                  <p className="text-sm">
                    {formatDate(player.judgeAccreditationDate)}
                  </p>
                </div>
              )}
              {player.judgeResponsibleFromSc && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Responsible from SC FSM
                  </label>
                  <p className="text-sm">{player.judgeResponsibleFromSc}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Gomafia ID
                </label>
                <p className="text-sm">{player.gomafiaId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Club
                </label>
                <p className="text-sm">
                  {player.club ? (
                    <Link
                      href={`/clubs/${player.club.id}`}
                      className="text-primary hover:underline"
                    >
                      {player.club.name}
                    </Link>
                  ) : (
                    'No club'
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Games Played
                </label>
                <p className="text-sm">{player.totalGames}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Win Rate
                </label>
                <p className="text-sm">{player.statistics.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Role Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(player.statistics.roleStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(player.statistics.roleStats).map(
                  ([role, stats]) => (
                    <div
                      key={role}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium capitalize">
                        {role}
                      </span>
                      <div className="text-sm text-gray-500">
                        {stats.gamesPlayed} games ({stats.winRate}% win rate)
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No role statistics available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          {player.participations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.participations.slice(0, 10).map((participation) => (
                  <TableRow key={participation.game.id}>
                    <TableCell>{formatDate(participation.game.date)}</TableCell>
                    <TableCell>
                      {participation.game.durationMinutes
                        ? formatDuration(participation.game.durationMinutes)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participation.game.winnerTeam === 'BLACK'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {participation.game.winnerTeam}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {participation.game.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/games/${participation.game.id}`}>
                          View Game
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500">No recent games found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
