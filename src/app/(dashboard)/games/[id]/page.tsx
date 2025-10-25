'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, RefreshCw, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: string;
  gomafiaId: string;
  date: string;
  durationMinutes: number;
  winnerTeam: string;
  status: string;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  tournamentId?: string;
  tournament?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  participations: Array<{
    player: {
      id: string;
      gomafiaId: string;
      name: string;
      eloRating: number;
      totalGames: number;
      wins: number;
      losses: number;
    };
    role: string;
    team: string;
    isWinner: boolean;
  }>;
  statistics: {
    participantCount: number;
    blackTeam: {
      count: number;
      averageElo: number;
      roles: Record<string, number>;
    };
    redTeam: {
      count: number;
      averageElo: number;
      roles: Record<string, number>;
    };
    winners: Array<{
      id: string;
      name: string;
      role: string;
      team: string;
    }>;
    losers: Array<{
      id: string;
      name: string;
      role: string;
      team: string;
    }>;
    durationHours: number;
  };
}

export default function GameDetailsPage() {
  const params = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGame = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/games/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Game not found');
        }
        throw new Error('Failed to fetch game');
      }

      const data: Game = await response.json();
      setGame(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchGame();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Scheduled
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getWinnerBadge = (winnerTeam: string) => {
    switch (winnerTeam) {
      case 'BLACK':
        return (
          <Badge variant="default" className="bg-gray-800 text-white">
            Black
          </Badge>
        );
      case 'RED':
        return <Badge variant="destructive">Red</Badge>;
      case 'DRAW':
        return <Badge variant="secondary">Draw</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading game...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchGame} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Game not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/games">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Game {game.gomafiaId}</h1>
        </div>
        <Button onClick={fetchGame} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Game Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(game.date)}</div>
            <p className="text-xs text-muted-foreground">Game start time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {game.durationMinutes
                ? formatDuration(game.durationMinutes)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {game.statistics.durationHours > 0
                ? `${game.statistics.durationHours}h`
                : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winner</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getWinnerBadge(game.winnerTeam)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {game.statistics.winners.length} winners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusBadge(game.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {game.statistics.participantCount} participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Game Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Game Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Gomafia ID
                </label>
                <p className="text-sm">{game.gomafiaId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tournament
                </label>
                <p className="text-sm">
                  {game.tournament?.name || 'No tournament'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Participants
                </label>
                <p className="text-sm">{game.statistics.participantCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Duration
                </label>
                <p className="text-sm">
                  {game.durationMinutes
                    ? formatDuration(game.durationMinutes)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Black Team</span>
                <div className="text-sm text-gray-500">
                  {game.statistics.blackTeam.count} players (Avg ELO:{' '}
                  {game.statistics.blackTeam.averageElo})
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Red Team</span>
                <div className="text-sm text-gray-500">
                  {game.statistics.redTeam.count} players (Avg ELO:{' '}
                  {game.statistics.redTeam.averageElo})
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          {game.participations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>ELO</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.participations.map((participation) => (
                  <TableRow key={participation.player.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/players/${participation.player.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {participation.player.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{participation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participation.team === 'BLACK'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {participation.team}
                      </Badge>
                    </TableCell>
                    <TableCell>{participation.player.eloRating}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participation.isWinner ? 'default' : 'secondary'
                        }
                      >
                        {participation.isWinner ? 'Winner' : 'Loser'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/players/${participation.player.id}`}>
                          View Player
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500">No participants found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
