'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemHealthBadge() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <Skeleton className="h-6 w-32" />;
  }

  const health = data?.systemHealth;

  if (!health) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  switch (health.status) {
    case 'healthy':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {health.message}
        </Badge>
      );
    case 'degraded':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {health.message}
        </Badge>
      );
    case 'down':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          {health.message}
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
