'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Database, RefreshCw, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function QuickActions() {
  type QuickAction = {
    key: string;
    title: string;
    description: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  };

  const actions: QuickAction[] = [
    {
      key: 'open-import',
      title: 'Open Import Center',
      description: 'Manage full imports, retries, and manual sync tools',
      icon: Download,
      href: '/admin/import',
    },
    {
      key: 'refresh-data',
      title: 'Refresh Dashboard Data',
      description: 'Reload metrics and system health information',
      icon: RefreshCw,
      onClick: () => {
        window.location.reload();
      },
    },
    {
      key: 'data-tools',
      title: 'Data Toolbox',
      description: 'Access data cleanup scripts and admin utilities',
      icon: Database,
      onClick: () => {
        console.log('Data toolbox clicked');
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
          const content = (
            <>
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.title}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </>
          );

          return (
            <Button
              key={action.key}
              asChild={Boolean(action.href)}
              variant="outline"
              className="w-full justify-start"
              onClick={action.href ? undefined : action.onClick}
              disabled={action.disabled}
            >
              {action.href ? (
                <Link href={action.href}>{content}</Link>
              ) : (
                content
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
