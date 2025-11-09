'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ClubCardProps {
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
    }>;
    _count: {
      players: number;
    };
  };
  onViewAnalytics?: (clubId: string) => void;
}

export function ClubCard({ club, onViewAnalytics }: ClubCardProps) {
  const totalGames = club.players.reduce(
    (sum, player) => sum + player.totalGames,
    0
  );
  const totalWins = club.players.reduce((sum, player) => sum + player.wins, 0);
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const averageElo =
    club.players.length > 0
      ? club.players.reduce((sum, player) => sum + player.eloRating, 0) /
        club.players.length
      : 0;

  return (
    <Card className="w-full flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{club.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {club._count.players} members
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Avg ELO: {averageElo.toFixed(0)}
            </Badge>
          </div>
        </CardTitle>
        {club.description && (
          <p className="text-sm text-muted-foreground">{club.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Games</p>
            <p className="text-2xl font-bold">{totalGames}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Top Performers</p>
          <div className="space-y-2">
            {club.players
              .sort((a, b) => b.eloRating - a.eloRating)
              .slice(0, 3)
              .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ELO: {player.eloRating}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {player.totalGames} games
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Created by</p>
          <p className="text-sm font-medium">{club.creator.name}</p>
        </div>

        {onViewAnalytics && (
          <Button
            onClick={() => onViewAnalytics(club.id)}
            className="w-full mt-auto"
          >
            View Analytics
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
