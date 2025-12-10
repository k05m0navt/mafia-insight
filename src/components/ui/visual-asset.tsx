'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type VisualAssetVariant =
  | 'hero'
  | 'empty-state'
  | 'illustration'
  | 'decorative';

export interface VisualAssetProps {
  /**
   * Variant of the visual asset
   * @default 'illustration'
   */
  variant?: VisualAssetVariant;
  /**
   * Source path for image (relative to /public or absolute URL)
   */
  src?: string;
  /**
   * Alt text for accessibility (required for images)
   */
  alt?: string;
  /**
   * Width of the image
   */
  width?: number;
  /**
   * Height of the image
   */
  height?: number;
  /**
   * Whether the asset is decorative (hidden from screen readers)
   * @default false
   */
  decorative?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Priority loading for above-the-fold images
   * @default false
   */
  priority?: boolean;
  /**
   * Children to render as SVG illustration (alternative to src)
   */
  children?: React.ReactNode;
}

/**
 * VisualAsset component for high-quality images and visual assets
 *
 * Provides:
 * - Optimized image loading via Next.js Image component
 * - SVG illustration support
 * - Accessibility support (ARIA labels, alt text)
 * - Responsive sizing
 * - Variant-based styling
 *
 * @example
 * ```tsx
 * <VisualAsset
 *   variant="hero"
 *   src="/images/analytics-hero.svg"
 *   alt="Analytics dashboard illustration"
 *   width={800}
 *   height={400}
 *   priority
 * />
 * ```
 *
 * @example
 * ```tsx
 * <VisualAsset variant="empty-state" decorative>
 *   <EmptyStateIllustration />
 * </VisualAsset>
 * ```
 */
export const VisualAsset = React.forwardRef<HTMLDivElement, VisualAssetProps>(
  (
    {
      variant = 'illustration',
      src,
      alt,
      width,
      height,
      decorative = false,
      className,
      priority = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      hero: 'w-full h-auto max-w-4xl mx-auto',
      'empty-state': 'w-full h-auto max-w-md mx-auto opacity-60',
      illustration: 'w-full h-auto',
      decorative: 'w-full h-auto',
    };

    // If children provided, render as SVG illustration container
    if (children) {
      return (
        <div
          ref={ref}
          className={cn(variantClasses[variant], className)}
          aria-hidden={decorative}
          {...props}
        >
          {children}
        </div>
      );
    }

    // If src provided, render as optimized image
    if (src) {
      if (!alt && !decorative) {
        console.warn(
          'VisualAsset: alt text is required for non-decorative images. Provide alt prop or set decorative={true}.'
        );
      }

      return (
        <div
          ref={ref}
          className={cn(variantClasses[variant], className)}
          {...props}
        >
          <Image
            src={src}
            alt={decorative ? '' : alt || ''}
            width={width || 800}
            height={height || 400}
            priority={priority}
            className="w-full h-auto"
            aria-hidden={decorative}
          />
        </div>
      );
    }

    // Fallback: render empty container
    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        aria-hidden={decorative}
        {...props}
      />
    );
  }
);

VisualAsset.displayName = 'VisualAsset';
