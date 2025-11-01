'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClubCard } from '@/components/analytics/ClubCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchInput } from '@/components/ui/SearchInput';
import { PageLoading, PageError } from '@/components/ui/PageLoading';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';

interface Club {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  players: Array<{
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
  }>;
  _count: {
    players: number;
  };
}

export default function ClubsPage() {
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();
  const { currentRole } = useRole();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Wait for permissions to load before checking access
    if (!permissionsLoading) {
      fetchClubs();
    }
  }, [search, permissionsLoading]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: Permissions are checked in render, so we don't need to check here
      // But we still handle 403 responses from the API

      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/clubs?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          // Permission denied - this shouldn't happen if permissions are checked correctly
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to fetch clubs');
        }
      } else {
        const data = await response.json();
        setClubs(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (clubId: string) => {
    window.location.href = `/clubs/${clubId}`;
  };

  // Show minimal loading while permissions are being checked (prevent flash)
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-8 h-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-primary border-t-transparent"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission (check BEFORE any content)
  // Admin users should always have access, so double-check with role
  const hasAccess = canAccessPage('/clubs') || currentRole === 'admin';
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clubs</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-red-500">🚫</span>
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You do not have permission to view clubs. Your current role is{' '}
                <strong>{currentRole}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                {currentRole === 'guest'
                  ? 'Please sign in to access this page.'
                  : 'Please contact an administrator if you believe this is an error.'}
              </p>
              <div className="flex gap-2">
                {currentRole === 'guest' && (
                  <Button asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant={currentRole === 'guest' ? 'outline' : 'default'}
                >
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show page loading skeleton only if user has access
  if (loading) {
    return (
      <PageLoading
        title="Clubs"
        showSearch={true}
        showFilters={false}
        cardCount={6}
      />
    );
  }

  if (error) {
    return (
      <PageError
        title="Error Loading Clubs"
        message={error}
        onRetry={fetchClubs}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clubs</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search clubs..."
              onSearch={setSearch}
              debounceMs={300}
            />
          </div>
        </div>

        {clubs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">No clubs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
