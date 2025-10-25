'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  className?: string;
}

export function SyncStatusIndicator({
  status,
  className,
}: SyncStatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return {
          label: 'Healthy',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'WARNING':
        return {
          label: 'Warning',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'CRITICAL':
        return {
          label: 'Critical',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      className={cn('font-medium', config.className, className)}
      data-testid="sync-status-indicator"
    >
      {config.label}
    </Badge>
  );
}
