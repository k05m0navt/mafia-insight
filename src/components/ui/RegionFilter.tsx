'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  if (loading) {
    return (
      <div className={className}>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Error loading regions" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
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
                {region.name}, {region.country}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
