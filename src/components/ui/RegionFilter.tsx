'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';

interface Region {
  code: string;
  name: string;
  country: string;
  isActive: boolean;
  playerCount: number;
}

interface RegionFilterProps {
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  className?: string;
  multiple?: boolean;
}

export function RegionFilter({
  selectedRegions,
  onRegionsChange,
  className = '',
  multiple = true,
}: RegionFilterProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/regions');

      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }

      const data = await response.json();
      setRegions(data.regions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onRegionsChange([]);
    } else if (multiple) {
      if (selectedRegions.includes(value)) {
        onRegionsChange(selectedRegions.filter((r) => r !== value));
      } else {
        onRegionsChange([...selectedRegions, value]);
      }
    } else {
      onRegionsChange([value]);
    }
  };

  const removeRegion = (regionCode: string) => {
    onRegionsChange(selectedRegions.filter((r) => r !== regionCode));
  };

  const getRegionName = (code: string) => {
    const region = regions.find((r) => r.code === code);
    return region ? `${region.name}, ${region.country}` : code;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Filter by Region
        </label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Filter by Region
        </label>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Filter by Region
      </label>

      <Select
        value={selectedRegions.length === 0 ? 'all' : selectedRegions[0]}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {regions
            .filter((region) => region.isActive)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((region) => (
              <SelectItem key={region.code} value={region.code}>
                <div className="flex items-center justify-between w-full">
                  <span>
                    {region.name}, {region.country}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <Users className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      {region.playerCount}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Selected Regions */}
      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedRegions.map((regionCode) => (
            <Badge
              key={regionCode}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getRegionName(regionCode)}
              <button
                onClick={() => removeRegion(regionCode)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
