'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Calendar, Building2 } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardMetrics() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load dashboard metrics</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Total Players',
      value: data.dataVolumes.totalPlayers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Games',
      value: data.dataVolumes.totalGames.toLocaleString(),
      icon: Trophy,
      color: 'text-green-600',
    },
    {
      title: 'Tournaments',
      value: data.dataVolumes.totalTournaments.toLocaleString(),
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Clubs',
      value: data.dataVolumes.totalClubs.toLocaleString(),
      icon: Building2,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
