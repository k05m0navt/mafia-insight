import { resilientDB } from '@/lib/db-resilient';

/**
 * Normalize club name for matching (trim, lowercase, remove extra spaces)
 */
function normalizeClubName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, ''); // Remove special characters for matching
}

/**
 * Find club by name with fuzzy matching (case-insensitive, trimmed)
 *
 * @param clubName Raw club name from scraper
 * @returns Club ID if found, null otherwise
 */
export async function findClubByName(
  clubName: string | null
): Promise<string | null> {
  if (!clubName || clubName.trim() === '') {
    return null;
  }

  const normalized = normalizeClubName(clubName);

  // First try exact match (case-insensitive)
  const exactMatch = (await resilientDB.execute((db) =>
    db.club.findFirst({
      where: {
        name: {
          equals: clubName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })
  )) as { id: string } | null;

  if (exactMatch) {
    return exactMatch.id;
  }

  // Try trimmed match
  const trimmedMatch = (await resilientDB.execute((db) =>
    db.club.findFirst({
      where: {
        name: {
          equals: clubName.trim(),
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })
  )) as { id: string } | null;

  if (trimmedMatch) {
    return trimmedMatch.id;
  }

  // Fallback: Get all clubs and do fuzzy matching in memory
  // This is less efficient but handles edge cases like special characters
  const allClubs = (await resilientDB.execute((db) =>
    db.club.findMany({
      select: { id: true, name: true },
    })
  )) as Array<{ id: string; name: string }>;

  for (const club of allClubs) {
    const clubNormalized = normalizeClubName(club.name);
    if (clubNormalized === normalized) {
      return club.id;
    }
  }

  return null;
}

/**
 * Batch find clubs by names for better performance
 *
 * @param clubNames Array of club names to find
 * @returns Map of club name (normalized) to club ID
 */
export async function findClubsByNames(
  clubNames: (string | null)[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueNames = Array.from(
    new Set(clubNames.filter((n): n is string => !!n && n.trim() !== ''))
  );

  if (uniqueNames.length === 0) {
    return result;
  }

  // Get all clubs
  const allClubs = (await resilientDB.execute((db) =>
    db.club.findMany({
      select: { id: true, name: true },
    })
  )) as Array<{ id: string; name: string }>;

  // Create normalized lookup map
  const normalizedMap = new Map<string, string>();
  for (const club of allClubs) {
    const normalized = normalizeClubName(club.name);
    normalizedMap.set(normalized, club.id);
  }

  // Match input names to clubs
  for (const inputName of uniqueNames) {
    const normalized = normalizeClubName(inputName);
    const clubId = normalizedMap.get(normalized);
    if (clubId) {
      result.set(inputName, clubId);
    }
  }

  return result;
}
