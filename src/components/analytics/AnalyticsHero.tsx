'use client';

import * as React from 'react';
import { VisualAsset } from '@/components/ui/visual-asset';
import { AnalyticsHeroIllustration } from '@/components/ui/analytics-illustrations';
import { cn } from '@/lib/utils';

export interface AnalyticsHeroProps {
  /**
   * Title of the analytics section
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the hero illustration
   * @default true
   */
  showIllustration?: boolean;
}

/**
 * AnalyticsHero component for analytics page headers
 *
 * Provides:
 * - Consistent hero section styling
 * - High-quality visual assets (AC1.2 requirement)
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <AnalyticsHero
 *   title="Player Analytics"
 *   subtitle="Comprehensive performance insights"
 * />
 * ```
 */
export const AnalyticsHero = React.forwardRef<
  HTMLDivElement,
  AnalyticsHeroProps
>(({ title, subtitle, className, showIllustration = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('container mx-auto px-4 py-8 md:py-12', className)}
      {...props}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Visual Asset */}
        {showIllustration && (
          <div className="flex-1 w-full max-w-lg">
            <VisualAsset variant="hero">
              <AnalyticsHeroIllustration width={600} height={300} />
            </VisualAsset>
          </div>
        )}
      </div>
    </div>
  );
});

AnalyticsHero.displayName = 'AnalyticsHero';
