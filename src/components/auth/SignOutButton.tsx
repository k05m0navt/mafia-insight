'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSignOut?: () => void;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
  onSignOut,
}) => {
  const { logout, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      onSignOut?.();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Signing out...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
};
