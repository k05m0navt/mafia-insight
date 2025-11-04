'use client';

import { DashboardMetrics } from '@/components/admin/DashboardMetrics';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { SystemHealthBadge } from '@/components/admin/SystemHealthBadge';
import { QuickActions } from '@/components/admin/QuickActions';
import { ImportControls } from '@/components/admin/ImportControls';
import { SelectiveDataDelete } from '@/components/admin/SelectiveDataDelete';
import { PageLoading, PageError } from '@/components/ui/PageLoading';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: _data, isLoading, error, refetch } = useAdminDashboard();

  // Show loading state
  if (isLoading) {
    return (
      <PageLoading
        title="Admin Dashboard"
        showSearch={false}
        showFilters={false}
        cardCount={6}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <PageError
        title="Admin Dashboard"
        message={error.message || 'Failed to load dashboard data'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with System Health */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SystemHealthBadge />
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Volume Metrics */}
      <DashboardMetrics />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <div className="space-y-6">
          <QuickActions />
          <ImportControls />
          <SelectiveDataDelete />
        </div>
      </div>
    </div>
  );
}
