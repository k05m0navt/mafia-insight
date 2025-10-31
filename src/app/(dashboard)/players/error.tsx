'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlayersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Players page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-xl">Failed to Load Players</CardTitle>
              <CardDescription>
                We encountered an error while loading the players data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || 'Failed to fetch players'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
