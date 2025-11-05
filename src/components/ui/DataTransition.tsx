'use client';

import React from 'react';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

interface DataTransitionProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that provides smooth transitions when data updates
 * Uses React's useTransition to mark updates as non-urgent
 */
export function DataTransition({
  children,
  className,
  fallback,
}: DataTransitionProps) {
  const [isPending] = useTransition();

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isPending ? 'opacity-70' : 'opacity-100',
        className
      )}
    >
      {isPending && fallback ? fallback : children}
    </div>
  );
}
