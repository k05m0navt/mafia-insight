'use client';

import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * CancelButton component for cancelling running import operations.
 *
 * Features:
 * - Clear "Cancel Import" label by default
 * - Destructive variant for visual warning
 * - Loading state with "Cancelling..." text
 * - Optional icon support
 * - Full accessibility (WCAG 2.2 compliant)
 * - Keyboard accessible
 * - Screen reader friendly
 * - Graceful cancellation (saves checkpoint)
 *
 * Pattern: Inspired by p-queue's AbortController cancellation
 * When clicked, triggers graceful shutdown that:
 * 1. Saves current checkpoint
 * 2. Updates status to "CANCELLED"
 * 3. Preserves resume capability
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CancelButton onClick={handleCancel} />
 *
 * // With loading state
 * <CancelButton onClick={handleCancel} disabled />
 *
 * // With custom text
 * <CancelButton onClick={handleCancel}>
 *   Stop Operation
 * </CancelButton>
 *
 * // With icon
 * <CancelButton onClick={handleCancel} icon={<XIcon />} />
 *
 * // Custom loading text
 * <CancelButton
 *   onClick={handleCancel}
 *   disabled
 *   loadingText="Stopping..."
 * />
 *
 * // With aria-label for context
 * <CancelButton
 *   onClick={handleCancel}
 *   aria-label="Cancel import and save checkpoint"
 * />
 * ```
 */

export interface CancelButtonProps extends Omit<ButtonProps, 'variant'> {
  /**
   * Click handler for cancel action
   */
  onClick: () => void;

  /**
   * Whether the button is in loading/disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom text to display (defaults to "Cancel Import")
   */
  children?: React.ReactNode;

  /**
   * Text to show when in loading state
   * @default "Cancelling..."
   */
  loadingText?: string;

  /**
   * Optional icon to display before text
   */
  icon?: React.ReactNode;

  /**
   * Button variant (defaults to destructive for warning)
   * @default "destructive"
   */
  variant?: ButtonProps['variant'];

  /**
   * Button size
   * @default "default"
   */
  size?: ButtonProps['size'];
}

export const CancelButton = React.forwardRef<
  HTMLButtonElement,
  CancelButtonProps
>(
  (
    {
      onClick,
      disabled = false,
      children,
      loadingText = 'Cancelling...',
      icon,
      variant = 'destructive',
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
        {disabled ? loadingText : children || 'Cancel Import'}
      </Button>
    );
  }
);

CancelButton.displayName = 'CancelButton';
