/**
 * Region data utilities for filtering and management
 */

export interface Region {
  id: string;
  code: string;
  name: string;
  country?: string;
  isActive: boolean;
  playerCount: number;
}

/**
 * Default regions data (can be imported from GoMafia)
 */
export const defaultRegions: Region[] = [
  {
    id: '1',
    code: 'RU',
    name: 'Russia',
    country: 'Russia',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '2',
    code: 'UA',
    name: 'Ukraine',
    country: 'Ukraine',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '3',
    code: 'BY',
    name: 'Belarus',
    country: 'Belarus',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '4',
    code: 'KZ',
    name: 'Kazakhstan',
    country: 'Kazakhstan',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '5',
    code: 'US',
    name: 'United States',
    country: 'United States',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '6',
    code: 'DE',
    name: 'Germany',
    country: 'Germany',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '7',
    code: 'FR',
    name: 'France',
    country: 'France',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '8',
    code: 'GB',
    name: 'United Kingdom',
    country: 'United Kingdom',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '9',
    code: 'CA',
    name: 'Canada',
    country: 'Canada',
    isActive: true,
    playerCount: 0,
  },
  {
    id: '10',
    code: 'AU',
    name: 'Australia',
    country: 'Australia',
    isActive: true,
    playerCount: 0,
  },
];

/**
 * Get all active regions
 */
export function getActiveRegions(regions: Region[] = defaultRegions): Region[] {
  return regions.filter((region) => region.isActive);
}

/**
 * Get region by code
 */
export function getRegionByCode(
  code: string,
  regions: Region[] = defaultRegions
): Region | undefined {
  return regions.find((region) => region.code === code);
}

/**
 * Get regions by country
 */
export function getRegionsByCountry(
  country: string,
  regions: Region[] = defaultRegions
): Region[] {
  return regions.filter((region) =>
    region.country?.toLowerCase().includes(country.toLowerCase())
  );
}

/**
 * Search regions by name or code
 */
export function searchRegions(
  query: string,
  regions: Region[] = defaultRegions
): Region[] {
  const lowercaseQuery = query.toLowerCase();
  return regions.filter(
    (region) =>
      region.name.toLowerCase().includes(lowercaseQuery) ||
      region.code.toLowerCase().includes(lowercaseQuery) ||
      region.country?.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Sort regions by player count (descending)
 */
export function sortRegionsByPlayerCount(regions: Region[]): Region[] {
  return [...regions].sort((a, b) => b.playerCount - a.playerCount);
}

/**
 * Get region statistics
 */
export function getRegionStats(regions: Region[] = defaultRegions) {
  const activeRegions = getActiveRegions(regions);
  const totalPlayers = activeRegions.reduce(
    (sum, region) => sum + region.playerCount,
    0
  );

  return {
    totalRegions: regions.length,
    activeRegions: activeRegions.length,
    totalPlayers,
    averagePlayersPerRegion:
      activeRegions.length > 0
        ? Math.round(totalPlayers / activeRegions.length)
        : 0,
  };
}
