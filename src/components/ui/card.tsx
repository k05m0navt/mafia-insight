import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/**
 * Card component with enhanced variants for different use cases.
 *
 * @example
 * // Metric Card - optimized for displaying large numbers
 * <Card variant="metric">...</Card>
 *
 * @example
 * // Chart Card - full chart display with title and controls
 * <Card variant="chart">...</Card>
 *
 * @example
 * // Info Card - text content with icon support
 * <Card variant="info">...</Card>
 *
 * @example
 * // Role Card - role-based color theming
 * <Card variant="role" roleType="don">...</Card>
 */
const cardVariants = tv({
  base: 'rounded-xl border bg-card text-card-foreground shadow transition-all',
  variants: {
    variant: {
      // Base variants (existing)
      /**
       * Default Card: Standard card with subtle shadow.
       * - 12px border radius (rounded-xl)
       * - 24px padding (p-6)
       * - Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
       */
      default: 'border-border shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
      /**
       * Elevated Card: Card with enhanced shadow and hover effect.
       * - Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
       * - Hover: 0 4px 12px rgba(0, 0, 0, 0.15)
       */
      elevated:
        'border-border shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
      /**
       * Outlined Card: Card with border emphasis, no shadow.
       * - 2px border
       * - No shadow
       */
      outlined: 'border-2 border-border shadow-none',
      /**
       * Ghost Card: Transparent card with no border or shadow.
       * - Transparent background
       * - No border
       * - No shadow
       */
      ghost: 'border-transparent shadow-none bg-transparent',
      /**
       * Interactive Card: Clickable card with hover states.
       * - Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
       * - Hover: 0 4px 12px rgba(0, 0, 0, 0.15) with primary border accent
       */
      interactive:
        'border-border shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-primary/50 cursor-pointer',
      // Enhanced variants (new)
      /**
       * Metric Card: Optimized for displaying large numbers with trend indicators.
       * - 8px border radius
       * - 20px padding
       * - Subtle shadow (0 1px 2px rgba(0, 0, 0, 0.05))
       */
      metric: 'rounded-lg border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
      /**
       * Chart Card: Full chart display with title and controls area.
       * - Supports chart layout with proper spacing
       */
      chart: 'border-border shadow-sm',
      /**
       * Info Card: Text content with icon support.
       * - Optimized for icon + text layouts
       */
      info: 'border-border shadow-sm',
      /**
       * Role Card: Role-based color theming.
       * - 12px border radius
       * - 24px padding
       * - 2px solid role-based color border
       * - Role-based light color background
       * - Requires 'roleType' prop for color theming
       */
      role: 'rounded-xl border-2',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
    roleType: {
      don: 'bg-purple-50 dark:bg-purple-950/20 border-purple-600 dark:border-purple-500 text-purple-900 dark:text-purple-100',
      mafia:
        'bg-gray-100 dark:bg-gray-800 border-black dark:border-gray-600 text-gray-900 dark:text-gray-100',
      sheriff:
        'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-500 text-yellow-900 dark:text-yellow-100',
      citizen:
        'bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-600 text-red-900 dark:text-red-100',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
  compoundVariants: [
    // Metric variant should use 20px padding (p-5 = 20px)
    {
      variant: 'metric',
      padding: 'default',
      class: 'p-5',
    },
    // Role variant should use 24px padding (p-6 = 24px)
    {
      variant: 'role',
      padding: 'default',
      class: 'p-6',
    },
  ],
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, roleType, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, roleType }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
