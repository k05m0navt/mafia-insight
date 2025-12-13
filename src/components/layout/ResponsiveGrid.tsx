import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns on mobile (default: 1)
   */
  colsMobile?: 1 | 2;
  /**
   * Number of columns on tablet (default: 2)
   */
  colsTablet?: 2 | 3 | 4;
  /**
   * Number of columns on desktop (default: 3)
   */
  colsDesktop?: 3 | 4 | 6;
  /**
   * Number of columns on large desktop (default: 4)
   */
  colsLarge?: 4 | 6 | 12;
  /**
   * Gap between grid items
   * @default 'md'
   */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const gapMap = {
  sm: 'gap-2', // 8px
  md: 'gap-4', // 16px
  lg: 'gap-6', // 24px
  xl: 'gap-8', // 32px
};

/**
 * Responsive grid component that adapts to different screen sizes
 *
 * Uses mobile-first approach with breakpoints:
 * - Mobile (320px+): 1-2 columns
 * - Tablet (768px+): 2-4 columns
 * - Desktop (1024px+): 3-6 columns
 * - Large Desktop (1440px+): 4-12 columns
 *
 * @example
 * ```tsx
 * <ResponsiveGrid colsMobile={1} colsTablet={2} colsDesktop={3} colsLarge={4}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 * ```
 */
export const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  ResponsiveGridProps
>(
  (
    {
      colsMobile = 1,
      colsTablet = 2,
      colsDesktop = 3,
      colsLarge = 4,
      gap = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const gridCols = {
      mobile: colsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
      tablet:
        colsTablet === 2
          ? 'sm:grid-cols-2'
          : colsTablet === 3
            ? 'sm:grid-cols-3'
            : 'sm:grid-cols-4',
      desktop:
        colsDesktop === 3
          ? 'md:grid-cols-3'
          : colsDesktop === 4
            ? 'md:grid-cols-4'
            : 'md:grid-cols-6',
      large:
        colsLarge === 4
          ? 'lg:grid-cols-4'
          : colsLarge === 6
            ? 'lg:grid-cols-6'
            : 'lg:grid-cols-12',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridCols.mobile,
          gridCols.tablet,
          gridCols.desktop,
          gridCols.large,
          gapMap[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';
