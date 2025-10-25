'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TournamentCardProps {
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
    }>;
    _count: {
      games: number;
    };
  };
  onViewAnalytics?: (tournamentId: string) => void;
}

const statusColors = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function TournamentCard({
  tournament,
  onViewAnalytics,
}: TournamentCardProps) {
  const gamesPlayed = tournament.games.filter(
    (game) => game.status === 'COMPLETED'
  ).length;
  const isLive = tournament.status === 'IN_PROGRESS';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{tournament.name}</span>
          <div className="flex items-center gap-2">
            <Badge
              className={`${statusColors[tournament.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}
            >
              {tournament.status.replace('_', ' ')}
            </Badge>
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
        </CardTitle>
        {tournament.description && (
          <p className="text-sm text-muted-foreground">
            {tournament.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium">
              {formatDate(tournament.startDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Games Played</p>
            <p className="text-sm font-medium">
              {gamesPlayed} / {tournament._count.games}
            </p>
          </div>
        </div>

        {(tournament.entryFee || tournament.prizePool) && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              {tournament.entryFee && (
                <div>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(tournament.entryFee)}
                  </p>
                </div>
              )}
              {tournament.prizePool && (
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(tournament.prizePool)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Created by</p>
          <p className="text-sm font-medium">{tournament.creator.name}</p>
        </div>

        {tournament.endDate && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">End Date</p>
            <p className="text-sm font-medium">
              {formatDate(tournament.endDate)}
            </p>
          </div>
        )}

        {onViewAnalytics && (
          <Button
            onClick={() => onViewAnalytics(tournament.id)}
            className="w-full"
          >
            {isLive ? 'View Live Updates' : 'View Analytics'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
