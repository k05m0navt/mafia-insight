/**
 * Parse dates from gomafia.pro which typically use Russian format (DD.MM.YYYY)
 */

/**
 * Parse a date string in DD.MM.YYYY format or other common formats
 * @param dateStr Date string to parse
 * @returns Date object or current date if parsing fails
 */
export function parseGomafiaDate(dateStr: string | null | undefined): Date {
  if (!dateStr || dateStr.trim() === '') {
    // Return current date as fallback
    return new Date();
  }

  const trimmed = dateStr.trim();

  // Try DD.MM.YYYY format (e.g., "26.10.2025")
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day)
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD.MM.YYYY HH:MM format (e.g., "26.10.2025 14:30")
  const ddmmyyyyHHMMMatch = trimmed.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})$/
  );
  if (ddmmyyyyHHMMMatch) {
    const [, day, month, year, hour, minute] = ddmmyyyyHHMMMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try native Date parsing as last resort
  const nativeDate = new Date(trimmed);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  // Fallback to current date
  console.warn(
    `Failed to parse date: "${dateStr}", using current date as fallback`
  );
  return new Date();
}

/**
 * Format a date to DD.MM.YYYY format for display
 */
export function formatGomafiaDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
