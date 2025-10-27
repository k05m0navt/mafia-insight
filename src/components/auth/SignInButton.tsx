'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface SignInButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  redirectTo?: string;
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  redirectTo = '/login',
}) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={redirectTo} className="flex items-center">
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Link>
    </Button>
  );
};
