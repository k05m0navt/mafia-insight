'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FeatureTour() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Tour</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Explore our platform features and capabilities</p>
        </div>
      </CardContent>
    </Card>
  );
}
