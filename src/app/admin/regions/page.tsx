'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Users,
  Search,
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Region {
  code: string;
  name: string;
  country: string;
  isActive: boolean;
  playerCount: number;
}

interface RegionSummary {
  totalRegions: number;
  activeRegions: number;
  totalPlayers: number;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/regions');

      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }

      const data = await response.json();
      setRegions(data.regions || []);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRegions(regions);
      return;
    }

    const filtered = regions.filter(
      (region) =>
        region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        region.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        region.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredRegions(filtered);
  }, [regions, searchQuery]);

  const toggleRegionStatus = async (regionCode: string) => {
    try {
      const region = regions.find((r) => r.code === regionCode);
      if (!region) return;

      const response = await fetch(`/api/regions/${regionCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !region.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update region status');
      }

      setRegions((prev) =>
        prev.map((r) =>
          r.code === regionCode ? { ...r, isActive: !r.isActive } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update region');
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      US: '🇺🇸',
      CA: '🇨🇦',
      GB: '🇬🇧',
      DE: '🇩🇪',
      FR: '🇫🇷',
      ES: '🇪🇸',
      IT: '🇮🇹',
      RU: '🇷🇺',
      BR: '🇧🇷',
      AU: '🇦🇺',
      JP: '🇯🇵',
      CN: '🇨🇳',
      IN: '🇮🇳',
      MX: '🇲🇽',
      AR: '🇦🇷',
    };

    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchRegions} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Region Management</h1>
          <p className="text-muted-foreground">
            Manage regions and view player distribution
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Region
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Regions
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRegions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Regions
              </CardTitle>
              <ToggleRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeRegions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Players
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPlayers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search regions by name, country, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegions.map((region) => (
          <Card key={region.code} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">
                    {getCountryFlag(region.country)}
                  </span>
                  {region.name}
                </CardTitle>
                <Badge variant={region.isActive ? 'default' : 'secondary'}>
                  {region.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {region.country} • {region.code}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{region.playerCount} players</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRegionStatus(region.code)}
                  >
                    {region.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRegions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No regions found matching your search'
                  : 'No regions available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
