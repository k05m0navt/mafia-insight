'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Gamepad2, Trophy, Building2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface StatisticsData {
  totalPlayers: number;
  totalGames: number;
  totalTournaments: number;
  totalClubs: number;
  averageEloRating: number;
  totalWins?: number;
  totalLosses?: number;
  lastUpdated?: string;
}

interface PublicStatisticsProps {
  className?: string;
}

const statistics = [
  {
    key: 'totalPlayers',
    label: 'Total Players',
    description: 'Registered players',
    icon: Users,
  },
  {
    key: 'totalGames',
    label: 'Total Games',
    description: 'Completed games',
    icon: Gamepad2,
  },
  {
    key: 'totalTournaments',
    label: 'Tournaments',
    description: 'Tournaments hosted',
    icon: Trophy,
  },
  {
    key: 'totalClubs',
    label: 'Clubs',
    description: 'Active clubs',
    icon: Building2,
  },
  {
    key: 'averageEloRating',
    label: 'Average ELO',
    description: 'Community average',
    icon: TrendingUp,
  },
];

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function PublicStatistics({ className = '' }: PublicStatisticsProps) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatistics() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/public/statistics');

        if (!response.ok) {
          throw new Error(
            `Failed to fetch public statistics. Please try again later.`
          );
        }

        const result = await response.json();

        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof Error
              ? `${err.message} Please try again later.`
              : 'Network error. Please try again later.';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    }

    fetchStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Community Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Community Statistics</CardTitle>
        {data?.lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated:{' '}
            {format(new Date(data.lastUpdated), 'MMM d, yyyy HH:mm')}
          </p>
        )}
      </CardHeader>
      <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;
            const value = data?.[stat.key as keyof StatisticsData] as
              | number
              | undefined;

          return (
              <div key={stat.key} className="text-center">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <Skeleton className="h-6 w-20 mx-auto mb-1 animate-pulse" />
                    <Skeleton className="h-4 w-24 mx-auto animate-pulse" />
                  </>
                ) : (
                  <>
                    <Icon
                      className="h-8 w-8 mx-auto mb-2 text-primary"
                      aria-hidden="true"
                    />
                    <div className="text-2xl font-bold mb-1">
                      {value !== undefined ? formatNumber(value) : '0'}
                </div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.label}
                </div>
                    <div className="text-xs text-muted-foreground">
                  {stat.description}
                    </div>
                  </>
                )}
              </div>
          );
        })}
      </div>
      </CardContent>
    </Card>
  );
}
