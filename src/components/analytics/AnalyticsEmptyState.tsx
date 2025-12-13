'use client';

import * as React from 'react';
import { VisualAsset } from '@/components/ui/visual-asset';
import { AnalyticsEmptyStateIllustration } from '@/components/ui/analytics-illustrations';
import { cn } from '@/lib/utils';

export interface AnalyticsEmptyStateProps {
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description or message
   */
  description?: string;
  /**
   * Optional action button
   */
  action?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AnalyticsEmptyState component for empty data states
 *
 * Provides:
 * - Consistent empty state styling
 * - High-quality visual assets (AC1.2 requirement)
 * - Accessible messaging
 *
 * @example
 * ```tsx
 * <AnalyticsEmptyState
 *   title="No data available"
 *   description="Start playing games to see your analytics"
 * />
 * ```
 */
export const AnalyticsEmptyState = React.forwardRef<
  HTMLDivElement,
  AnalyticsEmptyStateProps
>(({ title, description, action, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('container mx-auto px-4 py-12 md:py-16', className)}
      {...props}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Visual Asset */}
        <div className="mb-6">
          <VisualAsset variant="empty-state">
            <AnalyticsEmptyStateIllustration width={300} height={225} />
          </VisualAsset>
        </div>

        {/* Content */}
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
        {description && (
          <p className="text-muted-foreground mb-6">{description}</p>
        )}

        {/* Action */}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
});

AnalyticsEmptyState.displayName = 'AnalyticsEmptyState';
