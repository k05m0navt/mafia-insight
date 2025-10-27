/**
 * Canonical mapping of region name variants to standard names.
 * Used to ensure consistent region data across different gomafia.pro pages.
 */
const REGION_CANONICAL_MAP: Record<string, string> = {
  // Moscow variants
  Москва: 'Москва',
  МСК: 'Москва',
  Moscow: 'Москва',

  // Saint Petersburg variants
  'Санкт-Петербург': 'Санкт-Петербург',
  СПб: 'Санкт-Петербург',
  Питер: 'Санкт-Петербург',
  'Saint Petersburg': 'Санкт-Петербург',
  'St. Petersburg': 'Санкт-Петербург',

  // Nizhny Novgorod variants
  'Нижний Новгород': 'Нижний Новгород',
  'Н.Новгород': 'Нижний Новгород',
  'Nizhny Novgorod': 'Нижний Новгород',

  // Add more mappings as discovered during implementation
};

/**
 * Normalize region names to canonical form for consistent database storage.
 *
 * @param region Raw region name from gomafia.pro
 * @returns Canonical region name or null if empty
 *
 * @example
 * normalizeRegion('МСК') // => 'Москва'
 * normalizeRegion('СПб') // => 'Санкт-Петербург'
 * normalizeRegion('Казань') // => 'Казань' (preserved as-is)
 */
export function normalizeRegion(region: string | null): string | null {
  if (!region || region.trim() === '') {
    return null;
  }

  const trimmed = region.trim();

  // Check canonical map
  if (REGION_CANONICAL_MAP[trimmed]) {
    return REGION_CANONICAL_MAP[trimmed];
  }

  // Fallback: return original (log warning for analysis)
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      `[RegionNormalizer] Unknown region variant: "${trimmed}" - storing as-is`
    );
  }

  return trimmed;
}

/**
 * Get all known region variants for debugging/analysis.
 */
export function getKnownRegions(): string[] {
  return Object.keys(REGION_CANONICAL_MAP);
}

/**
 * Get canonical regions (unique values).
 */
export function getCanonicalRegions(): string[] {
  return Array.from(new Set(Object.values(REGION_CANONICAL_MAP)));
}
