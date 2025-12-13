import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const iconSizeMap: Record<IconSize, string> = {
  xs: 'h-3 w-3', // 12px
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px
  lg: 'h-6 w-6', // 24px
  xl: 'h-8 w-8', // 32px
};

export interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  /**
   * The Lucide icon component to render
   */
  icon: LucideIcon;
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: IconSize;
  /**
   * ARIA label for accessibility (required if icon is decorative)
   */
  'aria-label'?: string;
  /**
   * Whether the icon is decorative (hidden from screen readers)
   * @default false
   */
  decorative?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Icon component wrapper for consistent Lucide React icon usage
 *
 * Provides:
 * - Consistent sizing across the application
 * - Built-in accessibility support (ARIA labels)
 * - Type-safe icon prop
 *
 * @example
 * ```tsx
 * import { User } from 'lucide-react';
 * <Icon icon={User} size="lg" aria-label="User profile" />
 * ```
 *
 * @example
 * ```tsx
 * // Decorative icon (hidden from screen readers)
 * <Icon icon={Check} decorative />
 * ```
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = 'md',
      'aria-label': ariaLabel,
      decorative = false,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClass = iconSizeMap[size];
    const ariaProps = decorative
      ? { 'aria-hidden': true }
      : ariaLabel
        ? { 'aria-label': ariaLabel }
        : {};

    return (
      <IconComponent
        ref={ref}
        className={cn(sizeClass, className)}
        {...ariaProps}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';
