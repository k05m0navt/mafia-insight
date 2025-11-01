'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
    club?: {
      id: string;
      name: string;
    } | null;
    roleStats: Array<{
      role: string;
      gamesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
    }>;
  };
  onViewAnalytics?: (playerId: string) => void;
}

const roleColors = {
  DON: 'bg-purple-500',
  MAFIA: 'bg-black dark:bg-gray-700',
  SHERIFF: 'bg-yellow-400',
  CITIZEN: 'bg-red-500',
};

export function PlayerCard({ player, onViewAnalytics }: PlayerCardProps) {
  const winRate =
    player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{player.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              ELO: {player.eloRating}
            </Badge>
            {player.club && (
              <Badge variant="secondary" className="text-sm">
                {player.club.name}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Games</p>
            <p className="text-2xl font-bold">{player.totalGames}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Role Performance</p>
          <div className="flex flex-wrap gap-2">
            {player.roleStats.map((roleStat) => (
              <div key={roleStat.role} className="flex items-center gap-1">
                <Badge
                  className={`${roleColors[roleStat.role as keyof typeof roleColors] || 'bg-gray-500'} text-white`}
                >
                  {roleStat.role}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {roleStat.winRate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {onViewAnalytics && (
          <Button onClick={() => onViewAnalytics(player.id)} className="w-full">
            View Analytics
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
