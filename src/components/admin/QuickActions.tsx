'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Download } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Start Import',
      description: 'Trigger a new full or incremental import',
      icon: Download,
      onClick: () => {
        // TODO: Implement import trigger
        console.log('Start import clicked');
      },
    },
    {
      title: 'Refresh Data',
      description: 'Update dashboard and system metrics',
      icon: RefreshCw,
      onClick: () => {
        window.location.reload();
      },
    },
    {
      title: 'View Database',
      description: 'Access database management tools',
      icon: Database,
      onClick: () => {
        // TODO: Navigate to database tools
        console.log('View database clicked');
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start"
              onClick={action.onClick}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.title}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
