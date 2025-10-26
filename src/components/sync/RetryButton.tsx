'use client';

import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * RetryButton component for retrying failed import operations.
 *
 * Features:
 * - Clear "Retry Import" label by default
 * - Outline variant for secondary action appearance
 * - Loading state with "Retrying..." text
 * - Optional icon support
 * - Full accessibility (WCAG 2.2 compliant)
 * - Keyboard accessible
 * - Screen reader friendly
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RetryButton onClick={handleRetry} />
 *
 * // With loading state
 * <RetryButton onClick={handleRetry} disabled />
 *
 * // With custom text
 * <RetryButton onClick={handleRetry}>
 *   Retry Failed Operation
 * </RetryButton>
 *
 * // With icon
 * <RetryButton onClick={handleRetry} icon={<RefreshIcon />} />
 *
 * // Custom loading text
 * <RetryButton
 *   onClick={handleRetry}
 *   disabled
 *   loadingText="Starting retry..."
 * />
 * ```
 */

export interface RetryButtonProps extends Omit<ButtonProps, 'variant'> {
  /**
   * Click handler for retry action
   */
  onClick: () => void;

  /**
   * Whether the button is in loading/disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom text to display (defaults to "Retry Import")
   */
  children?: React.ReactNode;

  /**
   * Text to show when in loading state
   * @default "Retrying..."
   */
  loadingText?: string;

  /**
   * Optional icon to display before text
   */
  icon?: React.ReactNode;

  /**
   * Button variant (defaults to outline for secondary action)
   * @default "outline"
   */
  variant?: ButtonProps['variant'];

  /**
   * Button size
   * @default "default"
   */
  size?: ButtonProps['size'];
}

export const RetryButton = React.forwardRef<
  HTMLButtonElement,
  RetryButtonProps
>(
  (
    {
      onClick,
      disabled = false,
      children,
      loadingText = 'Retrying...',
      icon,
      variant = 'outline',
      size = 'default',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
        size={size}
        className={cn(className)}
        {...props}
      >
        {icon && !disabled && <span className="mr-2">{icon}</span>}
        {disabled ? loadingText : children || 'Retry Import'}
      </Button>
    );
  }
);

RetryButton.displayName = 'RetryButton';
