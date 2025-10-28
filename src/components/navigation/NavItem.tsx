'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  label: string;
  path: string;
  icon?: string;
  mobile?: boolean;
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

export function NavItem({
  label,
  path,
  icon,
  mobile = false,
  className = '',
  onClick,
  'data-testid': dataTestId,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === path;

  const baseClasses = mobile
    ? 'flex items-center w-full px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:bg-muted/50 active:scale-95'
    : 'px-3 py-2 rounded-md text-sm font-medium transition-colors';

  const activeClasses = isActive
    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
    : 'text-muted-foreground hover:text-foreground hover:bg-muted';

  const combinedClasses = `${baseClasses} ${activeClasses} ${className}`;

  return (
    <Link
      href={path}
      className={combinedClasses}
      data-testid={dataTestId}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="flex items-center">
        {icon && (
          <span className="mr-3 text-lg" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="font-medium">{label}</span>
      </span>
    </Link>
  );
}
