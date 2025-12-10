'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { animationClass } from '@/lib/animations';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page transition wrapper component
 * Provides smooth page transitions while respecting prefers-reduced-motion
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={cn(
        animationClass('fadeIn'),
        isTransitioning && 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}
