'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TournamentBracketProps {
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
}

const statusColors = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function TournamentBracket({ games }: TournamentBracketProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No games available
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.map((game) => {
            const blackTeam = game.participations.filter(
              (p) => p.team === 'BLACK'
            );
            const redTeam = game.participations.filter((p) => p.team === 'RED');

            return (
              <div key={game.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Game {game.id.slice(-4)}
                    </span>
                    <Badge
                      className={`${statusColors[game.status as keyof typeof statusColors] || 'bg-gray-500'} text-white text-xs`}
                    >
                      {game.status.replace('_', ' ')}
                    </Badge>
                    {game.winnerTeam && (
                      <Badge variant="outline" className="text-xs">
                        Winner: {game.winnerTeam}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(game.date)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Black Team */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gray-800 text-white">
                        BLACK TEAM
                      </Badge>
                      {game.winnerTeam === 'BLACK' && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          WINNER
                        </Badge>
                      )}
                    </div>
                    {blackTeam.map((participation) => (
                      <div
                        key={participation.player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {participation.player.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {participation.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ELO: {participation.player.eloRating}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Red Team */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-500 text-white">RED TEAM</Badge>
                      {game.winnerTeam === 'RED' && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          WINNER
                        </Badge>
                      )}
                    </div>
                    {redTeam.map((participation) => (
                      <div
                        key={participation.player.id}
                        className="flex items-center justify-between p-2 bg-red-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {participation.player.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {participation.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ELO: {participation.player.eloRating}
                        </span>
                      </div>
                    ))}
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
