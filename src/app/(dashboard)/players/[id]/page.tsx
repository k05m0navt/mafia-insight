'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { RoleStats } from '@/components/analytics/RoleStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlayerAnalytics {
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
  };
  overallStats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    eloRating: number;
  };
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    averagePerformance: number;
  }>;
  trends: Array<{
    date: string;
    value: number;
    change?: number;
  }>;
  rankings: {
    globalRank: number;
    roleRank: Record<string, number>;
  };
}

export default function PlayerAnalyticsPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [analytics, setAnalytics] = useState<PlayerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all_time');

  useEffect(() => {
    fetchAnalytics();
  }, [playerId, selectedRole, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRole) params.append('role', selectedRole);
      params.append('period', timeRange);

      const response = await fetch(
        `/api/players/${playerId}/analytics?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch player analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                Error: {error || 'Player not found'}
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roles = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];
  const timeRanges = [
    { value: 'all_time', label: 'All Time' },
    { value: 'monthly', label: 'Last Month' },
    { value: 'weekly', label: 'Last Week' },
    { value: 'daily', label: 'Last 7 Days' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{analytics.player.name}</h1>
            {analytics.player.club && (
              <Badge variant="secondary" className="mt-2">
                {analytics.player.club.name}
              </Badge>
            )}
          </div>
          <Button onClick={() => window.history.back()}>Back to Players</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={selectedRole === null ? 'default' : 'outline'}
              onClick={() => setSelectedRole(null)}
            >
              All Roles
            </Button>
            {roles.map((role) => (
              <Button
                key={role}
                variant={selectedRole === role ? 'default' : 'outline'}
                onClick={() =>
                  setSelectedRole(selectedRole === role ? null : role)
                }
              >
                {role}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>ELO Rating</span>
                <span className="font-bold">
                  {analytics.overallStats.eloRating}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Games</span>
                <span className="font-bold">
                  {analytics.overallStats.totalGames}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate</span>
                <span className="font-bold">
                  {analytics.overallStats.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Global Rank</span>
                <span className="font-bold">
                  #{analytics.rankings.globalRank}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.overallStats.wins}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {analytics.overallStats.losses}
              </div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart
          data={analytics.trends}
          title="ELO Rating Trend"
          metric="ELO Rating"
        />

        <RoleStats roleStats={analytics.roleStats} />
      </div>
    </div>
  );
}
