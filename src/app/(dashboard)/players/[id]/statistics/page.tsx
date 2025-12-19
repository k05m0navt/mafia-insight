'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { PlayerStatistics } from '@/components/analytics/PlayerStatistics';
import { TournamentHistory } from '@/components/analytics/TournamentHistory';
import { RoleBasedMetricsSection } from '@/components/analytics/RoleBasedMetricsSection';
import { ELOTrendsChart } from '@/components/analytics/ELOTrendsChart';
import { WinRateAnalysis } from '@/components/analytics/WinRateAnalysis';
import { PerformanceSummary } from '@/components/analytics/PerformanceSummary';
import { AnalyticsErrorBoundary as ErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { YearFilter } from '@/components/ui/YearFilter';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { RoleFilter } from '@/components/analytics/RoleFilter';
import { FilterIndicator } from '@/components/analytics/FilterIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAnalyticsStore } from '@/store/analyticsStore';

export default function PlayerStatisticsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const {
    dateRange,
    roles,
    setDateRange,
    clearDateRange,
    setRoles,
    clearRoles,
  } = useAnalyticsStore();

  // Check if any analytics queries are currently fetching
  const isAnalyticsLoading =
    useIsFetching({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey.length > 0 &&
          (queryKey[0] === 'roleBasedAnalytics' ||
            queryKey[0] === 'eloTrends' ||
            queryKey[0] === 'winRateAnalysis' ||
            queryKey[0] === 'performanceSummary') &&
          queryKey[1] === playerId
        );
      },
    }) > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/players">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Players
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Player Statistics</h1>
          <p className="text-muted-foreground">
            Detailed performance analytics and tournament history
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="info">
        <CardHeader>
          <CardTitle>Filter Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Date Range</h3>
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Role Filter</h3>
              <RoleFilter
                value={roles}
                onChange={setRoles}
                className="w-full"
              />
            </div>
          </div>
          {(dateRange || roles.length > 0) && (
            <FilterIndicator
              dateRange={dateRange}
              onClearDateRange={clearDateRange}
              roles={roles}
              onClearRoles={clearRoles}
              isLoading={isAnalyticsLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Year Filter */}
      <Card variant="info">
        <CardContent className="pt-6">
          <YearFilter
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Statistics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="role-metrics">Role Metrics</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="games">Recent Games</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ErrorBoundary>
            <PerformanceSummary playerId={playerId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ELOTrendsChart playerId={playerId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <WinRateAnalysis playerId={playerId} />
          </ErrorBoundary>
          <PlayerStatistics
            playerId={playerId}
            year={selectedYear || undefined}
          />
        </TabsContent>

        <TabsContent value="role-metrics">
          <RoleBasedMetricsSection playerId={playerId} />
        </TabsContent>

        <TabsContent value="tournaments">
          <Card variant="chart">
            <CardHeader>
              <CardTitle>Tournament History</CardTitle>
            </CardHeader>
            <CardContent>
              <TournamentHistory
                tournaments={[]} // This would be populated from the API
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card variant="info">
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Recent games will be displayed here</p>
                <p className="text-sm">
                  This section shows the player's most recent game performances
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
