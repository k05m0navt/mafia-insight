'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AdminBootstrapGuardProps {
  children: React.ReactNode;
}

export function AdminBootstrapGuard({ children }: AdminBootstrapGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const router = useRouter();

  const checkBootstrapStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/bootstrap');
      const data = await response.json();

      if (data.needsBootstrap) {
        setNeedsBootstrap(true);
        router.push('/admin/bootstrap');
      } else {
        setNeedsBootstrap(false);
      }
    } catch (err) {
      console.error('Error checking bootstrap status:', err);
      // If we can't check, assume we don't need bootstrap
      setNeedsBootstrap(false);
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkBootstrapStatus();
  }, [checkBootstrapStatus]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (needsBootstrap) {
    return null; // Will redirect to bootstrap page
  }

  return <>{children}</>;
}
