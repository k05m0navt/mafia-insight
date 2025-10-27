'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PlayerStatistics } from '@/components/analytics/PlayerStatistics';
import { TournamentHistory } from '@/components/analytics/TournamentHistory';
import { YearFilter } from '@/components/ui/YearFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlayerStatisticsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

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

      {/* Year Filter */}
      <Card>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="games">Recent Games</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PlayerStatistics
            playerId={playerId}
            year={selectedYear || undefined}
          />
        </TabsContent>

        <TabsContent value="tournaments">
          <Card>
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
          <Card>
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
