'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoleStatsProps {
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    averagePerformance: number;
  }>;
}

const roleColors = {
  DON: 'bg-purple-500',
  MAFIA: 'bg-black',
  SHERIFF: 'bg-yellow-400',
  CITIZEN: 'bg-red-500',
};

const roleDescriptions = {
  DON: 'The leader of the mafia team',
  MAFIA: 'A member of the mafia team',
  SHERIFF: 'The detective who investigates players',
  CITIZEN: 'A regular town member',
};

export function RoleStats({ roleStats }: RoleStatsProps) {
  if (!roleStats || roleStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No role statistics available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roleStats.map((stat) => (
            <div key={stat.role} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${roleColors[stat.role as keyof typeof roleColors] || 'bg-gray-500'} text-white`}
                  >
                    {stat.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {roleDescriptions[
                      stat.role as keyof typeof roleDescriptions
                    ] || ''}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {stat.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">
                    {stat.gamesPlayed}
                  </div>
                  <div className="text-xs text-muted-foreground">Games</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {stat.wins}
                  </div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {stat.losses}
                  </div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
              </div>

              {stat.averagePerformance > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Average Performance
                    </span>
                    <span className="font-medium">
                      {stat.averagePerformance.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
