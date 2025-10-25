'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MemberListProps {
  members: Array<{
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
  onViewPlayer?: (playerId: string) => void;
  onRemovePlayer?: (playerId: string) => void;
  canManage?: boolean;
}

const roleColors = {
  DON: 'bg-purple-500',
  MAFIA: 'bg-black',
  SHERIFF: 'bg-yellow-400',
  CITIZEN: 'bg-red-500',
};

export function MemberList({
  members,
  onViewPlayer,
  onRemovePlayer,
  canManage = false,
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No members found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const winRate =
              member.totalGames > 0
                ? (member.wins / member.totalGames) * 100
                : 0;
            const bestRole = member.roleStats.reduce((best, current) =>
              current.winRate > best.winRate ? current : best
            );

            return (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{member.name}</span>
                    <Badge variant="outline" className="text-sm">
                      ELO: {member.eloRating}
                    </Badge>
                    {bestRole && (
                      <Badge
                        className={`${roleColors[bestRole.role as keyof typeof roleColors] || 'bg-gray-500'} text-white text-xs`}
                      >
                        Best: {bestRole.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {winRate.toFixed(1)}% win rate
                    </span>
                    {onViewPlayer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPlayer(member.id)}
                      >
                        View
                      </Button>
                    )}
                    {canManage && onRemovePlayer && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemovePlayer(member.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">
                      {member.totalGames}
                    </div>
                    <div className="text-xs text-muted-foreground">Games</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {member.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {member.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                </div>

                {member.roleStats.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Role Performance
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.roleStats.map((roleStat) => (
                        <div
                          key={roleStat.role}
                          className="flex items-center gap-1"
                        >
                          <Badge
                            className={`${roleColors[roleStat.role as keyof typeof roleColors] || 'bg-gray-500'} text-white text-xs`}
                          >
                            {roleStat.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {roleStat.winRate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
