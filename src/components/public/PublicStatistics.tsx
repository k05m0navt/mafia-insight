'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PublicStatistics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Total Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Total Games</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Active Tournaments</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
