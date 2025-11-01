'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TeamStatsProps {
  analytics: {
    memberCount: number;
    totalGames: number;
    totalWins: number;
    winRate: number;
    averageElo: number;
    roleDistribution: Record<string, number>;
    topPerformers: Array<{
      id: string;
      name: string;
      eloRating: number;
      totalGames: number;
      wins: number;
      winRate: number;
    }>;
  };
}

export function TeamStats({ analytics }: TeamStatsProps) {
  const roleColors = {
    DON: 'bg-purple-500',
    MAFIA: 'bg-black dark:bg-gray-700',
    SHERIFF: 'bg-yellow-400',
    CITIZEN: 'bg-red-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Members</span>
              <span className="font-semibold">{analytics.memberCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Games</span>
              <span className="font-semibold">{analytics.totalGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="font-semibold">
                {analytics.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average ELO</span>
              <span className="font-semibold">
                {analytics.averageElo.toFixed(0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.roleDistribution).map(([role, games]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${roleColors[role as keyof typeof roleColors] || 'bg-gray-500'} text-white`}
                  >
                    {role}
                  </Badge>
                </div>
                <span className="font-semibold">{games} games</span>
              </div>
            ))}
            {Object.keys(analytics.roleDistribution).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No role data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topPerformers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ELO: {player.eloRating}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {player.winRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
            {analytics.topPerformers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No performance data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
