'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Trophy } from 'lucide-react';

type Feature = {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  sampleData: React.ReactNode;
};

const features: Feature[] = [
  {
    id: 'role-performance',
    title: 'Role Performance Analytics',
    description: 'Track performance across roles with detailed statistics.',
    fullDescription:
      'Track your performance across different roles with detailed statistics, ELO ratings, and win rates.',
    icon: BarChart3,
    sampleData: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">DON</div>
            <div className="text-2xl font-bold">72.5%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">MAFIA</div>
            <div className="text-2xl font-bold">68.2%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">SHERIFF</div>
            <div className="text-2xl font-bold">65.8%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">CITIZEN</div>
            <div className="text-2xl font-bold">61.3%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'elo-rating',
    title: 'ELO Rating & Trends',
    description: 'Monitor ELO rating over time with historical trends.',
    fullDescription:
      'Monitor your ELO rating over time with historical trends and performance insights.',
    icon: TrendingUp,
    sampleData: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Current ELO</div>
            <div className="text-2xl font-bold">1,245</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Peak ELO</div>
            <div className="text-2xl font-bold">1,320</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">This Month</div>
            <div className="text-2xl font-bold text-green-600">+45</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Rank</div>
            <div className="text-2xl font-bold">#127</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'team-club',
    title: 'Team & Club Analytics',
    description: 'Analyze club performance and member rankings.',
    fullDescription:
      'Analyze your club performance, member rankings, and collaborative insights.',
    icon: Users,
    sampleData: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">Team Stats</div>
          <div className="text-sm text-muted-foreground">Coming soon</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tournament',
    title: 'Tournament Performance',
    description: 'Track brackets and analyze tournament performance.',
    fullDescription:
      'Follow tournament updates, track brackets, and analyze tournament performance.',
    icon: Trophy,
    sampleData: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">Tournament Stats</div>
          <div className="text-sm text-muted-foreground">Coming soon</div>
        </div>
      </div>
    ),
  },
];

export function FeatureTour() {
  const [activeFeature, setActiveFeature] = useState(0);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    index: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveFeature(index);
    }
  };

  const activeFeatureData = features[activeFeature];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explore Our Features</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Get a preview of the powerful analytics tools available in Mafia
          Insight
        </p>
      </CardHeader>
      <CardContent>
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = index === activeFeature;

            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleFeatureClick(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-pressed={isActive}
                aria-label={`Select ${feature.title} feature`}
                tabIndex={0}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                  <div className="flex items-start gap-3">
                  <Icon
                    className={`h-5 w-5 mt-0.5 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                      aria-hidden="true"
                  />
                    <div className="flex-1">
                    <div className="font-semibold mb-1">{feature.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {feature.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Feature Preview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{activeFeatureData.title}</CardTitle>
              <Badge variant="secondary">This is a preview with sample data</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeFeatureData.fullDescription}
            </p>
          </CardHeader>
          <CardContent>{activeFeatureData.sampleData}</CardContent>
        </Card>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interactive visualizations and detailed analytics
              </p>
            </CardContent>
          </Card>
          <Card>
          <CardHeader>
              <CardTitle className="text-lg">Performance Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
                Set and track your performance objectives
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a free account to unlock personalized analytics and start
            tracking your performance today
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Sign Up to Access Full Features</Link>
          </Button>
    </div>
      </CardContent>
    </Card>
  );
}
